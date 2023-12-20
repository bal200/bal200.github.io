angular.module('lunchalert-portal')

.controller('offerWizardCtrl', ['$scope',  '$location', '$rootScope',
  function($scope,  $location, $rootScope) {

    $scope.card = null;
    $scope.page = 1;
    $scope.data = {pic:{}};
    $scope.finishDisabled=false;
    $scope.businessName = getCurrentVendor().get('businessName');

    $scope.pageNext = function() {
      if ($scope.page <= 6) $scope.page++;
      if ($scope.page==5) {
        if (isTemplated()) {
          $scope.card.compileTemplate($scope.card.campaign.get('template'), $scope.card.campaign.templateVariables)
          .then(function(html) {
            $scope.$apply(function() {
              $scope.card.html = html;
            });
          });
        }
      }
      if ($scope.page==4) {
        enableSchedulerAndSetNoti();
      }
    }
    $scope.pageBack = function() {
      if ($scope.page > 1) $scope.page--;
    }

    var newCard = function() {
      $scope.card = Card.create(getCurrentVendor(), "", 1);
      createCampaign();
    }
    var createCampaign = function() {
      $scope.card.campaign = Campaign.create($scope.card.get("vendor"), "", $scope.card);
      $scope.card.schedulerOn = false; /* this also causes the campaign to get set to defaults */
    }

    var loadTemplate = function() {
      var query1 = new Parse.Query(CardTemplate);
      var query2 = new Parse.Query(CardTemplate);
      query1.equalTo("vendor", getCurrentVendor() );  /* templates for this vendor  */
      query2.equalTo("vendor", null );         /* OR templates for ANY vendor */
      var query = Parse.Query.or(query1, query2);
      query.equalTo("default", true ); 
      query.find().then(function(templates) {
          var template = pickTheDefaultTemplate( templates );
          $scope.card.campaign.template = template;
          $scope.card.initTemplate(function() {
            $scope.$apply();
          });
      });
    }
    var pickTheDefaultTemplate = function(templates) {
      for (var t of templates) {
        if (t.get('vendor') && t.get('vendor').id == getCurrentVendor().id ) return t;
      }
      for (var t of templates) {
        if (t.get('vendor') == null ) return t;
      }
    }

    /* save the card & campaign parse objects */
    $scope.saveCard = function() {
      return new Promise(function(resolve, reject) {
        var card = $scope.card;
        card.save({
          success: function(c) {
            if (card.campaign) {
              card.campaign.save({
                success: function(campaign) {
                  resolve();
                }, error: function(e) {console.log("Save Campaign error ("+e.code+") "+e.message); reject()}
              });
            }else {
              resolve();
            }
          }, error: function(e) {console.log("Save Card error ("+e.code+") "+e.message); reject()}
        });
      });
    };

    $scope.finished = async function() {
      $scope.finishDisabled=true;
      if (isTemplated()) {
        let html = await $scope.card.compileTemplate($scope.card.campaign.get('template'), $scope.card.campaign.templateVariables)
        $scope.card.html = html;
      }
      await checkIfShouldSendNotiNow($scope.card);
      await $scope.saveCard();
      if ( !$rootScope.currentCard ) {
        $rootScope.cards.push($scope.card);
      }
      notifyUs();
      $scope.$apply(function() {
        $scope.finishDisabled=false;
        $location.path('/portal/offers');
      });
    }

    /** if the start time is in the past, trigger the notification to send now.  Also sets the notiStatus to SENT to avoid double sends.  */
    var checkIfShouldSendNotiNow = function(card) {
      console.log("checkIfShouldSendNotiNow: ", card.campaign.notiType)
      return new Promise(function(resolve, reject) {
        if (card.campaign.notiType === 2 &&
            new Date() > card.campaign.startDate &&
            new Date() < card.campaign.endDate) {
          console.log("checkIfShouldSendNotiNow: start time is in the past, and its an 'update' type, so sending noti now.")
          Parse.Cloud.run("sendCampaignNotification", {
            campaignId: card.campaign.id,
          },{ success: function(res) {
            console.log("sendCampaignNotification: success");
            card.set('active', true);
            resolve();
          }, error: function(err) {
            console.log("sendCampaignNotification: error ("+err.code+") "+err.message);
            reject();
          }});
        }else{
          resolve();
        }
      });
    }

    var notifyUs = function() {
      Parse.Cloud.run("notifyUs", {
        message: "Offer card saved by " + $rootScope.user.get('businessName') 
          + " called " + $scope.card.title
      },{ success: function(res) {
        console.log("notify us sent");
        /*  */
      }, error: function(err) {
        console.log("notify error ("+err.code+") "+err.message);
      }});

    }

    $scope.base64Change = function() {
      //$scope.card.campaign.picture = $scope.picture;
      $scope.card.campaign.picture = 'data:' + $scope.data.pic.filetype + ';base64,' + $scope.data.pic.base64;
      if (isTemplated()) {
        $scope.card.compileTemplate($scope.card.campaign.get('template'), $scope.card.campaign.templateVariables)
        .then(function(html) {
          $scope.$apply(function() {
            $scope.card.html = html;
          });
        });
      }
    }

    $scope.fromDateChange = function() {
      $scope.dateError="";
      if ($scope.card.campaign.endDate)  {
        if ($scope.card.campaign.startDate > $scope.card.campaign.endDate) {
          $scope.card.campaign.startDate = $scope.card.campaign.endDate;
          $scope.dateError = "Start date must be before the finish date";
        }
        enableScheduler();
      }
    }
    $scope.toDateChange = function() {
      $scope.dateError="";
      if ($scope.card.campaign.startDate) {
        if ($scope.card.campaign.startDate > $scope.card.campaign.endDate) {
          $scope.card.campaign.endDate = $scope.card.campaign.startDate;
          $scope.dateError = "Finish date must be after the start date";
        }
        enableScheduler();
      }
    }

    var enableScheduler = function() {
      $scope.card.schedulerOn = true;
      //$scope.card.campaign.notiOn = true;
      //if (!$scope.card.campaign.notiText) {
      //  $scope.card.campaign.notiText = "New "+$scope.businessName+" offer today";
      //}
      
    }
    var enableSchedulerAndSetNoti = function() {
      $scope.card.schedulerOn = true;
      $scope.card.campaign.notiOn = true;
      if (!$scope.card.campaign.notiText) {
        $scope.setNotification(1);
      }
      
    }

    $scope.setNotification = function( choice ) {
      $scope.card.campaign.notiOn = true;
      $scope.card.campaign.notiType = choice;
      switch (choice) {
        case 1: $scope.card.campaign.notiText = "New "+$scope.businessName+" offer today"; break;
        case 2: $scope.card.campaign.notiText = "Update from "+$scope.businessName+""; break;
        //case 3: $scope.card.campaign.notiText = "New offer today"; break;
        //case 4: $scope.card.campaign.notiText = "New "+$scope.businessName+" menu today"; break;
      }
    }

    $scope.cancelEdit = function() {
      $location.path('/portal/offers');
    }

    $scope.deleteConfirm = function() {
      $('.ui.basic.modal')
        .modal('show')
      ;
    }

    /*
     * Delete a campaign and card
     *
     * * TODO should this live in a lib/classes/* prototype instead?
     */
    $scope.deleteOffer = function() {
      var campaign = $scope.card.campaign;
  
      $scope.card.destroy({
        success: function(c) {
          if (campaign) {
            campaign.destroy({
              success: function(ca) {
              },
              error: function(e) {console.log("Delete Campaign error ("+e.code+") "+e.message);}
            });
          }
        }, error: function(e) {console.log("Delete Card error ("+e.code+") "+e.message);}
      });

      // Remove card from array to force display to update iommediately
      $rootScope.cards = $rootScope.cards.filter(function( card ) {
        return card.id !== $scope.card.id;
      });
      
      $('.ui.basic.modal')
        .modal('hide')
      ;

      $location.path('/portal/offers');
    }

    // TODO should we go back to offers list page if $rootScope.cards null?

    $scope.card = $rootScope.currentCard; //$stateParams.card;
    
    //if ($scope.card) $scope.picture = $scope.card.campaign.picture; // hack as getters & settings not working with base64 input

    if ($scope.card == null) {
      newCard();
      loadTemplate();
    }
    if ($scope.card.campaign == null) {
      createCampaign();
    }

    function getCurrentVendor() {
      return $scope.swmId ? newParseUser($scope.swmId) : Parse.User.current();
    }
    function isTemplated() {
      if ($scope.card.campaign && $scope.card.campaign.get('template')) return true;
      else return false;
    }
    
  }
]);