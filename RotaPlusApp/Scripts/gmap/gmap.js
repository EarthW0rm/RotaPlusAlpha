var gmap = angular.module("gmap", []);

gmap.run(['$rootScope', function ($rootScope) {
    /*Run gmap module*/

    $('#map-container').css('height', mapHeight + 'px');

    $rootScope.GoogleMap = new google.maps.Map($('#map-container')[0], {
        center: { lat: -23.608336, lng: -46.646996 },
        zoom: 8,
        mapTypeControl: false
    });

}]);