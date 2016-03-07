var gmap = angular.module("gmap", []);

gmap.run(['$rootScope', function ($rootScope) {
    /*Run gmap module*/
    var mapHeight = screen.height - 175;
    $('#map-container').css('height', mapHeight + 'px');
    $('.waypoints').css('max-height', (mapHeight - 400) + 'px');

}]);