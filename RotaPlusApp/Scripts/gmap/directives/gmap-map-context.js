var gmap = angular.module("gmap");

gmap.directive('gmapMapContext', ['$compile', '$rootScope', function ($compile, $rootScope) {
    return {
        restrict: 'A'
        , scope: {
            currentMap: '@gmMapModel'
            , currentMapContainer: '@gmMapContainer'
        }
        , link: {
            pre: function preLink(scope, element, attrs) {
                scope.$parent[scope.currentMap] = new google.maps.Map(element.find(scope.currentMapContainer)[0]
                    , { center: { lat: -29.608336, lng: -55.646996 },
                        zoom: 8,
                        mapTypeControl: false
                    });


                scope.$parent[scope.currentMap].controls[google.maps.ControlPosition.TOP_LEFT].push($('.map-form')[0]);
                //.map-form
                //TODO: Incluir listener para click
            },
            post: function postLink(scope, element, attrs) { return; }
        }
    };
}]);