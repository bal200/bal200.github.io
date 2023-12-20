angular.module('lunchalert-portal')

.controller('CardsCtrl', ['$scope', '$location', '$rootScope',
function($scope, $location, $rootScope) {

  /*******************************************************************************/
  $scope.cards = [];
  $scope.swmId=null; /* vendor parse Obj */
  $scope.vendors={
    input: "",
    list: [],
    loading: false
  };
  $scope.edit={
    card: null, cardForm: null,
    title:"", text:""
  };
  $scope.deleteModal={
    card:null
  };
  $scope.templateSelectVendor = null;
  $scope.showTemplateSelect=0;

  $('.ui.dropdown').dropdown();
  $('.ui.modal').modal({ detachable: false });

  /* Datepicker controls */
  $scope.fromDateChange = function(card) {
    
  };
  $scope.toDateChange = function(card) {
    
  };

  /* HTML Editor Modal */
  $scope.editClick = function(card, cardForm) {
    $scope.edit={
      card: card,
      cardForm: cardForm,
      title: card.title,
      text: card.html
    };
    $('#edit-modal').modal('show');
  }; 
  $scope.editClose = function() {  $('#edit-modal').modal('hide');  };
  $scope.editSave = function() {
    $scope.edit.card.html = $scope.edit.text;
    $('#edit-modal').modal('hide');
    //$scope.edit.cardForm.$setDirty();
  };

  /* Vendor Search Dropdown */
  $scope.vendorPress = function() {
    if (true) {
      /* We want them to have typed at least 3 letters so far */
      if ($scope.vendors.input.length >= 3) {
        console.log("calling findNamedVendors");
        $scope.vendors.loading=true;
        Parse.Cloud.run("findNamedVendors", {
          searchText: $scope.vendors.input
        },{ success: function(res) {
          $scope.$apply(function() {
            $scope.vendors.list = res; $scope.vendors.loading=false;
          });
        }, error: function(err) {
          console.log("loadVendors error ("+err.code+") "+err.message); $scope.vendors.loading=false;
        }});
      }
    }
  }
  $scope.vendorSelect = function( v ) {
    $scope.vendors.input = v.businessName;
    $scope.swmId = v.id;
    $scope.vendors.list = [];
    $scope.loadCards();
  }

  $scope.confirmDelete = function(card) {
    $scope.deleteModal.card=card;
    $('#confirm-delete-modal').modal('show');
  }
  $scope.loadCards = function () {
    //var usrObj = Parse.User.current();
    //var swm = $scope.swm;
    //if ($scope.swm=="") {
    //  var swm = usrObj.id;
    //}
    $scope.vendors.loading=true;
    Parse.Cloud.run("getCardsAndCampaigns", {
        userId: ($scope.swmId ? $scope.swmId : Parse.User.current().id)
    },{
      success: function(res) {
        $scope.$apply(function(){
          console.log("Retrieved cards and campaigns");
          linkCardsToCampaigns(res.cards, res.campaigns)
          $scope.cards = res.cards;
          $scope.vendors.loading=false;
          unpackTemplateVariables($scope.cards);
        });
      },
      error: function(err) { console.log("Error retreiving cards and campaigns ("+err.code+") "+err.message); $scope.vendors.loading=false; }
    });
  };

  function getCurrentVendor() {
    return $scope.swmId ? newParseUser($scope.swmId) : Parse.User.current();
  }

  /* Called on Changes to the text Inputs event.
   * Move the template variables input boxes to the parse object, then call compile
   */
  $scope.applyPicture = function (card, varb) {
    console.log("applyPicture");
    varb.value = 'data:' + varb.picMeta.filetype + ';base64,' + varb.picMeta.base64;
    $scope.applyTemplateVariables(card);

  }

  $scope.applyTemplateVariables = function(card) {
    console.log("applyTemplateVariables");
    card.campaign.set('templateVariables', copyTemplateVars(card.templateVariables) );
    // FIXME decide what we're doing about the picture variable vs image object data
    // Generate the HTML card from template markup
    card.compileTemplate(card.campaign.get('template'), card.templateVariables)
    .then(function(html) {
      $scope.$apply(function() {
        card.html = html; /* trigger the iFrame to redraw */
      });
    });
    card.cardForm.$dirty = true;
  }


  $scope.saveCard = function(card, cardForm) {
    card.save({
      success: function(c) {
        console.log("Saved card "+card.get("title") );
        if (card.campaign) {
          //console.log(card.campaign);
          card.campaign.save({
            success: function(campaign) {
              console.log("Saved campaign "+card.get("title") );    
              $scope.$apply(function() {
                //card.saveText="Saved";
                cardForm.$setPristine();
              });
            }, error: function(e) {console.log("Save Campaign error ("+e.code+") "+e.message);}
          });
        }else {
          $scope.$apply(function() {
            //card.saveText="Saved";
            cardForm.$setPristine();
          });
        }
      }, error: function(e) {console.log("Save Card error ("+e.code+") "+e.message);}
    });
  };
  $scope.deleteCard = function(card) {
    var t = card.get("title");
    var campaign = card.campaign;
    card.destroy({
      success: function(c) {
        console.log("Deleted Card "+t );
        if (campaign) {
          campaign.destroy({
            success: function(ca) {
              console.log("Deleted campaign ");    
              $scope.$apply(function() {
                removeFromArray($scope.cards, card);
              });
            }, error: function(e) {console.log("Delete Campaign error ("+e.code+") "+e.message);}
          });
        }else{
          $scope.$apply(function() {
            removeFromArray($scope.cards, card);
          });
        }
      }, error: function(e) {console.log("Delete Card error ("+e.code+") "+e.message);}
    });
  };
  
  function removeFromArray(array, value) {
    var idx = array.indexOf(value);
    if (idx !== -1) { array.splice(idx, 1); }
    return array;
  }
  $scope.addCard = function() {
    $scope.cards.push(
      Card.create(getCurrentVendor(), "", 1)
    );
  }
  $scope.addTemplateCardClick = function() {
    // this opens up the modal
    $scope.templateSelectVendor = getCurrentVendor();
    $scope.showTemplateSelect++;
  }
  $scope.addTemplateCard = function( newCard ) {
    // the modal creates the new card & campaign objects, add them to  
    $scope.cards.push( newCard );

    newCard.initTemplate(function() {
      $scope.applyTemplateVariables( newCard );
    });
  }
  
  function newParseUser(id) {
    var user = new Parse.User();
    user.id = id; 
    return user;
  }

  $scope.loadCards();


}]);

