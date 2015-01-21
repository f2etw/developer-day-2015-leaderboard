myApp.controller('FetchCtrl', ['$scope','$rootScope','$http','$mdDialog','$cookieStore', function($scope, $rootScope, $http, $mdDialog, $cookieStore) {
  console.log($cookieStore.get('expire'));
  console.log($cookieStore.get('accessToken'));
  $scope.accessToken = $cookieStore.get('accessToken');
  $scope.uid = $cookieStore.get('uid');
  $rootScope.fbId = $cookieStore.get('uid')
  $scope.groups = [
                    521085554595481,
                    262800543746083,
                    692613640799274,
                    1464131500488875, 
                    1439747729634154
                  ];
  $scope.totalPosts = [];
  $scope.totalComments = [];
  $scope.pushPostInArray = function(userPosts) {
    angular.forEach(userPosts, function(post) {
      this.push(post);
    }, $scope.totalPosts);
  }
  $scope.totalLikeCount = 0;
  $scope.countTotalLike = function(like) {
    $scope.totalLikeCount += like;
  }
  $scope.countTotalComment = function(comments) {
    angular.forEach(comments, function(comment) {
      this.push(comment);
    }, $scope.totalComments);
  }
}]);

myApp.directive('fetchData', ['$http','$cookieStore','$sce','$mdDialog','$q', 'TempPosts', function($http, $cookieStore, $sce, $mdDialog, $q, TempPosts) {
  return {
    link: function($scope, iElm, iAttrs) {
      var url = 'https://graph.facebook.com/v2.2/'+ iAttrs.fetchData +'/feed?comments.limit(150)&limit=150';
      var infoUrl = 'https://graph.facebook.com/v2.2/'+ iAttrs.fetchData + '?access_token='+ $scope.accessToken;
      var today = new Date().getTime();

      // 取得社團簡介
      $scope.getGroupInfo = function() {
        $http.get(infoUrl).
        success(function(data, status, headers, config) {
          $scope.groupName = data.name;
          var description = data.description.replace(/\n/g, "<br>");
          $scope.groupDescription = $sce.trustAsHtml(description); 
        }).
        error(function(data, status, headers, config) {
          alert('喔喔！有錯誤');
        });
      }
      $scope.getGroupInfo();

      // 取得貼文
      $scope.feeds = [];
      $scope.next = url+'&access_token='+ $scope.accessToken;
      $scope.nextPage = function() {
        $http.get($scope.next).
        success(function(data, status, headers, config) {
          if (!data.paging) {
            $scope.progress = 100;
            $scope.findUserPosts();
            // 儲存
            localStorage.setItem(iAttrs.fetchData, angular.toJson($scope.feeds));
            $cookieStore.put(iAttrs.fetchData + 'update', new Date().getTime());
            return;
          } else {
            $scope.next = data.paging.next;
          }
          angular.forEach(data.data, function(feed) {
            this.push(feed);
          }, $scope.feeds);
          var currentTime = new Date($scope.feeds[$scope.feeds.length - 1].created_time).getTime();
          // console.log($scope.feeds[$scope.feeds.length - 1].created_time);
          var untilTime = new Date(until).getTime();
          if (currentTime >= untilTime) {
            $scope.nextPage();
            $scope.progress = Math.floor(( 1 - (currentTime - untilTime)/(today - untilTime) )*100);
          } else {
            $scope.progress = 100;
            $scope.findUserPosts();
          }
          
        }).
        error(function(data, status, headers, config) {

        });
      };

      $scope.countLikes = function(posts) {
        var postList = [];
        angular.forEach(posts, function(value) {
          // console.log(value.id);
          this.push(
            $http({
              method: 'GET',
              url: 'https://graph.facebook.com/v2.2/'+value.id+'/likes' + '?access_token='+ $scope.accessToken + '&summary=true'
            })
          )
        }, postList);
        // console.log(postList);
        $q.all(postList).then(function(res) {
          // console.log(res);
          var total_count = 0;
          angular.forEach(res, function(value) {
            // console.log(value.data.summary.total_count);
            total_count += value.data.summary.total_count;
          })
          $scope.total_count = total_count;
          $scope.countTotalLike(total_count);
        })
      }



      $scope.userPosts = [];
      $scope.userComments = [];
      $scope.findUserPosts = function() {
        angular.forEach($scope.feeds, function(feed) {
          if (feed.from.id == $scope.uid ) {
            this.push(feed);
          }
          if (!feed.comments) {
            return
          } else {
            angular.forEach(feed.comments.data, function(comment) {
              if (!comment.from) { return; }
              if (comment.from.id == $scope.uid) {
                this.push(comment);
              }
            }, $scope.userComments);
          }
        }, $scope.userPosts);
        // console.log($scope.userPosts);
        // console.log($scope.userComments);
        TempPosts[iAttrs.fetchData] = $scope.userPosts;
        $scope.countLikes($scope.userPosts);
        $scope.pushPostInArray($scope.userPosts);
        $scope.countTotalComment($scope.userComments);
        // 儲存
        localStorage.setItem(iAttrs.fetchData + 'feed', angular.toJson($scope.userPosts));
        localStorage.setItem(iAttrs.fetchData + 'comment', angular.toJson($scope.userComments));
        $cookieStore.put(iAttrs.fetchData + 'update', new Date().getTime());
      };

      $scope.refreshPage = function() {
        localStorage.removeItem(iAttrs.fetchData + 'feed');
        localStorage.removeItem(iAttrs.fetchData + 'comment');
        $scope.userPosts = [];
        $scope.feeds = [];
        $scope.nextPage();
      }

      var storeData = angular.fromJson(localStorage.getItem(iAttrs.fetchData + 'feed'));
      if (storeData) {
        $scope.lastUpdate = new Date($cookieStore.get(iAttrs.fetchData + 'update'));
        $scope.progress = 100;
        $scope.userPosts = storeData;
        $scope.userComments = angular.fromJson(localStorage.getItem(iAttrs.fetchData + 'comment'));
        $scope.pushPostInArray($scope.userPosts);
        $scope.countTotalComment($scope.userComments);
        $scope.countLikes($scope.userPosts);
        // $scope.findUserPosts();
        // $scope.countComments($scope.feeds);
      } else {
        $scope.feeds = [];
        $scope.nextPage();
      }
    }
  };
}]);