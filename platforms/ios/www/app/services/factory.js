(function(){
  var appFactory = angular.module("owmModule", [])
    /*
        api keys
     */
    .value("owmAPPID", "4f530d3dd227d760d393fd86b14ffa79")
    .value("wwoAPPID", "f0b0246b1e26f9faaa00b17e848b6")
    .value("googleMapAPIKey", "AIzaSyCV14ERCV3VvHaarNl-rkfwn4C3xl7Olx0")
    /*
        Google map services
    */
    .factory("googleMapServiceFactory", [
      "$http",
      "$state",
      "$cordovaGeolocation",
      "woLocalStorage",
      function($http, $state, $cordovaGeolocation, woLocalStorage){

        var map;
        var temporaryMarker;
        var mouseDownTime; // use to track click event

        // init google map
        function initMap(weathers){
          var options = {timeout: 10000, enableHighAccuracy: true};

          $cordovaGeolocation.getCurrentPosition(options).then(function(position){

            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            var mapOptions = {
              center: latLng,
              zoom: 11,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              disableDefaultUI: true
            };

            map = new google.maps.Map(document.getElementById("home-map"), mapOptions);

            // Wait until the map is loaded
            google.maps.event.addListenerOnce(map, 'idle', function(){
              loadMarkers(weathers);  // load markers on map
            });

          }, function(error){
            console.log("Could not get location");
          });
        }

        // load markers
        function loadMarkers(weathers){
          // get marker list
          for(c in weathers){

            createMarker(weathers[c], map);

          }
        }

        // function create a single marker
        function createMarker(weather, map){
          // get marker position
          var coord = weather.coord;
          var pos = new google.maps.LatLng(coord.lat, coord.lon);

          var overlay = new WeatherMarker(pos, map, {
            "weatherModel": weather,
            "clickCallBack": weather.googleMapMarkerCallBack
          });

          // save the reference for removal
          weather['googleMapMarker'] = overlay;
        }

        //// drop temperary marker
        //function dropTempMarker(latLng){
        //
        //  // remove previous marker
        //  if(temporaryMarker){
        //    temporaryMarker.remove();
        //  }
        //
        //  // create a new temporary marker
        //  temporaryMarker = new WeatherMarker(latLng, map, {
        //    "isTemporary": true,
        //    "clickCallBack": function(){
        //      console.log("click on marker");
        //    }
        //  });
        //}

        return {
          // initialize the map with a list of weather models
          init: function(weathers){
            console.log("loading a new map");
            initMap(weathers);
          },

          mark: function(weatherModel){
            if(!map){
              return false;
            }
            createMarker(weatherModel, map);
          },

          getMap: function(){
            return map;
          },
        }
    }])
    /*
        google time zone services
     */
    .factory('googleTimeZoneFactory', [
      '$http',
      '$interval',
      'googleMapAPIKey',
      function($http, $interval, googleMapAPIKey){
        return {
          // get local time base on coordinate
          setLocaltime: function(weatherModel){

            var now = (new Date()).getTime()/1000,
                data = {
                  key: googleMapAPIKey,
                  location: weatherModel.coord.lat+","+weatherModel.coord.lon,
                  timestamp: now,
                };

            $http({
              method: "GET",
              url: 'https://maps.googleapis.com/maps/api/timezone/json',
              params: data
            }).then(
              function(response){ // success get local time
                if(response.data.status == "OK"){
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
    /*
        factory of World weather online services
     */
    .factory("wwoServiceFactory", ["wwoAPPID", "$http", function (wwoAPPID, $http){
      return {
        getHistory: function(city, startDate, endDate){
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
          });
        }
      }
    }])
    /*
        factory of of OpenWeatherMap api calls
     */
    .factory("owmServiceFactory", [
      "owmAPPID",
      "$http",
      function (owmAPPID, $http){
        return {
          // get weather info by city name
          getByCity: function(city){
            // construct request parameters
            var data = {
              "q" : city,
              "appid": owmAPPID
            };

            // return the response from server
            return $http({
              method: "GET",
              url: 'http://api.openweathermap.org/data/2.5/weather',
              params: data
            });
          },
          // get weather info by geo location
          getByGeo: function(lat, lon){
            var data = {
              "lat": lat,
              "lon": lon,
              "appid": owmAPPID
            };

            return $http({
              methd: "GET",
              url: "http://api.openweathermap.org/data/2.5/weather",
              params: data
            });
          },
          // get weather of multiple city ids
          getByIds: function(ids){
            // construct request parameters
            var data = {
              "id" : ids.join(),
              "appid": owmAPPID
            };

            // return the response from server
            return $http({
              method: "GET",
              url: 'http://api.openweathermap.org/data/2.5/group',
              params: data
            });
          },

          // get weather forecast for a city of cnt days
          getForecast: function(cityId, cnt){
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
            });
          }
        };
    }])
    /*
        Local storage service
     */
    .factory("woLocalStorage", ["$window", function($window){
      return {
        set: function(key, value) {
          $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
          return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
          $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
          return JSON.parse($window.localStorage[key] || '{}');
        }
      }
    }])
    /*
        Factory storing the weather model displayed on detail page
     */
    .factory("woWeatherService", [
      '$state',
      'googleTimeZoneFactory',
      'googleMapServiceFactory',
      function($state, googleTimeZoneFactory, googleMapServiceFactory){
        return {
          curWeatherDetail: null, // current weather detail object
          favListWeather: {},     // dictionary of the weather of the cities in favList

          updateCurWeatherDetail: function(weatherObj){
            this.curWeatherDetail = weatherObj;
          },

          // create a favourite weather object and save it to the list
          saveFavWeather: function(weatherModel){
            var city = weatherModel.name,
                self = this;

            // save it to the list
            this.favListWeather[city] = weatherModel;

            // attach google map mark's callback function
            this.favListWeather[city].googleMapMarkerCallBack = function(model){
              // * this model object will be passed in by domListener in the draw() function in WeatherMarker.js
              // update detail page model
              self.updateCurWeatherDetail(model);

              // navigate to detail page
              $state.go("detail");
            };

            // add marker on the map
            googleMapServiceFactory.mark(this.favListWeather[city]);

            // set local time to this
            googleTimeZoneFactory.setLocaltime(this.favListWeather[city]);
          },

          // check night status of a input weather
          isNight: function(weather){
            if(!weather){
              return {};
            }
            
            var localNow = new Date(),
              sunrise = new Date(weather.sys.sunrise*1000),
              sunset = new Date(weather.sys.sunset*1000);

            if(localNow > sunrise && localNow < sunset){
              return false;
            }else{
              return true;
            }
          },

          // remove a favourite weather from the list
          removeFavWeather: function(city){
            // remove marker from the map
            if(this.favListWeather[city].googleMapMarker){
              this.favListWeather[city].googleMapMarker.remove();
            }
            // delete the weather object
            delete this.favListWeather[city];
          },
        }
    }]);
})();
