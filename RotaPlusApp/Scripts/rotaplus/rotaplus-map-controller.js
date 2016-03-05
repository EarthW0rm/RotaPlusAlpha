var rotaplus = angular.module('rotaplus');
rotaplus.controller('rotaplus-map-controller', ['$scope', 'gmap-geocode-service', function ($scope, geoCode) {
    $scope.currentMap = null;
    $scope.addressAutoComplete = null;

    $scope.test = function () {
        debugger;

        geoCode.GetGeocodeData($scope.addressAutoComplete).then(function (data) {
            debugger;
        });
    }
}]);
