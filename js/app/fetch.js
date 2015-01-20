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
}]);

myApp.directive('fetchData', ['$http','$cookieStore','$sce','$mdDialog','$q', function($http, $cookieStore, $sce, $mdDialog, $q){
  return {
    link: function($scope, iElm, iAttrs) {
      var url = 'https://graph.facebook.com/v2.2/'+ iAttrs.fetchData +'/feed';
      var infoUrl = 'https://graph.facebook.com/v2.2/'+ iAttrs.fetchData + '?access_token='+ $scope.accessToken;
      var today = new Date().getTime();
      console.log(iAttrs.fetchData);

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
      $scope.next = url+'?access_token='+ $scope.accessToken;
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
          console.log($scope.feeds[$scope.feeds.length - 1].created_time);
          var untilTime = new Date(until).getTime();
          if (currentTime >= untilTime) {
            $scope.nextPage();
            $scope.progress = Math.floor(( 1 - (currentTime - untilTime)/(today - untilTime) )*100);
          } else {
            $scope.progress = 100;
            $scope.findUserPosts();
            // 儲存
            localStorage.setItem(iAttrs.fetchData, angular.toJson($scope.feeds));
            $cookieStore.put(iAttrs.fetchData + 'update', new Date().getTime());
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
          console.log(total_count);
          $scope.total_count = total_count;
        })
      }

      $scope.countComments = function(posts) {
        var postList = [];
        angular.forEach(posts, function(post) {
          // console.log(value.id);
          this.push(
            $http({
              method: 'GET',
              url: 'https://graph.facebook.com/v2.2/'+post.id+'/comments' + '?access_token='+ $scope.accessToken + '&summary=true'
            })
          )
        }, postList);
        // console.log(postList);
        $q.all(postList).then(function(res) {
          // console.log(res);
          var yourComments = [];
          angular.forEach(res, function(comments) {
            // console.log(value.data.summary.total_count);
            // total_count += value.data.summary.total_count;
            if (comments.data.summary.total_count > 25) {
              console.log(comments.data);
              angular.forEach(comments.data.data, function(comment) {
                if (!comment.from) {
                } else {
                  if($scope.uid == comment.from.id) {
                    yourComments.push(comment);
                  }
                }
              })
              var nextCommentPage = comments.data.paging.next;
              var getNextPage = function(url) {
                $http({
                  method: 'GET',
                  url: nextCommentPage
                }).
                success(function(data, status, headers, config) {
                  // console.log(data);
                  if (!data.paging.next) {
                    // 最後一面了
                    angular.forEach(data.data, function (comment) {
                      // console.log(comment)
                      if (!comment.from) {
                      } else {
                        if($scope.uid == comment.from.id) {
                          yourComments.push(comment);
                        }
                      }
                    });
                  } else {
                    // 還有下一面
                    angular.forEach(data.data, function (comment) {
                      // console.log(comment)
                      if (!comment.from) {
                      } else {
                        if($scope.uid == comment.from.id) {
                          yourComments.push(comment);
                        }
                      }
                    });
                    nextCommentPage = data.paging.next;
                    getNextPage(nextCommentPage);
                  }
                })
              }
              getNextPage(nextCommentPage);

            } else {
              if (comments.data.summary.total_count > 0) {
                angular.forEach(comments.data.data, function (comment) {
                  // console.log(comment)
                  if (!comment.from) {
                  } else {
                    if($scope.uid == comment.from.id) {
                      yourComments.push(comment);
                    }
                  }
                });
              }
            }
          })
          console.log(yourComments);
        })
      }

      $scope.userPosts = [];
      $scope.findUserPosts = function() {
        angular.forEach($scope.feeds, function(feed) {
          if (feed.from.id == $scope.uid ) {
            this.push(feed);
          }
        }, $scope.userPosts);
        // console.log($scope.userPosts);
        $scope.countLikes($scope.userPosts);
      };

      $scope.refreshPage = function() {
        localStorage.removeItem(iAttrs.fetchData)
        $scope.userPosts = [];
        $scope.feeds = [];
        $scope.nextPage();
      }

      var storeData = angular.fromJson(localStorage.getItem(iAttrs.fetchData));
      if (storeData) {
        $scope.lastUpdate = new Date($cookieStore.get(iAttrs.fetchData + 'update'));
        $scope.progress = 100;
        $scope.feeds = storeData;
        $scope.findUserPosts();
        // $scope.countComments($scope.feeds);
      } else {
        $scope.feeds = [];
        $scope.nextPage();
      }
    }
  };
}]);