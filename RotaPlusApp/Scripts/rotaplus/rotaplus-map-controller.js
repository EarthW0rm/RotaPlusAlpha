var rotaplus = angular.module('rotaplus');
rotaplus.controller('rotaplus-map-controller', ['$scope', 'gmap-geocode-service', function ($scope, geoCode) {
    $scope.currentMap = null;
    $scope.addressAutoComplete = null;

    $scope.test = function () {
        
        geoCode.GetGeocodeData($scope.addressAutoComplete).then(function (data) {
            debugger;
        });
    }

    $scope.$watch('addressAutoComplete', function (newValue, oldValue) {
        if ($scope.addressAutoComplete != null) {
            geoCode.GetGeocodeData($scope.addressAutoComplete).then(function (data) {
                debugger;
            });
        }

    })
}]);
