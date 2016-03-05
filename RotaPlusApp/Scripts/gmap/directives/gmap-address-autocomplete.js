var gmap = angular.module("gmap");

gmap.directive('gmapAddressAutocomplete', ['$compile', '$rootScope', function ($compile, $rootScope) {
    return {
        restrict: 'A'
        , link: function (scope, element, attrs) {
            if (!scope.gmapAutocomplete) {
                scope.gmapAutocomplete = new google.maps.places.Autocomplete(element[0]);
                //scope.gmapAutocomplete.bindTo('bounds', $rootScope.GoogleMap);
                scope.gmapAutocomplete.addListener('place_changed', function () {
                    debugger;
                    var place = scope.gmapAutocomplete.getPlace();
                });
            }
        }
    };

}]);