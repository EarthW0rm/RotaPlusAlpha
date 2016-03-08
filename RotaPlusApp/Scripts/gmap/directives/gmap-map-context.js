var gmap = angular.module("gmap");

gmap.directive('gmapMapContext', ['$compile', '$rootScope', function ($compile, $rootScope) {
    return {
        restrict: 'A'
        , scope: {
            currentMap: '@gmMapModel'
            , currentMapContainer: '@gmMapContainer'
            , mapClick: '=gmMapClick'
        }
        , link: {
            pre: function preLink(scope, element, attrs) {
                if (navigator.geolocation) {
                    try {
                        navigator.geolocation.getCurrentPosition(function (data) {
                            if (data.coords) {
                                scope.$parent[scope.currentMap].setCenter({ lat: data.coords.latitude, lng: data.coords.longitude });
                            }
                        });
                    } catch (err) { }
                }
                
                scope.$parent[scope.currentMap] = new google.maps.Map(element.find(scope.currentMapContainer)[0]
                    , { center: { lat: -23.550384, lng: -46.633965 },
                        zoom: 8,
                        mapTypeControl: false
                    });

                scope.$parent[scope.currentMap].addListener('click', function (e) {
                    scope.mapClick(e);
                });

                scope.$parent[scope.currentMap].controls[google.maps.ControlPosition.TOP_LEFT].push($('.map-form')[0]);

                
                //.map-form
                //TODO: Incluir listener para click
            },
            post: function postLink(scope, element, attrs) { return; }
        }
    };
}]);