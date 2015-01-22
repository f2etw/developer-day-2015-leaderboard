myApp.controller('BoardCtrl', ['$scope','$rootScope','$http','$mdDialog','$cookieStore', function($scope, $rootScope, $http, $mdDialog, $cookieStore) {
  var leaderBoard = ref.child('leaderBoard');
  $scope.users = [];
  leaderBoard.on('value', function(dataSnapshot) {
    console.log(dataSnapshot.val());
    angular.forEach(dataSnapshot.val(), function(value) {
      console.log(value);
      this.push(value);
    }, $scope.users)
    console.log($scope.users);
    $scope.$apply();
  });
}]);