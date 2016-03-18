(function(){
  var homeMapModule = angular.module("woHomeModule.map", ["woModels.weather"])
    .controller("WoHomeController.map", [
      "$scope",
      "$state",
      "googleMapServiceFactory",
      "WeatherModel",
      function($scope, $state, googleMapServiceFactory, WeatherModel){

        // setup
        $scope.loadingCenterMapWeather = false; // the weather is loading
        $scope.showMapWeather = false;          // whether to show the map weather or not

        // init google map with current favourite weathers
        googleMapServiceFactory.initMapWithWeathers("home-map", WeatherModel.getFavWeathersFromCache());

        // search the weather at the center area of the map
        $scope.getCurrentWeatherOnMap = function(){
          $scope.loadingCenterMapWeather = true;
          $scope.showMapWeather = true;

          var center = googleMapServiceFactory.getMap().getCenter();

          // get center weather
          WeatherModel.getWeatherByGeo(center.lat(), center.lng())
            .then(
              function(weather){
                // save data
                $scope.mapCenterWeather = weather;
                $scope.loadingCenterMapWeather = false;
              },
              function(error){
                console.log("can not get map center weather. \n" + JSON.stringify(error));
              }
            );
        }

        // forgot and close the center map weather
        $scope.closeMapWeather = function($event){
          $scope.mapCenterWeather = null;
          $scope.showMapWeather = false;

          $event.stopPropagation();
        }
    }])
})();
