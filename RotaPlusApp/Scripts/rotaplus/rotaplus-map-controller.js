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
                for (var i = 0; i < $scope.waypoints.length; i++)
                    $scope.waypoints[i].index = i;

                var totalPercorrido = 0;
                var totalPercorridoTrecho = 0;
                var tamanhoTrecho = 130 * 1000;
                var totalSeconds = 0;
                var dataAtual = $scope.DepartureDate ? $scope.DepartureDate.date : new Date();

                for (var i = 0; i < reductions.reducedSteps.length; i++) {
                    var step = reductions.reducedSteps[i];
                    
                    var fPoint = _.filter($scope.waypoints, function (point) { return point.selectedLocation.lat() == step.start_location.lat() && point.selectedLocation.lng() == step.start_location.lng(); });

                    if (fPoint.length > 0)
                    {
                        if (fPoint[0].index == 0) {
                            markerSrc.addMarker(fPoint[0], $scope.currentMap, 'Content/img/motorbike.png');
                        }
                        else {
                            markerSrc.addMarker(fPoint[0] , $scope.currentMap, 'Content/img/photo.png');
                        }

                        step.isWaypoint = true;

                    } else if (totalPercorridoTrecho >= tamanhoTrecho) {
                        markerSrc.addMarker({ selectedLocation: step.end_location }, $scope.currentMap, 'Content/img/fillingstation.png');



                        
                        totalPercorridoTrecho = 0;
                    }
                    else if (i == reductions.reducedSteps.length - 1) {
                        markerSrc.addMarker($scope.waypoints[$scope.waypoints.length -1], $scope.currentMap, 'Content/img/finish.png');
                    }

                    totalPercorridoTrecho += step.distance.value;
                    totalPercorrido += step.distance.value;

                    totalSeconds += step.duration.value;
                    dataAtual.setSeconds(dataAtual.getSeconds() + step.duration.value);

                }
            });

            

        });
    };


}]);
