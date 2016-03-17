function WeatherMarker(latlng, map, args){
  this.latlng = latlng;
  this.args = args;
  this.setMap(map);

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

    if(this.args.isTemporary){
      // drop a temporary marker
      console.log("create temp marker at " + JSON.stringify(this.latlng));
      div = this.div = this.createTmpMarker();

      google.maps.event.addDomListener(div, "click", function(event) {

        self.args.clickCallBack();
        // stop the event here
        event.stopPropagation();
      });

    }else{
      // drop weather marker
      div = this.div = this.createWeatherMarker();

      google.maps.event.addDomListener(div, "click", function(event) {
        // call on the call back
        self.args.clickCallBack(self.args.weatherModel);
        // stop the event here
        event.stopPropagation();
      });

    }


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
    sunrise = new Date(w.sys.sunrise*1000),
    sunset = new Date(w.sys.sunset*1000);

  if(localNow > sunrise && localNow < sunset){
    return false;
  }else{
    return true;
  }
}
WeatherMarker.prototype.createWeatherMarker = function(){
  var wm = this.args.weatherModel;
  var div = document.createElement('div');

  // default classes
  if(this.checkIsNight(wm)){
    div.className = 'marker night clouds';
  }else{
    div.className = 'marker clouds';
  }

  switch(wm.weather[0].main.toLowerCase()) {
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
  temp.innerHTML = Math.round(wm.main.temp  - 273.15) + "&deg;";
  temp.className = "temp";

  // attache children to marker
  div.appendChild(title);
  div.appendChild(icon);
  div.appendChild(temp);
  div.appendChild(arrow);
  div.appendChild(shadow);

  return div;
}

WeatherMarker.prototype.createTmpMarker = function(){

  // main marker
  var div = document.createElement('div');
  div.className = 'marker temporary';
  div.innerHTML = "<i class='fa fa-map-marker'></i><br>Show weather here";

  // create arrow
  var arrow = document.createElement('div');
  arrow.className = "arrow";

  // create small shadow
  var shadow = document.createElement('div')
  shadow.className = 'marker-shadow';

  // create close button
  var clsBtn = document.createElement('div')
  clsBtn.className = "cls-btn";

  var times = document.createElement('i');
      times.className = "fa fa-times";
  clsBtn.appendChild(times);

  // attache children to marker
  div.appendChild(arrow);
  div.appendChild(shadow);
  div.appendChild(clsBtn);

  // close function
  var self = this;
  clsBtn.addEventListener('click', function(e){
    self.remove();
    e.stopPropagation();
  });

  return div;
}
