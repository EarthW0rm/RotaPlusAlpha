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

                //TODO: Incluir listener para click
            },
            post: function postLink(scope, element, attrs) { return; }
        }
    };
}]);