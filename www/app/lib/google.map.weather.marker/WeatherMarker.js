/**
 * Constructor of google map customed marker
 *
 * @param latlng  - position of the marker
 * @param map     - container map object
 * @param weather - weather object
 * @constructor
 */
function WeatherMarker(latlng, map, weather){
  this.latlng = latlng;
  this.weather = weather;
  this.setMap(map);

  console.log("constructor " + JSON.stringify(this.weather));

  // set size of the marker
  this.w = 100; // width
  this.h = 175; // height
}

WeatherMarker.prototype = new google.maps.OverlayView();

WeatherMarker.prototype.draw = function() {

  var self = this;

  var div = this.div;

  if (!div) {

    //if (typeof(self.args.marker_id) !== 'undefined') {
    //  div.dataset.marker_id = self.args.marker_id;
    //}

    // drop weather marker
    div = this.div = this.createWeatherMarker();

    google.maps.event.addDomListener(div, "click", function(event) {
      // call on the call back
      if(self.weather.googleMapMarkerCallBack){
        self.weather.googleMapMarkerCallBack();
      }

      // stop the event here
      event.stopPropagation();
    });


    var panes = this.getPanes();
    panes.overlayImage.appendChild(div);
  }

  var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

  if (point) {
    div.style.left = (point.x-this.w/2) + 'px';
    div.style.top = (point.y-this.h) + 'px';
  }
};

WeatherMarker.prototype.remove = function() {
  if (this.div) {
    this.div.parentNode.removeChild(this.div);
    this.div = null;
    this.setMap(null);
  }
};

WeatherMarker.prototype.getPosition = function() {
  return this.latlng;
};

/*
 TODO: this function is duplicated the one in factory.js->woWeatherService.isNight, need remove such duplication
 */
WeatherMarker.prototype.checkIsNight = function (w){
  var localNow = new Date(),
    sunrise = new Date(w.sunrise*1000),
    sunset = new Date(w.sunset*1000);

  if(localNow > sunrise && localNow < sunset){
    return false;
  }else{
    return true;
  }
}

WeatherMarker.prototype.createWeatherMarker = function(){
  var wm = this.weather;
  var div = document.createElement('div');

  // default classes
  if(this.checkIsNight(wm)){
    div.className = 'marker night clouds';
  }else{
    div.className = 'marker clouds';
  }

  switch(wm.main) {
    case 'clouds':
      if(this.checkIsNight(wm)){
        div.className = 'marker night clouds';
      }else{
        div.className = 'marker clouds';
      }
      break;
    case 'clear':
      if(this.checkIsNight(wm)){
        div.className = 'marker night clears';
      }else{
        div.className = 'marker clears';
      }
      break;
    case 'rain':
      if(this.checkIsNight(wm)){
        div.className = 'marker night rain';
      }else{
        div.className = 'marker rain';
      }
      break;
    case 'snow':
      if(this.checkIsNight(wm)){
        div.className = 'marker night snow';
      }else{
        div.className = 'marker snow';
      }
      break;
  }

  // create arrow
  var arrow = document.createElement('div');
  arrow.className = "arrow";

  // create small shadow
  var shadow = document.createElement('div');
  shadow.className = 'marker-shadow';

  // create title
  var title = document.createElement('div');
  title.innerHTML = wm.name;
  title.className = "title";

  // create icon
  var icon = document.createElement('div');
  icon.className = 'icon';

  // temperation
  var temp = document.createElement('div');
  temp.innerHTML = Math.round(wm.temp  - 273.15) + "&deg;";
  temp.className = "temp";

  // attache children to marker
  div.appendChild(title);
  div.appendChild(icon);
  div.appendChild(temp);
  div.appendChild(arrow);
  div.appendChild(shadow);

  return div;
}
