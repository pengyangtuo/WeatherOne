angular.module("woServices.google", ["woSecret"])
  /*
   Google map services
   */
  .factory("googleMapServiceFactory", [
    "$http",
    "$state",
    "$cordovaGeolocation",
    function($http, $state, $cordovaGeolocation){

      var markerList = {};  /* marker list for the favourite city markers */
      var map;              /* map object */

      /**
       * reset marker list
       */
      function resetMarkerList(){
        for(m in markerList){
          markerList[m].remove();
        }
      }

      /**
       * create a google map object and draw it on the DOM elemnt identified by container_id
       *
       * @param container_id - id of the DOM element on which the map will be draw
       * @returns {promise} - the map object wrapped in a promise
       */
      function initMap(container_id){
        resetMarkerList();  // reset marker list
        var options = {timeout: 10000, enableHighAccuracy: true};

        return $cordovaGeolocation.getCurrentPosition(options).then(function(position){
          console.log("go position");
          var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

          var mapOptions = {
            center: latLng,
            zoom: 11,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
          };

          map = new google.maps.Map(document.getElementById(container_id), mapOptions);

          return map;
        }, function(error){
          console.log("Could not get location");
          return null;
        });
      }

      /**
       * load batch of markers base on the input weather objects list
       * @param weathers - list of weather object
       * @param map - google map object
       */
      function loadMarkers(weathers){
        // get marker list
        for(c in weathers){
          createMarker(weathers[c]);
        }
      }

      /**
       * creating a single marker
       *
       * @param weather - weather object
       * @param map - google map object
       */
      function createMarker(weather){
        // get marker position
        var coord = weather.data.coord;
        var pos = new google.maps.LatLng(coord.lat, coord.lon);
        var weatherData = {
          googleMapMarkerCallBack: function(){
            $state.go("detail", {weather: weather});
          },
          sunrise: weather.data.sys.sunrise,
          sunset: weather.data.sys.sunset,
          main: weather.data.weather[0].main.toLowerCase(),
          temp: weather.data.main.temp,
          name: weather.data.name,
        };
        // create marker
        var overlay = new WeatherMarker(pos, map, weatherData);

        // save the reference for removal
        console.log("add to marker list");
        markerList[weather.data.name] = overlay;
      }

      return {
        /**
         * create a map centered at current location
         *
         * @param container_id - id of the DOM element on which the map will be draw
         * @returns {promise} - a map object wrapped in promise
         */
        initMap: function(container_id){
          console.log("loading a new map");
          return initMap(container_id);
        },

        /**
         * initialize the map with a list of weather models
         *
         * @param container_id - id of the DOM element on which the map will be draw
         * @param weathers - list of weather object
         * @returns {promise} - a map object wrapped in promise
         */
        initMapWithWeathers: function(container_id, weathers){
          console.log("loading a new map with weather markers");

          return initMap(container_id)
            .then(function(map){
              // Wait until the map is loaded
              google.maps.event.addListenerOnce(map, 'idle', function(){
                loadMarkers(weathers);  // load markers on map
              });
            });
        },

        /**
         * return the map object
         */
        getMap: function(){
          return map;
        },

        /**
         * create a marker on map using the weather object
         *
         * @param weatherModel - weather object
         * @param map - google map object
         */
        mark: function(weatherModel){
          if(!map){
            return;
          }
          createMarker(weatherModel);
        },

        /**
         * Remove a marker from the map
         *
         * @param city - city name of the corresponding marker
         */
        unmark: function(city){
          if(!map){
            return;
          }

          markerList[city].remove();
          delete markerList[city];
        }
      }
    }])
  /*
   google time zone services
   */
  .factory('googleTimeZoneFactory', [
    '$http',
    '$interval',
    'googleTimeZoneAPIKey',
    function($http, $interval, googleTimeZoneAPIKey){
      return {
        /**
         * get local time base on coordinate info in a weather model
         *
         * @param weatherModel
         */
        setLocaltime: function(weatherModel){

          var now = (new Date()).getTime()/1000,
            data = {
              key: googleTimeZoneAPIKey,
              location: weatherModel.coord.lat+","+weatherModel.coord.lon,
              timestamp: now,
            };

          $http({
            method: "GET",
            url: 'https://maps.googleapis.com/maps/api/timezone/json',
            params: data
          }).then(
            function(response){ // success getting local time
              if(response.data.status == "OK"){
                // set the weather oject's local time attribute
                weatherModel.localTime = now + response.data.dstOffset + response.data.rawOffset;

                // increament the minute time
                $interval(function(){
                  weatherModel.localTime += 60;
                }, 60000);

              }else{
                console.log("Invalie time zone response for " + weatherModel.name +": " + JSON.stringify(response));
              }
            },function(error){ // error get local time
              console.log("error getting local time for " + weatherModel.name +"\n"+JSON.stringify(error));
            })
        }
      }
    }
  ])
