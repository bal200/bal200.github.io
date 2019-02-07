angular.module('pageCtrl',['jkuri.datepicker'])
.controller('pageCtrl', ['$scope', '$location', '$rootScope',
function($scope, $location, $rootScope) {

  /* Put a fancy menu page here */

  $location.path('/login');

  if ($rootScope.isLoggedIn==false) { /* redirect if not logged in */
    $location.path('/login');
  }

}])


.controller('userCtrl', ['$scope', '$rootScope', '$location',
function( $scope, $rootScope, $location ) {
  $scope.user = {
    username: null,
    password: null
  };

  $scope.error = {};

  $scope.login = function() {
    var user = $scope.user;
    Parse.User.logIn(('' + user.username).toLowerCase(), user.password, {
      success: function(user) {
        $rootScope.user = user;
        $rootScope.isLoggedIn = true;
        $location.path("/portal");
        $scope.$apply();
      },
      error: function(user, err) {
        // The login failed. Check error to see why.
        $scope.error.message = err.message;
        console.log('Login failed: '+err.code +" "+ err.message);
        $scope.$apply();
      }
    });
    return false;
  };
  $scope.logout = function() {
    Parse.User.logOut();
    $rootScope.user = null;
    $rootScope.isLoggedIn = false;
    $location.path('/');
  };

  $scope.forgot = function() {
    //$state.go('app.forgot');
  };
}])

.controller('offersCtrl', [], function($scope, $rootScope) { })

