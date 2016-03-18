// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', [
  'ionic',
  'ngCordova',

  'woFilter',
  'woServices.google',
  'woServices.localStorage',

  'woHomeModule',
  'woHomeModule.list',
  'woHomeModule.map',
  'woDetailModule',
  'woHistoryModule'
])

.run(function($ionicPlatform, $rootScope, $window) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

  // Add online/offline listener
  $rootScope.online = navigator.onLine;
  $window.addEventListener("offline", function() {
    $rootScope.$apply(function() {
      $rootScope.online = false;
    });
  }, false);

  $window.addEventListener("online", function() {
    $rootScope.$apply(function() {
      $rootScope.online = true;
    });
  }, false);
})
  // router
  .config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider){
    // disable swipe-to-go-back feature, has buggy behaviors
    $ionicConfigProvider.views.swipeBackEnabled(false);

    $stateProvider
      .state("home",{
        abstract: true,
        url: '/home',
        templateUrl: 'app/home/home.html',
        controller: 'WoHomeController as homeCtrl'
      })
      .state("home.list",{
        url: '/list',
        views: {
          "content": {
            templateUrl: "app/home/list/home.listcontent.html",
            controller: "WoHomeController.favList as favListCtrl"
          }
        }
      })
      .state("home.map",{
        url: '/map',
        views: {
          "content": {
            templateUrl: "app/home/map/home.mapcontent.html",
            controller: "WoHomeController.map as mapCtrl"
          }
        }
      })
      .state("detail",{
        cache: false,
        url: '/detail',
        templateUrl: 'app/detail/detail.html',
        controller: "WoDetailController as detailCtrl",
        params: {
          weather: null,
        },
      })
      .state("history",{
        url: '/history/:city',
        templateUrl: 'app/history/history.html',
        controller: "WoHistoryController as historyCtrl",
        resolve:{
          viewSize: ["$window", function($window){
            if(ionic.Platform.isWebView()){ // view size on device's landscape view
              var vs = {
                "h": $window.screen.width,
                "w": $window.screen.height,
              };
            }else{                          // view size on development browser
              var vs = {
                "h": $window.screen.height,
                "w": $window.screen.width,
              };
            }
            return vs;
          }],
        },
        onEnter: function($cordovaStatusbar){
          // hide status bar in history view, only work on device webview
          if(ionic.Platform.isWebView() && $cordovaStatusbar){
            $cordovaStatusbar.hide();
          }
          // change screen orientation
          console.log('Change Orientation to:' + JSON.stringify(screen.orientation));
          if(ionic.Platform.isWebView() && screen){
            screen.lockOrientation('landscape');
          }
        },
        onExit: function($cordovaStatusbar){
          // change screen orientation
          console.log('Change Orientation to:' + JSON.stringify(screen.orientation));
          if(ionic.Platform.isWebView() && screen){
            screen.lockOrientation('portrait');
          }
          // hide status bar in history view, only work on device webview
          if(ionic.Platform.isWebView() && $cordovaStatusbar){
            $cordovaStatusbar.show();
          }
        }
      });

      $urlRouterProvider.otherwise("/home/list");
  });






