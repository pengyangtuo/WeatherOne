(function() {
  var detailModule = angular.module("woDetailModule", [
    "woModels.forecast",
    "woModels.weather"
  ])
    /* ----------------------
        Detail page controller
     * ---------------------- */
    .controller("WoDetailController", [
      "$scope",
      "$state",
      "$stateParams",
      "ForecastModel",
      "WeatherModel",
      "googleMapServiceFactory",
      function($scope, $state, $stateParams, ForecastModel, WeatherModel, googleMapServiceFactory){
        var vm = this;

        // setup attributes
        this.forecasts = [];
        this.loadingForecast = false;
        this.model = $stateParams.weather;
        getForecastList();

        /**
         * get forecast data
         */
        function getForecastList(){
          this.forecasts = [];
          this.loadingForecast = true;  // turn on spinner

          ForecastModel.getForecast(vm.model.data.id, 7) // retrieve 7 days' forecast data
            .then(function(forecasts){
              vm.forecasts = forecasts;
              vm.loadingForecast = false; // turn off spinner
            });
        }

        /**
         * toggle this location as favourite and not
         */
        this.toggleFav = function(){
          if(vm.model.isFav){   // remove from favourite list
            vm.model.isFav = false;
            WeatherModel.removeFromFav(vm.model.data.name);
            googleMapServiceFactory.unmark(vm.model.data.name);
          }else{          // add to favourite list
            vm.model.isFav = true;
            WeatherModel.saveToFav(vm.model);       // save this weather and location
            googleMapServiceFactory.mark(vm.model); // mark this location on map
          }
        }
    }])
    /* ----------------------
        Forecast list directive
     * ---------------------- */
    .directive("forecastList", function(){
      return {
        restrict: "E",
        templateUrl: "app/detail/forecast-list.html"
      }
    });
})();
