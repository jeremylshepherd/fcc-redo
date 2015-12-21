var app = angular.module('TestApp', []);

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
    return $http.get('/api/polls').success(function(data) {
      angular.copy(data, o.polls);
    });
  };

  o.create = function(poll) {
    return $http.post('/polls', poll, {
      headers: {Authorization: 'Bearer '+ auth.getToken()}
    }).success(function(data) {
      o.polls.push(data);
    });
  };

  o.upvote = function(poll) {
    return $http.put('/polls/' + poll._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+ auth.getToken()}
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
      headers: {Authorization: 'Bearer '+ auth.getToken()}
    }).success(function(data){
      //To referesh view.
      o.getAll();
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/polls/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+ auth.getToken()}
    });
  };

  o.upvoteComment = function(poll, comment) {
    return $http.put('/polls/' +  poll._id + '/comments/' + comment._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+ auth.getToken()}
    }).success(function(data) {
        comment.upvotes += 1;
      });
  };
  
  o.upvoteChoice = function(poll, choice) {
    return $http.put('/polls/' +  poll._id + '/choices/' + choice._id + '/upvote', null, {
      headers: {Authorization: 'Bearer ' +auth.getToken()}
    }).success(function(data) {
        choice.upvotes += 1;
      });
  };

  return o;
}]);

app.controller('TestController', function($scope, $http, polls) {
    $scope.polls = polls.getAll();
    $scope.users = function() {
        return $http.get('/users').success(function(data) {
            return data;
        });
    };
})