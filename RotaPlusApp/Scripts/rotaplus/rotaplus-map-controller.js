var rotaplus = angular.module('rotaplus');
rotaplus.controller('rotaplus-map-controller', ['$scope', 'gmap-geocode-service', 'gmap-marker-service', 'gmap-directions-service', function ($scope, geoCode, markerSrc, direcSrc) {
    $scope.currentMap = null;
    $scope.addressAutoComplete = null;
    $scope.waypoints = [];

    $scope.$watch('addressAutoComplete', function (newValue, oldValue) {
        if ($scope.addressAutoComplete != null)
            $scope.IncluirWayPoint($scope.addressAutoComplete);
    });

    $scope.MapClick = function (ev) {
        $scope.IncluirWayPoint({ geometry: { location: ev.latLng } });
    }

    $scope.IncluirWayPoint = function (waypointInfo) {
        geoCode.GetGeocodeData(waypointInfo).then(function (data) {
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

        markerSrc.fitBounds($scope.waypoints, $scope.currentMap);
    };

    $scope.directionsDisplays = [];

    $scope.CalcularRota = function () {
        direcSrc.ObterDirecoes($scope.waypoints, $scope.DepartureDate).then(function (data) {

            _.each($scope.directionsDisplays, function (display) {
                display.setMap(null);
            });

            $scope.directionsDisplays = [];

            for (var i = 0; i < data.pages.length; i++) {
                var directionsDisplay = direcSrc.ExibirDirecoes(data.pages[i].responseDirections, $scope.currentMap);
                $scope.directionsDisplays.push(directionsDisplay);
            }
            markerSrc.fitBounds($scope.waypoints, $scope.currentMap);
            
            direcSrc.CalcularReducoes(data, $scope.waypoints).then(function (reductions) {
                debugger;
            });

            

        });
    };


}]);
