(function(){
  var filterModule = angular.module("commonFilter",[])
    /*
      Filter transform F to C
     */
    .filter("celsius", function(){
      return function(input){
        return Math.round(parseFloat(input)  - 273.15);
      };
    })
    /*
      Filter transform weekday integer to string
     */
    .filter("weekDayStr", function(){
      return function(input){
        switch (input){
          case 0:
                return "Mon";
          case 1:
                return "Tue";
          case 2:
                return "Wed";
          case 3:
                return "Thu";
          case 4:
                return "Fri";
          case 5:
                return "Sat";
          case 6:
                return "Sun";
        }
      }
    })
    /*
      Convert date string (2016-02-01) in to month day string (Feb 1)
     */
    .filter("monthDayStr", function(){
      return function(input){
        var monStr = input.slice(5,7);            // get month
        var day = parseInt(input.slice(8,10));    // get day
        switch (monStr){
          case "01":
            return "Jan "+day;
          case "02":
            return "Feb "+day;
          case "03":
            return "Mar "+day;
          case "04":
            return "Apr "+day;
          case "05":
            return "May "+day;
          case "06":
            return "Jun "+day;
          case "07":
            return "Jul "+day;
          case "08":
            return "Aug "+day;
          case "09":
            return "Sep "+day;
          case "10":
            return "Oct "+day;
          case "11":
            return "Nov "+day;
          case "12":
            return "Dec "+day;
        }
      }
    })
    /*
      Filter transfrom polyline point objects in to str
     */
    .filter("pointsStr",function(){
      return function(input){
        if(!input) return '';

        var res = '';
        for(var i=0; i<input.length; i++){
          res += input[i].x + "," + input[i].y + " ";
        }
        return res;
      }
    })
    /*
      Convert unix timestamp (in seconds) to time string
     */
    .filter("secToTimeStr", function(){
      return function(input){

        if(!input){
          return '';
        }

        var time = new Date(input*1000),
            hh = time.getUTCHours() > 12 ? time.getUTCHours()-12 : time.getUTCHours(),
            mm = time.getUTCMinutes()>= 10 ? time.getUTCMinutes() : '0'+time.getUTCMinutes(),
            ss = time.getUTCSeconds(),
            ap = time.getUTCHours() > 12 ? 'PM' : 'AM';

        return hh
              +":"+mm
              //+":"+ss
              +" "+ap;
      }
    })
})();
