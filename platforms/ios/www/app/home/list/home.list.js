(function(){
  var homeListModule = angular.module("woHomeModule.list", [])
    // Directive of the favourite list of location in the landing page
    .controller("WoHomeController.favList", [
      "$scope",
      "woLocalStorage",
      "woWeatherService",
      'owmServiceFactory',
      function($scope, woLocalStorage, woWeatherService, owmServiceFactory){
        /*
         - Setups
         */
        var vm = this;
        $scope.loadingList = false;
        retrieveFavWeather(); // init list

        /*
         - Private functions -
         */
        // initialize favourite location weather list
        function retrieveFavWeather(){
          $scope.loadingList = true;  // change status
          var favList = woLocalStorage.getObject('wo-fav-list').data || [];
          console.log(favList.filter(function(obj){return JSON.stringify(obj)}));

          // get city ids
          var ids = [];
          for(var i=0; i<favList.length; i++){
            ids.push(favList[i].id);
          }

          // query for batch of ids
          owmServiceFactory.getByIds(ids).then(function(response){

            var data = response.data.list;
            for(var i=0; i<data.length; i++){

              woWeatherService.saveFavWeather(data[i]);

            }
            $scope.loadingList = false;
          });
        }

        /*
          - public functions -
         */
        // update the current weather detail object
        $scope.updateWeatherDetailService = function(weatherObj){
          woWeatherService.updateCurWeatherDetail(weatherObj);
        };

        // weather of cities in fav list
        $scope.getFavListWeather = function(){
          return woWeatherService.favListWeather;
        };

        // refresh the list content
        $scope.doRefresh = function(){
          retrieveFavWeather();
          $scope.$broadcast('scroll.refreshComplete');
        };
    }])
})();
