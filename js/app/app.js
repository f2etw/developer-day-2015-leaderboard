var myApp = angular.module('myApp', ['ngMaterial','ngRoute','ngCookies','ngSanitize']);
var ref = new Firebase("https://devparty.firebaseio.com");
var until = '2013/12/31';


myApp.config(['$routeProvider',
  function($routeProvider) {
  $routeProvider.
    when('/login', {
      templateUrl: 'views/main.html',
      controller: 'LoginCtrl'
    }).
    when('/fetch', {
      templateUrl: 'views/fetch.html',
      controller: 'FetchCtrl'
    }).
    when('/leaderboard', {
      templateUrl: 'views/leaderboard',
      controller: 'BoardCtrl'
    }).
    otherwise({
      redirectTo: '/login'
    });
}]);



myApp.controller('LoginCtrl', ['$scope','$http','$mdDialog','$cookieStore','$location','$rootScope',
  function($scope, $http, $mdDialog, $cookieStore, $location, $rootScope) {
  var url = 'https://graph.facebook.com/v2.2/521085554595481/feed';
  var today = new Date().getTime();

  $scope.logout = function() {
    console.log('unauth');
    ref.unauth();
  }
  $scope.loginWithFB = function() {
    ref.authWithOAuthPopup("facebook", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
        $mdDialog.show(
          $mdDialog.alert()
            .title(error.code)
            .content(error.message)
            .ariaLabel('Password notification')
            .ok('確定')
        );
      } else {
        console.log(authData);
        $scope.accessToken = authData.facebook.accessToken;
        // save cookies
        $cookieStore.put('expire', authData.expires);
        $cookieStore.put('accessToken', authData.facebook.accessToken);
        $cookieStore.put('uid', authData.facebook.id);
        $cookieStore.put('name', authData.facebook.displayName);
        $rootScope.fbId = authData.facebook.id;
        $location.path('/fetch');
        $scope.$apply();

     
      }
    }, {
      scope: "email, public_profile, user_friends"
    });
  }
}]);