/******************************** PORTAL CONTROLLER ************************************************/
.controller('portalCtrl', ['$scope', '$rootScope', '$location', 'uiGmapGoogleMapApi',
function( $scope, $rootScope, $location, uiGmapGoogleMapApi ) {

  uiGmapGoogleMapApi.then(function(maps){
  });

  $('.button.popup-activator')
    .popup({
      inline: true,
      on: 'click'
    });

  if ($rootScope.isLoggedIn==false) { /* redirect if not logged in */
    $location.path('/login');
  }
  $scope.gotoRegisterPage = function() {
    $location.path('/portal_register');
  }
  $scope.showPopup = false;
  $scope.editButtonDisabled = "disabled"; /* Class to add to edit button to turn it off */
  $scope.swm="";
  $scope.map = { center: { latitude: 53.5, longitude: -2.5 },
                 zoom: 9,
                 options: { scaleControl:"true" } };
  $scope.markers=[];
  $scope.instMarkers=[];

  $scope.arrivalClick = function() {
    if ($scope.arrivalTick==true) {
      loadArrivals();
    }else{
      $scope.markers = [];
    }
  };
  $scope.installClick = function() {
    if ($scope.installTick==true) {
      loadInstalls();
    }else{
      $scope.instMarkers = [];
    }
  };
  $scope.editModeClick = function() {
    $scope.installChange();
  };

  $scope.arrivalChange = function() {
    if ($scope.arrivalTick==true) {
      $scope.markers = [];
      //$scope.$apply();
      loadArrivals();
    }
  };
  $scope.installChange = function() {
    if ($scope.installTick==true) {
      $scope.instMarkers = [];
      loadInstalls();
    }
  };
  //$scope.dateChange = function() {
  //    $scope.arrivalChange();
  //    $scope.installChange();
  //};
  $scope.vanChange = function() {
    if ($scope.selectedVan == "") { /* All Vans selected */
      $scope.vanName = "";
      $scope.editButtonDisabled = "disabled";
    }else{
      $scope.vanName = $scope.vanList[$scope.selectedVan].name;
      $scope.editButtonDisabled = ""; /*On*/ }
    $scope.arrivalChange();
  };

  $scope.changeVanName = function () {
    var usrObj = Parse.User.current();
    var swm = $scope.swm;
    if ($scope.swm=="") {
      var swm = usrObj.id;
    }
    Parse.Cloud.run("editVanName", {
        userid: swm,
        van: $scope.vanList[$scope.selectedVan].objId,
        name: $scope.vanName
    },{
      success: function(res) {
        $scope.$apply(function(){
          console.log("Saved new Van name "+$scope.vanName);
          $scope.vanList[$scope.selectedVan].name = $scope.vanName;
        });
        $('.button.popup-activator').popup('hide');
      },
      error: function(err) { console.log("Error saving new Van name ("+err.code+") "+err.message); }
    });
  };

  /* Call to populate the Van list */
  $scope.populateVanList = function() {
    var usrObj = Parse.User.current();
    if ($scope.swm=="") {
      var swm = usrObj.id;
    }else{
      var swm = $scope.swm;
    }
    Parse.Cloud.run("getVanList", {
        userid: swm /* */
        //vanId: 0 //$scope.vanId
    },{
      success:function(res) {
        $scope.$apply(function () {
          $scope.vanList=[];
          for (var i = 0; i < res.length; i++) {
            van = {
                id: i,
                objId: res[i].id,
                vanId: res[i].get("vanId"),
                vanIdCrop: res[i].get("vanId").substr(0,5),
                name: res[i].get("name"),
                vendor: res[i].get("vendor")
            };
            $scope.vanList.push( van );
          }
          console.log("Got the Van list, "+res.length+" results.");
        });
      },
      error: function(err) { alert("get Vans error: "+err.code+" "+err.message); }
    });
  }

  $scope.populateVanList();

  /***************************** load Installs(), Customers Markers **************************************/
  function loadInstalls() {
    // Get the Customer Installs data from the Parse server
    var query = new Parse.Query(Parse.Installation);
    var usr = Parse.User.current();
    if ($scope.swm=="") {
      var swm = usr.id;
    }else{
      var swm = $scope.swm;
    }
    //query.equalTo('vanId', vansid);
    /* @Todo: Date range */
    var fromDate=null, toDate=null;
    if ($scope.installFromDate!=null & $scope.installFromDate!="") {
      //alert("scope.fromDate "+$scope.fromDate);
      fromDate=new Date($scope.installFromDate);
    }
    if ($scope.installToDate!=null & $scope.installToDate!="") {
      toDate=new Date($scope.installToDate);
      toDate.setHours(23); toDate.setMinutes(59); toDate.setSeconds(59); /* needs to be the end of this day to be inclusive */
    }

    Parse.Cloud.run("getCustInstalls", {
        userid: swm, /* The S is put on by the cloud code; can ignore here */
        dateFrom: fromDate, //$scope.dateFrom,
        dateTo: toDate, //$scope.dateTo,
        vanId: 0 //$scope.vanId
    },{
      success:function(res) {
        for (var i = 0; i < res.length; i++) {
          var inst = res[i];
          if (inst.coords && inst.coords.latitude) {
            var marker = {
              id: i,
              objectId: inst.objectId,
              coords: {latitude: inst.coords.latitude,
                      longitude: inst.coords.longitude},
              options: {
                draggable: $scope.editMode,
                icon: "../markers/red_MarkerC.png"
              },
              events: {
                dragend: function (marker, eventName, args) {
                  //console.log(marker);
                  var objectId = marker.model.$parent.imarker.objectId; /* convoluted way, but it works */
                  Parse.Cloud.run("setInstallLocation", {
                    userid: swm,
                    objectId: objectId,
                    lat: marker.getPosition().lat(),
                    lon: marker.getPosition().lng()
                  },{
                    success: function(res){
                      console.log("successfully saved "+res)
                    },
                    error: function(err) {
                      console.log("not able to save change to location: "+err.code+" "+err.message);
                      alert("not able to save change to location: "+err.code+" "+err.message);
                    }
                  });
                }
              }
            };
            if ($scope.showCustObjectIds == true) {
              marker.options.labelContent = inst.objectId;
              if (inst.comment)  marker.options.labelContent += " - "+inst.comment;
            }else{
              if (inst.comment)  marker.options.labelContent = inst.comment;
            }
            $scope.instMarkers.push( marker );
          }
        }
        console.log("Got "+res.length+" Installs results.");
        $scope.$apply();

      },
      error: function(err) { alert("get installations error: "+err.code+" "+err.message); }
    });

  }

  /*************************** load Arrivals(), Vendor Markers *****************************************/
  function loadArrivals() {
    // Get the Arrivals data from the Parse server
    var Arrival = Parse.Object.extend("Arrival");
    var query = new Parse.Query(Arrival);
    if ($scope.swm=="") {
      var usr = Parse.User.current();
    }else{
      var usr=new Parse.User();
      usr.id = $scope.swm;
    }

    query.equalTo('vendor', usr);

    /* Set a Date range */
    if ($scope.arrivalFromDate!=null & $scope.arrivalFromDate!="") {
      query.greaterThan("createdAt", new Date($scope.arrivalFromDate));
    }
    if ($scope.arrivalToDate!=null & $scope.arrivalToDate!="") {
      var d=new Date($scope.arrivalToDate);
      d.setHours(23); d.setMinutes(59); d.setSeconds(59); /* needs to be the end of this day to be inclusive */
      query.lessThan("createdAt", d);
    }

    if ($scope.selectedVan!=null & $scope.selectedVan!="") {
      query.equalTo('vanId', $scope.vanList[$scope.selectedVan].vanId );
    }
    //var d = new Date(document.getElementById('fromdate').value)
    //alert ("from date "+ d.getDate()+" "+ d.getMonth()+" "+ d.getFullYear() );

    query.limit(1000);  /* default is 100, but we need as many results as we can */

    query.find({
      success: function(res) {
        //alert("Successfully retrieved " + res.length + " arrival records.");
        $scope.$apply(function () {
          for (var i = 0; i < res.length; i++) {
            var object = res[i];
            var loc = object.get('location');
            //alert("at: "+dateFormat(date(object.createdAt), "dd-mmm-yy hh:MM"));
            var marker = {
                  id: i,
                  coords: {latitude: loc.latitude,
                          longitude: loc.longitude},
                  options: {
                    /* label: "V", */
                    //labelContent: formatDate(new Date(object.createdAt)),
                    icon: "../markers/blue_MarkerV.png"
                  }
            };
            if ($scope.showArrivalTimes == true) {
              var d=new Date(object.createdAt);
              marker.options.labelContent = ""+digit2(d.getHours())+":"+digit2(d.getMinutes());
            }
            $scope.markers.push( marker );
          }
        });
        console.log("Got "+res.length+" arrivals results.");
        //$scope.$apply();
      },
      error: function(err) { alert("get arrivals error: "+err.code+" "+err.message); }
    });
  }

  function digit2(n){ return n > 9 ? ""+n : "0"+n }

  $scope.logout = function() {
    Parse.User.logOut();
    $rootScope.user = null;
    $rootScope.isLoggedIn = false;
    $location.path('/login');
  };

  function formatDate( date ) {
    var day = date.getDate();
    var month = date.getMonth();
    var year = ""+date.getFullYear();
    return day+"-"+month+"-"+year.substr(-2);

  }


}]);
