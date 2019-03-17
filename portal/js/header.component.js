angular.module('lunchalert-portal')

.component('portalheader', {
  bindings: {
    //vendor: '<',
    //onSave: '&'
  },
  templateUrl: 'templates/header.htm',
  controller: ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
    if ($rootScope.isLoggedIn==false) { /* redirect if not logged in */
      $location.path('/login');
    }

    this.$onInit = function() {
      if ($rootScope.user)  $scope.business = $rootScope.user.get('businessName');
    };
console.log("header controller");

    this.$onChanges = function(changesObj) {
      console.log("header: onChanges.");
    }

    $scope.logout = function() {
      console.log("logout()");

      Parse.User.logOut();
      $rootScope.user = null;
      $rootScope.isLoggedIn = false;
      $location.path('/login');
    };



  }]
});

