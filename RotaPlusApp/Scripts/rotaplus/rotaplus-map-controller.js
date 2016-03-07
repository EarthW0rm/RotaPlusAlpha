var rotaplus = angular.module('rotaplus');
rotaplus.controller('rotaplus-map-controller', ['$scope', 'gmap-geocode-service', 'gmap-marker-service', function ($scope, geoCode, markerSrc) {
    $scope.currentMap = null;
    $scope.addressAutoComplete = null;

    $scope.waypoints = [];

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
                nWaypoint.stopTimeControl = "sem parada";

                markerSrc.addMarker(nWaypoint, $scope.currentMap).then(function () {
                    $scope.waypoints.push(nWaypoint);
                });
                
            } else {
                window.alert('Localidade já adicionada.');
            }
        }).then(function () {
            markerSrc.fitBounds($scope.waypoints, $scope.currentMap)
        });
    };

    $scope.RemoverWayPoint = function (index) {
        if ($scope.waypoints[index].currentMarker) {
            $scope.waypoints[index].currentMarker.setMap(null);
            $scope.waypoints[index].currentMarker = null;
        }

        $scope.waypoints.splice(index, 1);
    }


}]);
