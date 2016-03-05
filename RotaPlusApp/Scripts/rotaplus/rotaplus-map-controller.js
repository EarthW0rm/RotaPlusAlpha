var rotaplus = angular.module('rotaplus');
rotaplus.controller('rotaplus-map-controller',['$scope', function ($scope) {
    $scope.currentMap = null;
    $scope.addressAutoComplete = null;

    $scope.test = function () {
        var te = $scope;
        debugger;
    }
}]);
