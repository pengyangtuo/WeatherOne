(function(){
  var homeModule = angular.module("woHomeModule",[])
    /* ----------------------
        Home page controller
     * ---------------------- */
    .controller("WoHomeController", [
      '$scope',
      "$rootScope",
      '$state',
      function($scope, $rootScope, $state){
        /*
            - Setups
         */
        var vm = this;
        $scope.err = null;

        /*
            - Private functions -
         */
        // change home page views
        function showListView(){  // show list view
          $state.go("home.list",{
            location: "replace"
          });
        }

        function showMapView(){
          $state.go("home.map",{
            location: "replace"
          });
        }

        /*
            - public functions -
         */
        // check current view
        $scope.isList = function(){
          return $state.current.name == "home.list";
        }
        $scope.isMap = function(){
          return $state.current.name == "home.map"
        }

        // toggle between map view and list view
        $scope.toggleView = function(){
          if($scope.isList()){       // go to map view
            showMapView();
          }else if($scope.isMap()){  // go to list view
            showListView();
          }else{  // something went wrong
            console.error("Some thing went wrong:\n\tWe should not be in the state <"+$state.current.name+"> in home page module")
          };
        };

        /**
         * discard current error
         */
        $scope.discardErr = function(){
          $scope.err = null;
        }

        /* online/offline watcher */
        $scope.$watch(
          function(){
            return $rootScope.online;
          },
          function(newVal, oldVal){
            console.log(oldVal +" -> "+newVal);
            if(!newVal){  // offline
              $scope.err = {
                msg: "Please check you internet connection",
                closable: false,
              }
            }else{        // online
              $scope.err = null;
            }

          });

    }])
    /* ----------------------
        search controller
     * ---------------------- */
    .controller("WoHomeController.search", [
      '$state',
      '$scope',
      '$cordovaGeolocation',
      'WeatherModel',
      function($state, $scope, $cordovaGeolocation, WeatherModel){

        var vm = this;
        this.query = "";        // query string in the input field
        this.searching = false;  // flag indicating whether the controller is searching the device

        // search function
        this.search = function(){
          WeatherModel.getWeatherByQuery(vm.query)
            .then(function(response){
              console.log(response);
              if(response.err){
                $scope.$parent.err = {
                  msg: response.message,
                  closable: true,
                }
              }else{
                $state.go("detail", {weather: response});
              }
            });
        };

        // boolean flag indicating whether there is input string in the field
        this.isDirty = function(){
          return vm.query.length > 0;
        };

        // clean up the input field
        this.cleanUp = function(){
          vm.query = "";
        }

        // locate the device and get weather info
        this.locate = function(){
          vm.cleanUp();         // clear query
          vm.searching = true;  // start to search

          WeatherModel.getWeatherByCurrentGeo()
            .then(function(response){
              console.log("response ", response);
              if(response.err){ // cannot get location
                $scope.$parent.err = {
                  msg: response.message,
                  closable: true,
                }
              }else{
                $state.go("detail", {weather: response});
              }
            })
            .finally(function(){
              vm.searching = false;
            });
        }
    }])
})();
