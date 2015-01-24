myApp.controller('BoardCtrl', ['$scope','$rootScope','$http','$mdDialog','$cookieStore', function($scope, $rootScope, $http, $mdDialog, $cookieStore) {
  
  $scope.initSound = function() {
    createjs.Sound.registerSound("audio/se_maoudamashii_chime13.mp3", "welcome");
  }
  $scope.initSound();
  var leaderBoard = ref.child('leaderBoard');
  $scope.users = [];
  leaderBoard.on('child_added', function(snapshot) {
    console.log(snapshot.val());
    $scope.users.push(snapshot.val());
    $scope.users.sort(function(a, b) {
      return b.score - a.score
    });
    createjs.Sound.play("welcome");
    $scope.$apply();
  });
  leaderBoard.on('child_changed', function(snapshot) {
    var updateData = snapshot.val();
    angular.forEach($scope.users, function(user) {
      if (user.uid == updateData.uid) {
        user.score = updateData.score;
      }
    });
    $scope.users.sort(function(a, b) {
      return b.score - a.score
    });
    createjs.Sound.play("welcome");
    $scope.$apply();
  });
  
}]);