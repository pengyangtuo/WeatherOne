(function(){
  var homeMapModule = angular.module("woHomeModule.map", [])
    .controller("WoHomeController.map", [
      "$scope",
      "$state",
      "googleMapServiceFactory",
      "googleTimeZoneFactory",
      "woWeatherService",
      "owmServiceFactory",
      function($scope, $state, googleMapServiceFactory, googleTimeZoneFactory, woWeatherService, owmServiceFactory){

        // setup
        $scope.loadingCenterMapWeather = false; // the weather is loading
        $scope.showMapWeather = false;          // whether to show the map weather or not

        // init google map with current favourite weathers
        googleMapServiceFactory.init(woWeatherService.favListWeather);


        // search the weather at the center area of the map
        $scope.getCurrentWeatherOnMap = function(){
          $scope.loadingCenterMapWeather = true;
          $scope.showMapWeather = true;

          var map = googleMapServiceFactory.getMap();
          var center = map.getCenter();

          // get center weather
          owmServiceFactory.getByGeo(center.lat(), center.lng())
            .then(
              function(response){
                // save data
                $scope.mapCenterWeather = response.data;

                // get local time
                googleTimeZoneFactory.setLocaltime($scope.mapCenterWeather);

                $scope.loadingCenterMapWeather = false;
              },
              function(error){
                console.log("can not get map center weather. \n" + JSON.stringify(error));
              }
            );
        }

        // forgot and close the center map weathe
        $scope.closeMapWeather = function($event){
          $scope.mapCenterWeather = null;
          $scope.showMapWeather = false;

          $event.stopPropagation();
        }

        // go to detail page
        $scope.showDetail = function(){
          woWeatherService.updateCurWeatherDetail($scope.mapCenterWeather);
          $state.go("detail");
        };
    }])
})();
