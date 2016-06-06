'use strict';

angular.module('myApp.auth', ['ngRoute'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/login', {
      templateUrl: 'auth/login.html',
      controller: 'LoginCtrl'
    });
  }])

  .controller('LoginCtrl', [
    '$scope', 'Config', 'localStorageService', '$log','$http', '$location','$rootScope',
    function($scope, Config, localStorageService, $log, $http, $location, $rootScope) {
      if($rootScope.loggedIn){
        $location.path('#!/home');
      }
      $scope.user = {
        email:'',
        password:''
      };
      $scope.isEnabledLoginButton = true;
      $scope.login = function() {
        $scope.isEnabledLoginButton = false;
        var path = Config.backendUrl+'/auth/local';
        $http
          .post(path,{email:$scope.user.email,password:$scope.user.password})
          .then(function(response) {
            localStorageService.set('token', response.data.token);
            $log.debug('saved token: ',response.data.token);
            $rootScope.loggedIn = true;
            $log.debug('set $rootScope.loggedIn: ',true);
            $location.path('../admin/places');
          })
          .catch(function(err) {
            $scope.isEnabledLoginButton = true;
            $log.debug(err);
          });
      };
    }]);