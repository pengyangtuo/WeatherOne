(function(){
  var homeModule = angular.module("woHomeModule",[])
    /* ----------------------
        Home page controller
     * ---------------------- */
    .controller("WoHomeController", [
      '$scope',
      '$state',
      'woLocalStorage',
      'woWeatherService',
      function($scope, $state, woLocalStorage, woWeatherService){
        /*
            - Setups
         */
        var vm = this;

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

        // check if the weather is night or day
        $scope.isNight = function(weather){
          return woWeatherService.isNight(weather);
        };
    }])
    /* ----------------------
        search controller
     * ---------------------- */
    .controller("WoHomeController.search", [
      'woWeatherService',
      'owmServiceFactory',
      '$state',
      '$scope',
      '$cordovaGeolocation',
      function(woWeatherService, owmServiceFactory, $state, $scope, $cordovaGeolocation){

        var vm = this;
        this.query = "";        // query string in the input field
        this.searching = false;  // flag indicating whether the controller is searching the device

        // search function
        this.search = function(){
          owmServiceFactory.getByCity(vm.query).then(function(response){
            woWeatherService.updateCurWeatherDetail(response.data);
            $state.go("detail");
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

          // retrieve geo information of current location
          var options = {timeout: 10000, enableHighAccuracy: true}; // geolocation options
          $cordovaGeolocation.getCurrentPosition(options).then(
            function(position){

              // pass geo info to weather service api
              owmServiceFactory.getByGeo(position.coords.latitude, position.coords.longitude).then(
                function(response){
                  woWeatherService.updateCurWeatherDetail(response.data);
                  $state.go("detail");

                  vm.searching = false;  // end search
                },
                function(error){
                  vm.searching = false;  // end search
                  console.log("owmServiceFactory: error on getByGeo");
                }
              )
            },
            function(error){
              vm.searching = false;  // end search
              console.log("cannot get current location");
            }
          );
        }
    }])
})();
