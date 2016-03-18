angular.module("woModels.forecast", ["woSecret"])
  .service("ForecastModel", ["$http", "owmAPPID", "$log", function($http, owmAPPID, $log){
    var model = this;

    /**
     * Preprocess the response returned by http query, add "weekday" attributes to each forecast obj
     *
     * @param response $http response
     * @returns {Array}
     */
    function preprocessQueryResponse(response){

      // retrieve data from response
      var forecastList = response.data.list;

      // get today's date
      var today = new Date();

      // add the "weekday" attribute to the forecast objects
      for(var i=0; i<forecastList.length; i++){
        forecastList[i]['weekday'] = (today.getDay() + i) % 7;
      }

      return forecastList;
    }

    /**
     * http error handler
     * @param err http error object
     * @returns {obj}
     */
    function handleErr(err){
      $log.error("Error on getting forecast list");
      return err;
    }

    /**
     * Retrieve a list of weather forecast of a given city
     *
     * @param cityId city id
     * @param cnt number of days need to forecast
     * @returns {HttpPromise} a promise contains the list of forecasted weather
     */
    model.getForecast = function(cityId, cnt){
      // construct request parameters
      var data = {
        "id" : cityId,
        "cnt": cnt,
        "appid": owmAPPID
      };

      // return the response from server
      return $http({
        method: "GET",
        url: 'http://api.openweathermap.org/data/2.5/forecast/daily',
        params: data
      }).then(preprocessQueryResponse, handleErr);
    };
  }]);
