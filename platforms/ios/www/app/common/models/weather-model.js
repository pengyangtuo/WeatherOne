/**
 * Created by yangtuopeng on 2016-03-17.
 */
angular.module("woModels.weather", [])
  .service("WeatherModel", [
    "$http",
    "$cordovaGeolocation",
    "woLocalStorage",
    "owmAPPID",
    "googleTimeZoneFactory",
    function($http, $cordovaGeolocation, woLocalStorage, owmAPPID, googleTimeZoneFactory){
      var model = this,
          favWeathers = {};  // container of the weather info for all favourite cities

      /**
       * create a weather obj
       *
       * @param weather - weather object returned by owm webservice
       * @return {obj}  - a weather object wrapper with additional functionality
       */
      function createWeather(weather){
        // set local time for the weather object
        googleTimeZoneFactory.setLocaltime(weather);
        // check weather this weather is in the favourite list
        var favCityList = woLocalStorage.getObject('wo-fav-list').data || [];
        var isFav = false;
        for(var i=0; i<favCityList.length; i++){
          if(weather.id == favCityList[i].id){
            isFav = true;
          }
        }
        // create a new weather object
        return {
          data: weather,        // weather data
          isFav: isFav,         // default set to be not favourite object
          isNight: function(){  // utility function check the day/night status of this location
            var localNow = new Date(),
                sunrise = new Date(this.data.sys.sunrise*1000),
                sunset = new Date(this.data.sys.sunset*1000);

            if(localNow > sunrise && localNow < sunset){
              return false;
            }else{
              return true;
            }
          }
        };
      }

      /**
       * Add a weather obj to fav list
       * @param weatherObj - weather object to be added in the list
       */
      function addToFav(weatherObj){
        weatherObj.isFav = true;     // set this weather object to favourite
        favWeathers[weatherObj.data.name] = weatherObj;
      }

      /**
       * Preprocess the response from query by fav city id
       *
       * @param response
       */
      function preprocessFavList(response){

        var dataList = response.data.list;
        for(var i=0; i<dataList.length; i++){
          var w = createWeather(dataList[i]);
          addToFav(w);
        }

        return favWeathers;
      }

      /**
       * get the weather object by query string
       *
       * @param q     - query string
       * @returns {promise} - a promise wrapping the weather object
       */
      this.getWeatherByQuery = function(q){
        // construct request parameters
        var data = {
          "q" : q,
          "appid": owmAPPID
        };

        // return the response from server
        return $http({
          method: "GET",
          url: 'http://api.openweathermap.org/data/2.5/weather',
          params: data
        })
          .then(
            function(response){
              if(response.data.cod == 404){
                return {
                  err: true,
                  message: response.data.message,
                }
              }else{
                return createWeather(response.data);
              }
            },
            function(err){
              console.log("Error on getWeatherByQuery", err)
            });
      }

      /**
       * Get weather object by geolocation
       *
       * @param lat
       * @param lon
       * @returns {promise} - a promise wrapping the weather object
       */
      this.getWeatherByGeo = function(lat, lon){
        var data = {
          "lat": lat,
          "lon": lon,
          "appid": owmAPPID
        };

        return $http({
          methd: "GET",
          url: "http://api.openweathermap.org/data/2.5/weather",
          params: data
        }).then(function(response){
          return createWeather(response.data);
        });
      }

      /**
       * Get weather object by current geolocation
       */
      this.getWeatherByCurrentGeo = function(){
        var options = {timeout: 10000, enableHighAccuracy: true}; // geolocation options
        return $cordovaGeolocation.getCurrentPosition(options).then(
          function(position){

            // pass geo info to weather service api
            return model.getWeatherByGeo(position.coords.latitude, position.coords.longitude);
          },
          function(error){
            if(error.PERMISSION_DENIED){
              return {
                err: true,
                message: "Please enable location service",
              }
            }else{
              return {
                err: true,
                message: "Cannot get current location",
              }
            }
          }
        );
      }

      /**
       * Retrieve the weather info of the cities in favourite list
       */
      this.getFavWeathers = function(){
        // get favlist from local storage
        var favCityList = woLocalStorage.getObject('wo-fav-list').data || [];

        // get city ids
        var ids = [];
        for(var i=0; i<favCityList.length; i++){
          ids.push(favCityList[i].id);
        }

        // construct query
        return $http({
          method: "GET",
          url: 'http://api.openweathermap.org/data/2.5/group',
          params: {
            "id" : ids.join(),
            "appid": owmAPPID
          }
        }).then(preprocessFavList);
      }

      /**
       * Get favourite weather list from cache
       */
      this.getFavWeathersFromCache = function(){
        return favWeathers;
      }

      /**
       * Save the weather object to local storage as well as adding to fav list
       * @param weatherObj - weather object to be saved
       */
      this.saveToFav = function(weatherObj){
        // save to local storage
        var favList = woLocalStorage.getObject('wo-fav-list').data || [];

        // double check for duplicates
        var dup = false;
        for(var i=0; i<favList.length; i++){
          if(favList[i].id == weatherObj.data.id){
            dup = true;
            break;
          }
        }

        if(!dup){
          favList.push({
            name: weatherObj.data.name,
            id: weatherObj.data.id,
            coor: weatherObj.data.coord,
          });
          woLocalStorage.setObject('wo-fav-list', {data: favList});

          // add weather object to fav list
          addToFav(weatherObj);
        }
      }

      /**
       * Remove the city from favourite list
       *
       * @param city - city name to remove
       */
      this.removeFromFav = function(city){
        // remove from local storage
        var favList = woLocalStorage.getObject('wo-fav-list').data || [];
        for(var i=0; i<favList.length; i++){
          if(favList[i].name == city){
            break;
          }
        }
        favList.splice(i, 1);

        woLocalStorage.setObject('wo-fav-list', {data: favList});

        // remove from fav list
        favWeathers[city].isFav = false;
        delete favWeathers[city];
      }
  }]);
