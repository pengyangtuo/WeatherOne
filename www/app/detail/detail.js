(function() {
  var detailModule = angular.module("woDetailModule", [])
    /* ----------------------
        Detail page controller
     * ---------------------- */
    .controller("WoDetailController", [
      "$scope",
      "$state",
      "woWeatherService",
      "owmServiceFactory",
      "woLocalStorage",
      "googleMapServiceFactory",
      function($scope, $state, woWeatherService, owmServiceFactory, woLocalStorage, googleMapServiceFactory){

        var vm = this;

        // setup attributes
        this.forecasts = [];
        this.model = woWeatherService.curWeatherDetail || {};
        this.bannerImg = "img/weathers/clouds.png";
        // add day attribute to the forecast list
        function cleanForecastList(){
          // get today's date
          var today = new Date();

          for(var i=0; i<vm.forecasts.length; i++){
              vm.forecasts[i]['weekday'] = (today.getDay() + i) % 7;
          }
        }

        // get forecast data
        this.getForecastList = function(){
          owmServiceFactory.getForecast(this.model.id, 7).then(function(response){
            vm.forecasts = response.data.list;
            cleanForecastList();  // clean up the data
          });
        }

        // check whether this location is in the user's favourite list
        this.isFav = function(){
          var favList = woLocalStorage.getObject('wo-fav-list').data || [];
          for(var i=0; i<favList.length; i++){
            if(favList[i].name == vm.model.name)
              return i;
          }
          return -1;
        }

        // toggle this location as favourite and not
        this.toggleFav = function(){
          var favList = woLocalStorage.getObject('wo-fav-list').data || [];
          var idx = vm.isFav(); // get index of the location in fav list

          if(idx > -1){   // remove from favourite list
            // remove city info
            favList.splice(idx, 1);

            // remove from favourite weather list
            woWeatherService.removeFavWeather(vm.model.name);
          }else{          // add to favourite list
            // save city info
            favList.push({                                              // add city info to local storage
              name: vm.model.name,
              id: vm.model.id,
              coord: vm.model.coord,
            });

            // save weather to favourite list
            woWeatherService.saveFavWeather(vm.model);
          }

          woLocalStorage.setObject('wo-fav-list', {
            data: favList
          });
        }

        // stateParams watcher
        $scope.$watch(
          function watchStateParams(){
            return woWeatherService.curWeatherDetail;
          },
          function handleStateParamsChange(newVal, oldVal){

            vm.model = woWeatherService.curWeatherDetail;
            console.log("detail page: change city to " + vm.model.name);
            vm.getForecastList();
          }
        );

        // check night/day status
        $scope.isNight = function(weather){
          return woWeatherService.isNight(weather);
        }
    }])
    /* ======================
        Forecast list directive
     * ====================== */
    .directive("forecastList", function(){
      return {
        restrict: "E",
        templateUrl: "app/detail/forecast-list.html"
      }
    });
})();
