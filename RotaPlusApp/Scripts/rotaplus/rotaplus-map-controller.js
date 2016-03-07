var rotaplus = angular.module('rotaplus');
rotaplus.controller('rotaplus-map-controller', ['$scope', 'gmap-geocode-service', function ($scope, geoCode) {
    $scope.currentMap = null;
    $scope.addressAutoComplete = null;

    $scope.waypoints = [];

    $scope.test = function () {
        debugger;
    }

    $scope.$watch('addressAutoComplete', function (newValue, oldValue) {
        if ($scope.addressAutoComplete != null)
            $scope.IncluirWayPoint($scope.addressAutoComplete);
    });

    $scope.IncluirWayPoint = function (waypointInfo) {
        geoCode.GetGeocodeData($scope.addressAutoComplete).then(function (data) {
            var duplicated = false;

            for (var i = 0; i < $scope.waypoints.length; i++) {
                if ($scope.waypoints[i].compare(data.result.selectedLocation)) {
                    duplicated = true;
                    break;
                }
            }

            if (!duplicated) {
                var nWaypoint = data.result;
                nWaypoint.stopSeconds = 1800;
                nWaypoint.stopTimeControl = "Sem parada";

                $scope.waypoints.push(nWaypoint);
            } else {
                window.alert('Localidade já adicionada.');
            }
        });
    };

    $scope.RemoverWayPoint = function (index) {
        $scope.waypoints.splice(index, 1);
    }


}]);
