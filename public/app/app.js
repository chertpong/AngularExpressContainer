'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngMaterial',
  'LocalStorageModule',
  'myApp.home',
  'myApp.auth',
  'myApp.admin',
  'myApp.version'
]).
config([
  '$locationProvider', '$routeProvider','$mdThemingProvider','localStorageServiceProvider','$logProvider',
  function($locationProvider, $routeProvider, $mdThemingProvider, localStorageServiceProvider, $logProvider) {
    $locationProvider.hashPrefix('!');

    $routeProvider.otherwise({redirectTo: '/home'});

    $mdThemingProvider.theme('default')
      .primaryPalette('blue')
      .accentPalette('orange');

    $logProvider.debugEnabled(true);

    localStorageServiceProvider.setPrefix('walkrallyWeb').setNotify(true, true);
  }])
  .run(function($rootScope, localStorageService){
    $rootScope.loggedIn = localStorageService.get('token') ? true : false;
  })
  .constant('Config', {
    backendUrl: 'http://52.163.91.205'
  });
