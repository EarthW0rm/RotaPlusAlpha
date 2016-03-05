var gmap = angular.module("gmap");

gmap.directive('gmapAddressAutocomplete', [function () {
    return {
        restrict: 'A'
        , scope: {
            currentMap: '=gmMapModel'
            , currentAddresModel: '@gmAddressModel'
        }
        , link: {
            pre: function preLink(scope, element, attrs) {
                if (!scope.gmapAutocomplete) {
                    scope.gmapAutocomplete = new google.maps.places.Autocomplete(element[0]);

                    if(scope.currentMap)
                        scope.gmapAutocomplete.bindTo('bounds', scope.currentMap);

                    scope.gmapAutocomplete.addListener('place_changed', function () {
                        scope.$parent[scope.currentAddresModel] = scope.gmapAutocomplete.getPlace();
                        scope.$apply();
                    });
                }
            },
            post: function postLink(scope, element, attrs) { return; }
        }
    };

}]);