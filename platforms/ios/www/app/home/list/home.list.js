(function(){
  var homeListModule = angular.module("woHomeModule.list", ["woModels.weather"])
    // Directive of the favourite list of location in the landing page
    .controller("WoHomeController.favList", [
      "$scope",
      "$state",
      "$cordovaGeolocation",
      "woLocalStorage",
      'WeatherModel',
      function($scope, $state, $cordovaGeolocation, woLocalStorage, WeatherModel){
        /*
         - Setups
         */
        var vm = this;
        $scope.loadingList = false;
        retrieveFavWeather(); // init list

        /*
         - Private functions -
         */
        // retrieve favourite weathers
        function retrieveFavWeather(){
          $scope.loadingList = true;  // show spinner

          WeatherModel.getFavWeathers()
            .then(function(){
              $scope.loadingList = false;
            })
        }

        /*
          - public functions -
         */
        // update the current weather detail object
        $scope.updateWeatherDetailService = function(weatherObj){
          $state.go("detail", {weather: weatherObj});
        };

        // weather of cities in fav list
        $scope.getFavListWeather = function(){
          return WeatherModel.getFavWeathersFromCache();
        };

        // refresh the list content
        $scope.doRefresh = function(){
          retrieveFavWeather();
          $scope.$broadcast('scroll.refreshComplete');
        };

        // check whether the fav list is empty
        $scope.isEmpty = function(){
          return Object.keys(WeatherModel.getFavWeathersFromCache()).length == 0;
        }

        // TODO: duplicate function in WoHomeController.search
        $scope.searchLocal = function(){
          $scope.loadingList = true;

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
              $scope.loadingList = false;
            });
        }
    }])
})();
