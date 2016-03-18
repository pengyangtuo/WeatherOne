(function(){
  var historyModule = angular.module("woHistoryModule", ["woModels.history"])
    .controller("WoHistoryController", [
      "$scope",
      "$ionicScrollDelegate",
      "$log",
      "$stateParams",
      "viewSize",
      "HistoryModel",
      function($scope, $ionicScrollDelegate, $log, $stateParams, viewSize, HistoryModel){
        console.log("in history controller");
        // setup
        $scope.logPrefix = "WoHistoryController: ";   // logger prefix string
        $scope.pace = 10;               // pace of loading new data
        $scope.maxLoad = 5;             // max number of loading could be made for each city
        $scope.city = $stateParams.city;// set city name from the state parameter
        var vm = this;

        // initialize the chart
        this.init = function() {

          $scope.httpErr = {};
          $scope.initLoad = true;         // initial loading flag
          $scope.loading = false;         // reloading flag
          $scope.history = [];            // container of the weather history object
          $scope.queryCnt = 0;            // number of successful query made so far
          $scope.svgW = viewSize.w * $scope.queryCnt; // width of the svg content
          $scope.svgH = viewSize.h;                   // height of the svg content

          // initial query range
          $scope.startDate = new Date();
          $scope.endDate = new Date();
          $scope.startDate.setDate($scope.startDate.getDate() - $scope.pace);
          $scope.endDate.setDate($scope.endDate.getDate() - 1);

          // reset svg canvas
          resetSvgCanvas();
          console.log("SVG setup:\n\tviewW:"+viewSize.w+ " w: " + $scope.svgW + " h:"+$scope.svgH);

          // initial query for history
          queryHistory();
        };

        // function reset the data points model in the svg canvas
        function resetSvgCanvas(){
          $scope.maxtempPts = [];         // polyline points for max temperatures
          $scope.mintempPts = [];         // polyline points for min temperatures
          $scope.maxtempLabels = [];      // labels for min temp points
          $scope.mintempLabels = [];      // labels for min temp points
          $scope.dateLabels = [];         // date labels
          $scope.gridX = [];              // grid lines on x axis
          $scope.gridY = [];              // grid lines on y axis
          $scope.gridFill = [];           // grid fill between y grids
        }

        // create polyline points using input history objects
        function createPolyLinePoints(histData){
          if(!histData || histData.length < 1){
            return;
          }

          // reset canvas
          resetSvgCanvas();

          // init points container
          var mins = [];
          var maxs = [];

          // collect raw value points
          for(var i=0; i<histData.length; i++){
            mins.push(histData[i].minTemp);
            maxs.push(histData[i].maxTemp);
          }

          // compute x coordinates
          var xUnit = $scope.svgW / (maxs.length-1);  // unit on x axis

          // compute y coordinates
          var upperBound = 4 + Math.max(Math.max.apply(null, maxs), Math.max.apply(null, mins));   // upper bound of real values
          var lowerBound = -4 + Math.min(Math.min.apply(null, mins), Math.min.apply(null, mins));  // lower bound of real values
          for(var i=0; i<maxs.length; i++){
            var max_y = ($scope.svgH * (maxs[i] - lowerBound)) / (upperBound - lowerBound);
            var min_y = ($scope.svgH * (mins[i] - lowerBound)) / (upperBound - lowerBound);

            $scope.maxtempPts.push({
              "x": xUnit*i,
              "y": $scope.svgH - max_y, // coordinate origin is at left-top corner, need to flip the value
            });

            $scope.mintempPts.push({
              "x": xUnit*i,
              "y": $scope.svgH - min_y,
            });
          }

          // draw y axis grid lines
          for(var i=0; i<maxs.length; i++){
            $scope.gridY.push({
              x1:xUnit*i,
              y1:0,
              x2:xUnit*i,
              y2:$scope.svgH,
            });
          }

          // draw x axis grid lines
          for(var i=0; i<($scope.svgW/xUnit); i++){
            $scope.gridX.push({
              x1:0,
              y1:xUnit*i,
              x2:$scope.svgW,
              y2:xUnit*i,
            });
          }

          // create grid fill
          for(var i=0;i<$scope.gridY.length; i+=2){
            if(i+1 == $scope.gridY.length) break; // corner case where there are odd y grids
            $scope.gridFill.push([
              {
                'x': $scope.gridY[i].x1,
                'y': $scope.gridY[i].y1,
              },
              {
                'x': $scope.gridY[i].x2,
                'y': $scope.gridY[i].y2,
              },
              {
                'x': $scope.gridY[i+1].x2,
                'y': $scope.gridY[i+1].y2,
              },
              {
                'x': $scope.gridY[i+1].x1,
                'y': $scope.gridY[i+1].y1,
              }
            ]);
          }

          // create date labels
          for(var i=0; i<histData.length; i++){
            $scope.dateLabels.push({
              "x":$scope.mintempPts[i].x,
              "y":$scope.svgH - 10,
              "value": histData[i].date
            });
          }

          // create polyline labels
          for(var i=0; i<histData.length; i++){
            // max temp labels
            var minL = {
                "x":$scope.mintempPts[i].x,
                "y":$scope.mintempPts[i].y - 15,
                "value": histData[i].minTemp
            };
            // min temp label
            var maxL = {
                "x":$scope.maxtempPts[i].x,
                "y":$scope.maxtempPts[i].y - 15,
                "value": histData[i].maxTemp
            };

            $scope.mintempLabels.push(minL);
            $scope.maxtempLabels.push(maxL);
          }
        };

        // function query the history of the scope's start and end date
        function queryHistory(){

          // check if the queryCnt has reached the limit
          if($scope.reachedMax()) return;

          HistoryModel.getHistory($scope.city, dateStr($scope.startDate), dateStr($scope.endDate))
            .then(  // response handlers
              function(weather){ // HTTP success
                //$log.debug($scope.logPrefix + "load history of "+$scope.city+" ("+dateStr($scope.startDate)+" to "+dateStr($scope.endDate)+")");

                var weathers = weather;
                var historyBlock = [];  // history container
                for(var i=0; i<weathers.length; i++){
                  var w = weathers[i];
                  historyBlock.push({
                    'date': w.date,
                    'maxTemp': w.maxtempC,
                    'minTemp': w.mintempC
                  });
                }
                $scope.history = historyBlock.concat($scope.history);

                // increament queryCnt and start, end date
                $scope.queryCnt += 1;
                $scope.startDate.setDate($scope.startDate.getDate() - $scope.pace);
                $scope.endDate.setDate($scope.endDate.getDate() - $scope.pace);

                // rendering data
                console.log("rendering data " + $scope.history.length);
                $scope.svgW = viewSize.w * $scope.queryCnt; // update svg canvas size
                createPolyLinePoints($scope.history);

                // turn off initial loading flag
                $scope.initLoad = false;
                // turn of loading flag
                $scope.loading = false;
                // reset error
                $scope.httpErr = {};
            },
              function(error){  // HTTP error
                console.log(JSON.stringify(error));
                console.log(error.data.results.error.message);  // detail info
                console.log(error.statusText);                  // error title
                // turn off initial loading flag
                $scope.initLoad = false;
                // turn of loading flag
                $scope.loading = false;
                // change error status
                $scope.httpErr = {
                  hasErr: true,
                  title: error.statusText,
                  detail: error.data.results.error.message
                }
            });
        };

        function dateStr(d) {
          return d.toISOString().substring(0, 10);
        }

        $scope.reachedMax = function(){
          return $scope.queryCnt - $scope.maxLoad == 0;
        }

        /*
            view model watcher
         */
        $scope.$watch(
          function watchCity(){
            return $scope.city;
          },
          function handleCityChange(newValue, oldValue){
            vm.init();
          }
        );
        /*
            loading watcher, $scope.$loading will be change by WoHistoryController.Refresher
         */
        $scope.$watch(
          function watchLoading(){
            return $scope.loading;
          },
          function handleWatchLoading(newValue, oldValue) {
            if($scope.loading){ // start to reload
              $log.debug($scope.logPrefix + "start to reload");
              queryHistory(); //
            }
          });
    }])
    /*
        Controller for refresher
     */
    .controller("WoHistoryController.Refresher",[
      "$scope",
      "$ionicScrollDelegate",
      "$element",
      "$log",
      function($scope, $ionicScrollDelegate, $element, $log){
        // setup refresher attributes
        $scope.logPrefix = "WoHistoryController.Refresher: ";
        $scope.limit = $element[0].offsetWidth;
        $scope.readyToReload = false;
        $scope.scroller = null;

        // function reset the status of refresher
        function resetRefresher(){
          if($scope.scroller){
            $scope.scroller.freezeScroll(false);  // defreeze scroller
            $scope.scroller.scrollTo(0, 0, true); // move scroller to init position
          }

          $scope.readyToReload = false;   // back to free status
        }

        // on scroll handler
        $scope.handleScroll = function(handle){

          // reached maximum load
          if($scope.$parent.reachedMax()) return;

          // get scroller position info
          var scroller = $ionicScrollDelegate.$getByHandle(handle),
              left = scroller.getScrollPosition().left;

          // update refresher indicator
          if(left < -$scope.limit){
            if($scope.readyToReload){ // prevent refresher update when it is ready to refresh
              return;
            }

            // update refresher status according to scroller position
            $scope.$apply(function(){
              $scope.scroller = $ionicScrollDelegate.$getByHandle(handle);  // remember the scroller for defreeze
              scroller.freezeScroll(true);                // freeze scroller, prepare for refreshing
              scroller.scrollTo(-$scope.limit, 0, true);  // move to the reloading position

              $scope.readyToReload = true;      // set the isReloading status
              $log.debug($scope.logPrefix + "ready to reload");
            });
          }
        };

        // scroll complete handler
        $scope.handleCompleteScroll = function(handle){
          if($scope.readyToReload && !$scope.$parent.loading){
            $scope.$apply(function(){
              $scope.$parent.loading = true;
            });
          }
        };

        // watcher parent scope loading status
        $scope.$watch(
          function watchParentLoading(){
            return $scope.$parent.loading;
          },
          function handleParentLoading(newValue, oldValue){
            $log.debug($scope.logPrefix + "finish reload, reset refresher status");
            resetRefresher();
          }
        )
      }])
    /*
        Refresher directive
     */
    .directive("historyRefresher", ["$ionicScrollDelegate", function(ionicScrollDelegate){
      return {
        restrict: "E",
        templateUrl: "app/history/history-refresher.html",
        controller: "WoHistoryController.Refresher as refreshCtrl",
      }
    }]);
})();
