/**
 * Created by yangtuopeng on 2016-03-17.
 */
angular.module("woModels.history", ["woSecret"])
  .service("HistoryModel", ["wwoAPPID", "$http", "$log", function (wwoAPPID, $http, $log){
      var model = this;

      /**
       * Query for the weather history of the input city
       *
       * @param city      - city name of the query
       * @param startDate - start date of the query
       * @param endDate   - end date of the query
       * @returns {promise} - a promise contains the list of forecast weather object
       */
      this.getHistory = function(city, startDate, endDate){
        var data = {
          "key": wwoAPPID,
          "format": "json",
          "q": city,
          "date": startDate,
          "enddate": endDate
        };

        // make service call
        return $http({
          method: "GET",
          url: "https://api.worldweatheronline.com/free/v2/past-weather.ashx",
          params: data
        })
          .then(
            function(response){
              return response.data.data.weather;  // yes! there are TWO .data
            },
            function(err){
              $log.error("error getting history ", err);
              return err;
          });
      };
  }]);
