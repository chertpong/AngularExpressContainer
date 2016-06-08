'use strict';
//TODO : Refactor this spaghetti
angular.module('myApp.admin', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/admin/places', {
        templateUrl: 'admin/places/list.html',
        controller: 'AdminPlaceListCtrl'
      })
      .when('/admin/places/create', {
        templateUrl: 'admin/places/edit.html',
        controller: 'AdminPlaceCreateCtrl'
      })
      .when('/admin/places/:id', {
        templateUrl: 'admin/places/edit.html',
        controller:'AdminPlaceEditDetailCtrl'
      });
  }])
  .controller('AdminPlaceListCtrl', [
    '$scope', 'Config', 'localStorageService', '$log','$http', '$location','$mdDialog',
    function($scope, Config, localStorageService, $log, $http, $location, $mdDialog) {
      $scope.places = [];
      $scope.place = {};
      $scope.search = '';
      var path = Config.backendUrl+'/api/places';
      $http
        .get(path,{
          headers:{
            'X-ACCESS-TOKEN': localStorageService.get('token')
          }
        })
        .then(function(response) {
          $scope.places = response.data;
          $log.debug('[+] load places: ', $scope.places.length);
        })
        .catch(function(err) {
          $log.debug(err);
        });

      $scope.isEnabledDeleteButton = true;
      $scope.delete = function(place){
        var confirm = $mdDialog.confirm()
          .title('Would you like to delete the place')
          .textContent('Are you sure that you want to delete '+place.name)
          .ok('Yes')
          .cancel('No');
        $mdDialog.show(confirm).then(function() {
          $log.debug('[~] ','delete confirmation = yes');
          $scope.isEnabledDeleteButton = false;
          $http
            .delete(path+'/'+place._id,{
              headers:{
                'X-ACCESS-TOKEN': localStorageService.get('token')
              }
            })
            .then(function(response) {
              $scope.isEnabledDeleteButton = true;
              $scope.places = $scope.places.filter(function(p){ return (p._id !== place._id);});
              $log.debug('[+] load places: ', $scope.places.length);
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
        $log.debug('[~] ','go to edit page of place id:',id);
        $location.path('admin/places/'+id);
      };

      $scope.goCreate = function(){
        $log.debug('[~] ','go to create page');
        $location.path('admin/places/create');
      };
    }])
  .controller('AdminPlaceEditDetailCtrl', [
    '$scope', 'Config', 'localStorageService', '$log','$http', '$location','$routeParams','$q','$timeout','$mdDialog',
    function($scope, Config, localStorageService, $log, $http, $location, $routeParams, $q,$timeout,$mdDialog) {
      $scope.isEditPage = true;
      $scope.place = {};

      $scope.workingDay = [
        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Mon-Sat','Mon-Fri','Everyday',
        'Everyday except Monday','Everyday except Tuesday','Everyday except Wednesday',
        'Everyday except Thursday','Everyday except Friday'
      ];
      $scope.workingDaySearchText = '';
      $scope.workingDaySearch = function(searchText){
        var deferred = $q.defer();
        var result = $scope.workingDaySearchText ? $scope.workingDay.filter(function(wd){
          return wd.toLowerCase().indexOf(searchText.toLowerCase()) === 0;
        }) : $scope.workingDay;
        $timeout(function () { deferred.resolve( result ); }, 100, false);
        return deferred.promise;
      };

      $scope.isSubmitEnabled = true;
      $scope.image = {file:null,result:null};
      $scope.$watch('image', function(newValue, oldValue) {
        $scope.place.thumbnail= newValue.result;
      });
      $scope.edit = function(){
        $scope.isSubmitEnabled = false;

        var formData = new FormData();
        formData.append('image', $scope.image.file);
        $log.debug($scope.image.file);
        $http.post(Config.backendUrl+'/api/uploads/single',formData,{
          headers:{
            'X-ACCESS-TOKEN': localStorageService.get('token'),
            'CONTENT-TYPE': undefined,
            transformRequest: angular.identity
          }
        }).then(function(response){
          var path = Config.backendUrl+'/api/places/'+$routeParams.id;
          $http
            .put(path,
              $scope.place,
              {
                headers:{
                  'X-ACCESS-TOKEN': localStorageService.get('token')
                }
              })
            .then(function(response) {
              $scope.isSubmitEnabled = true;
              $scope.place = response.data;
              $log.debug('[+] edit place: ', $scope.place.name);

              $mdDialog.show(
                $mdDialog.alert()
                  .parent(angular.element(document.getElementById('admin-place-edit-container')))
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
        })
       
      };

      var loadData = function(){
        var path = Config.backendUrl+'/api/places/'+$routeParams.id;

        $http
          .get(path,{
            headers:{
              'X-ACCESS-TOKEN': localStorageService.get('token')
            }
          })
          .then(function(response) {
            $scope.place = response.data;
            $log.debug('[+] load place: ', $scope.place.name);
          })
          .catch(function(err) {
            $log.debug('[!]',err);
          });
      };

      loadData();
    }])
  .controller('AdminPlaceCreateCtrl', [
    '$scope', 'Config', 'localStorageService', '$log','$http', '$location','$routeParams','$q','$timeout','$mdDialog',
    function($scope, Config, localStorageService, $log, $http, $location, $routeParams, $q,$timeout,$mdDialog) {
      $scope.isEditPage = false;
      $scope.place = {
        name:null,
        "descriptions": [
          {content:'',language:'en'},
          {content:'', language:'th'},
          {content:'', language:'ch'}
        ],
        "type": null,
        "location": {
          "lat": null,
          "lng": null
        },
        "contact": {
          name: null,
          phoneNumber: null,
          address: null,
          website:null,
          openTime: null,
          closeTime: null,
          workingDay: null,
          description: null
        },
        "challenges" : [],
        "questions": [
          {
            descriptions:[
              {content:'',language:'en'},
              {content:'', language:'th'},
              {content:'', language:'ch'}
            ],
            score: 10,
            choices:[
              {
                correct: false,
                description:[
                  {content:'',language:'en'},
                  {content:'', language:'th'},
                  {content:'', language:'ch'}
                ]
              },
              {
                correct: false,
                description:[
                  {content:'',language:'en'},
                  {content:'', language:'th'},
                  {content:'', language:'ch'}
                ]
              },
              {
                correct: false,
                description:[
                  {content:'',language:'en'},
                  {content:'', language:'th'},
                  {content:'', language:'ch'}
                ]
              },
              {
                correct: false,
                description:[
                  {content:'',language:'en'},
                  {content:'', language:'th'},
                  {content:'', language:'ch'}
                ]
              }
            ]
          }
        ],
        "thumbnail": undefined
      };

      $scope.workingDay = [
        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Mon-Sat','Mon-Fri','Everyday',
        'Everyday except Monday','Everyday except Tuesday','Everyday except Wednesday',
        'Everyday except Thursday','Everyday except Friday'
      ];
      $scope.workingDaySearchText = '';
      $scope.workingDaySearch = function(searchText){
        var deferred = $q.defer();
        var result = $scope.workingDaySearchText ? $scope.workingDay.filter(function(wd){
          return wd.toLowerCase().indexOf(searchText.toLowerCase()) === 0;
        }) : $scope.workingDay;
        $timeout(function () { deferred.resolve( result ); }, 100, false);
        return deferred.promise;
      };

      $scope.isSubmitEnabled = true;
      $scope.image = {file:null,result:null};
      $scope.$watch('image', function(newValue, oldValue) {
        $scope.place.thumbnail= newValue.result;
      });
      $scope.create = function(){
        $scope.isSubmitEnabled = false;
        var formData = new FormData();
        formData.append('image', $scope.image.file);
        $log.debug($scope.image.file);
        $http.post(Config.backendUrl+'/api/uploads/single',formData,{
          headers:{
            'X-ACCESS-TOKEN': localStorageService.get('token'),
            'CONTENT-TYPE': undefined,
            transformRequest: angular.identity
          }
        })
          .then(function(response){
            var path = Config.backendUrl+'/api/places/';
            return $http
                    .post(path,
                      $scope.place,
                      {
                        headers:{
                          'X-ACCESS-TOKEN': localStorageService.get('token')
                        }
                      })
          })
          .then(function(response) {
            $scope.isSubmitEnabled = true;
            $scope.place = response.data;
            $log.debug('[+] create place: ', $scope.place.name);

            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.getElementById('admin-place-edit-container')))
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