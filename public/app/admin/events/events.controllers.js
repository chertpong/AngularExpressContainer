'use strict';
//TODO : Refactor this spaghetti
angular.module('myApp.admin', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/admin/events', {
        templateUrl: 'admin/events/list.html',
        controller: 'AdminEventListCtrl'
      })
      .when('/admin/events/create', {
        templateUrl: 'admin/events/edit.html',
        controller: 'AdminEventCreateCtrl'
      })
      .when('/admin/events/:id', {
        templateUrl: 'admin/events/edit.html',
        controller:'AdminEventEditDetailCtrl'
      });
  }])
  .controller('AdminEventListCtrl', [
    '$scope', 'Config', 'localStorageService', '$log','$http', '$location','$mdDialog',
    function($scope, Config, localStorageService, $log, $http, $location, $mdDialog) {
      $scope.events = [];
      $scope.event = {};
      $scope.search = '';
      var path = Config.backendUrl+'/api/events';
      $http
        .get(path,{
          headers:{
            'X-ACCESS-TOKEN': localStorageService.get('token')
          }
        })
        .then(function(response) {
          $scope.events = response.data;
          $scope.events = $scope.events.map(function(e){
            var st = new Date(e.startTime);
            var ft = new Date(e.finishTime);
            return {
              _id: e._id,
              startTime: st.toString(),
              finishTime: ft.toString(),
              teamIds:[]
            }
          });
          $log.debug('[+] load events: ', $scope.events.length);
        })
        .catch(function(err) {
          $log.debug(err);
        });

      $scope.isEnabledDeleteButton = true;
      $scope.delete = function(event){
        var confirm = $mdDialog.confirm()
          .title('Would you like to delete the event')
          .textContent('Are you sure that you want to delete '+event.startTime)
          .ok('Yes')
          .cancel('No');
        $mdDialog.show(confirm).then(function() {
          $log.debug('[~] ','delete confirmation = yes');
          $scope.isEnabledDeleteButton = false;
          $http
            .delete(path+'/'+event._id,{
              headers:{
                'X-ACCESS-TOKEN': localStorageService.get('token')
              }
            })
            .then(function(response) {
              $scope.isEnabledDeleteButton = true;
              $scope.events = $scope.events.filter(function(e){ return (e._id !== event._id);});
              $log.debug('[+] current events: ', $scope.events.length);
            })
            .catch(function(err) {
              $scope.isEnabledDeleteButton = true;
              $log.debug(err);
            });
        }, function() {
          $log.debug('[~] ','delete confirmation = no');
        });
      };
      $scope.goEdit = function(id){
        $log.debug('[~] ','go to edit page of event id:',id);
        $location.path('admin/events/'+id);
      };

      $scope.goCreate = function(){
        $log.debug('[~] ','go to create page');
        $location.path('admin/events/create');
      };
    }])
  .controller('AdminEventEditDetailCtrl', [
    '$scope', 'Config', 'localStorageService', '$log','$http', '$location','$routeParams','$q','$timeout','$mdDialog',
    function($scope, Config, localStorageService, $log, $http, $location, $routeParams, $q,$timeout,$mdDialog) {
      //TODO fix edit page
      $scope.isEditPage = true;
      $scope.event = {
        startTime: {
          date:null,
          hr:0,
          min:0,
          s:0
        },
        finishTime:{
          date:null,
          hr:0,
          min:0,
          s:0
        },
        teamIds:[]
      };
      $scope.submitEvent = {
        startTime: null,
        finishTime: null,
        teamIds:[]
      };


      $scope.isSubmitEnabled = true;
      $scope.edit = function(){
        $scope.isSubmitEnabled = false;
        var path = Config.backendUrl+'/api/places/'+$routeParams.id;
        // Parse data
        var startTime = new Date($scope.event.startTime.date);
        startTime.setHours(startTime.getHours()+$scope.event.startTime.hr);
        startTime.setMinutes(startTime.getMinutes()+$scope.event.startTime.min);
        startTime.setSeconds(startTime.getSeconds()+$scope.event.startTime.s);
        $log.debug('start time:',startTime);
        var finishTime = new Date($scope.event.finishTime.date);
        finishTime.setHours(finishTime.getHours()+$scope.event.finishTime.hr);
        finishTime.setMinutes(finishTime.getMinutes()+$scope.event.finishTime.min);
        finishTime.setSeconds(finishTime.getSeconds()+$scope.event.finishTime.s);
        $log.debug('finish time:',finishTime);
        $scope.submitEvent = {startTime:startTime,finishTime:finishTime,teamIds:[]};
        $http
          .put(path,
            $scope.submitEvent,
            {
              headers:{
                'X-ACCESS-TOKEN': localStorageService.get('token')
              }
            })
          .then(function(response) {
            $scope.isSubmitEnabled = true;
            $scope.event = response.data;
            $log.debug('[+] edit event: ', $scope.event.startTime);

            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.getElementById('admin-events-edit-container')))
                .clickOutsideToClose(true)
                .title('Updated!')
                .textContent('Updated: Success')
                .ariaLabel('Success Dialog')
                .ok('Got it!')
            );
          })
          .catch(function(err) {
            $scope.isSubmitEnabled = true;
            var errorMessages = '';
            var errors = [];
            if(err.data.error.errors){
              for(var a in err.data.error.errors){
                errors.push(err.data.error.errors[a]);
              }
              errorMessages = errors
                .map(function(e){
                  return '['+e.name + ':' + e.message + ']';
                })
                .reduce(function(a,b){
                  $log.debug(a,b);
                  return a+' | '+b;
                },'');
            }
            $log.debug('[!]',err.data.message);
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.getElementById('admin-place-edit-container')))
                .clickOutsideToClose(true)
                .title('Error!')
                .textContent(err.data.message+'\n'+errorMessages)
                .ariaLabel('Error Dialog')
                .ok('Got it!')
            );

          });

      };

      var loadData = function(){
        var path = Config.backendUrl+'/api/events/'+$routeParams.id;

        $http
          .get(path,{
            headers:{
              'X-ACCESS-TOKEN': localStorageService.get('token')
            }
          })
          .then(function(response) {
            $scope.event = response.data;
            var startTime = new Date(response.data.startTime);
            $log.debug(startTime);
            $scope.event.startTime.hr = startTime.getUTCHours();
            $scope.event.startTime.min = startTime.getMinutes();
            $scope.event.startTime.s = startTime.getSeconds();
            $log.debug('start time:',startTime);
            var finishTime = new Date($scope.event.finishTime.date);
            finishTime.setHours(finishTime.getHours()+$scope.event.finishTime.hr);
            finishTime.setMinutes(finishTime.getMinutes()+$scope.event.finishTime.min);
            finishTime.setSeconds(finishTime.getSeconds()+$scope.event.finishTime.s);
            $log.debug('finish time:',finishTime);
            $scope.submitEvent = {startTime:startTime,finishTime:finishTime,teamIds:[]};
            $log.debug('[+] load place: ', $scope.event.startTime);
          })
          .catch(function(err) {
            $log.debug('[!]',err);
          });
      };

      loadData();
    }])
  .controller('AdminEventCreateCtrl', [
    '$scope', 'Config', 'localStorageService', '$log','$http', '$location','$routeParams','$q','$timeout','$mdDialog',
    function($scope, Config, localStorageService, $log, $http, $location, $routeParams, $q,$timeout,$mdDialog) {
      $scope.isEditPage = false;
      $scope.event = {
        startTime: {
          date:null,
          hr:24,
          min:30,
          s:0
        },
        finishTime:{
          date:null,
          hr:24,
          min:30,
          s:0
        },
        teamIds:[]
      };
      $scope.submitEvent = {
        startTime: null,
        finishTime: null,
        teamIds:[]
      };

      $scope.isSubmitEnabled = true;
      $scope.create = function(){
        $scope.isSubmitEnabled = false;
        // Parse data
        var startTime = new Date($scope.event.startTime.date);
        startTime.setHours(startTime.getHours()+$scope.event.startTime.hr);
        startTime.setMinutes(startTime.getMinutes()+$scope.event.startTime.min);
        startTime.setSeconds(startTime.getSeconds()+$scope.event.startTime.s);
        $log.debug('start time:',startTime);
        var finishTime = new Date($scope.event.finishTime.date);
        finishTime.setHours(finishTime.getHours()+$scope.event.finishTime.hr);
        finishTime.setMinutes(finishTime.getMinutes()+$scope.event.finishTime.min);
        finishTime.setSeconds(finishTime.getSeconds()+$scope.event.finishTime.s);
        $log.debug('finish time:',finishTime);
        $scope.submitEvent = {startTime:startTime,finishTime:finishTime,teamIds:[]};

        $log.debug('create event');

        var path = Config.backendUrl+'/api/events/';
        $http
          .post(path,
            $scope.submitEvent,
            {
              headers:{
                'X-ACCESS-TOKEN': localStorageService.get('token')
              }
            })
          .then(function(response) {
            $scope.isSubmitEnabled = true;
            $scope.event = response.data;
            $log.debug('[+] create event: ', $scope.event.startTime);

            $mdDialog
              .show(
                $mdDialog.alert()
                  .parent(angular.element(document.getElementById('admin-events-edit-container')))
                  .clickOutsideToClose(true)
                  .title('Created!')
                  .textContent('Created: Success')
                  .ariaLabel('Success Dialog')
                  .ok('Got it!')
              );
          })
          .catch(function(err) {
            $scope.isSubmitEnabled = true;
            var errorMessages = '';
            var errors = [];
            if(err.data.error.errors){
              for(var a in err.data.error.errors){
                errors.push(err.data.error.errors[a]);
              }
              errorMessages = errors
                .map(function(e){
                  return '['+e.name + ':' + e.message + ']';
                })
                .reduce(function(a,b){
                  $log.debug(a,b);
                  return a+' | '+b;
                },'');
            }
            $log.debug('[!]',err.data.message);
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.getElementById('admin-place-edit-container')))
                .clickOutsideToClose(true)
                .title('Error!')
                .textContent(err.data.message+'\n'+errorMessages)
                .ariaLabel('Error Dialog')
                .ok('Got it!')
            );
          });
      };
    }]);