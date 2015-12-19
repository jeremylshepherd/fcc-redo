var app = angular.module('votingApp', ['ui.router']);

app.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
          pollPromise: ['polls', function(polls) {
            return polls.getAll();
          }]
        }
      }).state('polls', {
        url: '/polls/:id',
        templateUrl: '/polls.html',
        controller: 'PollsCtrl',
        resolve: {
          poll: ['$stateParams', 'polls', function($stateParams, polls) {
            return polls.get($stateParams.id);
          }]
        }
      }).state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth){
          if(auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      }).state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth){
          if(auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      });

    $urlRouterProvider.otherwise('home');
  }
]);

app.factory('auth', ['$http', '$window', function($http, $window) {
    var auth = {};

    auth.saveToken = function (token){
      $window.localStorage['voting-app-token'] = token;
    };

    auth.getToken = function (){
      return $window.localStorage['voting-app-token'];
    };

    auth.isLoggedIn = function(){
      var token = auth.getToken();
        if(token){
          var payload = JSON.parse($window.atob(token.split('.')[1]));
          return true;
        } else {
          return false;
        }
    };

    auth.currentUser = function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.username;
      }
    };

    auth.register = function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logIn = function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logOut = function(){
      $window.localStorage.removeItem('voting-app-token');
    };

    auth.isOwner = function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        console.log(payload);
        return payload.name;
      }
    };
    return auth;
  }]);

app.factory('polls', ['$http', 'auth', function($http, auth) {
  var o ={
    polls: []
  };

  o.getAll = function(){
    return $http.get('/polls').success(function(data) {
      angular.copy(data, o.polls);
    });
  };

  o.create = function(poll) {
    return $http.post('/polls', poll, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data) {
      o.polls.push(data);
    });
  };

  o.upvote = function(poll) {
    return $http.put('/polls/' + poll._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data) {
        poll.upvotes += 1;
      });
  };

  o.get = function(id) {
    return $http.get('/polls/' + id).then(function(res) {
      return res.data;
    });
  };

  o.deletePoll = function(poll) {
    return $http.delete('/polls/' + poll._id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      //To referesh view.
      o.getAll();
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/polls/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };

  o.upvoteComment = function(poll, comment) {
    return $http.put('/polls/' +  poll._id + '/comments/' + comment._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data) {
        comment.upvotes += 1;
      });
  };

  return o;
}]);

app.controller('MainCtrl', [
  '$scope',
  '$state',
  'polls',
  'auth',
  function($scope, $state, polls, auth) {
    $scope.polls = polls.polls;
    $scope.placeholders = ['Coke', 'Pepsi'];
    $scope.item = function(arr){
      var newArr = [];
      for(var i = 0; i < arr.length; i++){
        newArr.push({choiceText: ''});
      }
      return newArr;
    }($scope.placeholders);

    $scope.addPoll = function() {
      if(!$scope.title || $scope.title ===''){return;}
      polls.create({
        title: $scope.title,
        choices: $scope.item,
        author: 'user.username'
      });
      $scope.title = '';
      $scope.choices = [];
      $scope.item = [];
      $scope.placeholders = ['Coke', 'Pepsi'];
    };

    $scope.incrementUpvotes = function(poll) {
      polls.upvote(poll);
    };

    $scope.isLoggedIn = auth.isLoggedIn;
	  $scope.currentUser = auth.currentUser;
    $scope.isOwner = auth.isOwner;
	  $scope.logOut = auth.logOut;

    $scope.addChoices = function(){
      var formId = angular.element( document.querySelector('#choices') );
      $scope.placeholders.push('More Options ' + $scope.placeholders.length);
      /* var newInp = '<input type="text" class="form-control" placeholder="{{"Option " + $scope.placeholders.length}}" + $scope.placholders.length " ng-model="choices[$index + 1].choiceText">';
       formId.append(newInp);*/
    };

    $scope.deletePoll = function(poll) {
      polls.deletePoll(poll);
    };


  }
]);

app.controller('AuthCtrl', [
  '$scope',
  '$state',
  'auth',
  function($scope, $state, auth) {
    $scope.user ={};

    $scope.register = function() {
      auth.register($scope.user).error(function(error) {
        $scope.error = error;
      }).then(function() {
        $state.go('home');
      });
    };

    $scope.logIn = function() {
  		auth.logIn($scope.user).error(function(error) {
  			$scope.error = error;
  		}).then(function() {
  			$state.go('home');
  		});
  	};
  }
]);

app.controller('PollsCtrl', [
  '$scope',
  'polls',
  'poll',
  'auth',
  function($scope, polls, poll, auth){
      $scope.poll = poll;

      $scope.addComment = function(){
        if($scope.body ==="") {return;}
        polls.addComment(poll._id, {
          body: $scope.body,
          author: 'user',
        }).success(function(comment) {
          $scope.poll.comments.push(comment);
        });
        $scope.body = '';
      };

      $scope.incrementUpvotes = function(comment) {
        polls.upvoteComment(poll, comment);
      };

      $scope.isLoggedIn = auth.isLoggedIn;
  	  $scope.currentUser = auth.currentUser;
      $scope.isOwner = auth.isOwner;
  	  $scope.logOut = auth.logOut;

      $scope.test = function(){
        alert($scope.isLoggedIn());
        console.log("I'm working");
      };

      $scope.addChoices = function(){
        var formId = angular.element( document.querySelector('#choices') );
        var newInp = '<input type="text" class="form-control" placeholder="Pepsi" ng-model="choices[$index].choiceText"></input>'
      };

  }
]);

app.controller('NavCtrl', [
  '$scope',
  'auth',
  function($scope, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
	  $scope.currentUser = auth.currentUser;
	  $scope.logOut = auth.logOut;
  }
]);
