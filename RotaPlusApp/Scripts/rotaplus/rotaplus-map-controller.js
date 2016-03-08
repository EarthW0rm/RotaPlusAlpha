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

            var allLegs = [];

            for (var i = 0; i < data.pages.length; i++) {
                var legs = data.pages[i].responseDirections.routes[0].legs
                for (var j = 0; j < legs.length; j++) {
                    var leg = legs[j];
                    allLegs.push(leg);
                }
            }


            /*********************************************************************************************************************************************************/

            var dataAtual = new Date();
            var kmsPercorrido = 0.0;
            var kmsPercorridoTotal = 0.0;
            var secDecorridos = 0;
            var secDecorridosTotal = 0;
            var kmsParada = 130;
            var TempoAbastecimento =30

            for (var i = 0; i < allLegs.length; i++) {
                var itemLeg = allLegs[i];

                for (var j = 0; j < itemLeg.steps.length; j++) {
                    var itemStep = itemLeg.steps[j];

                    secDecorridos += itemStep.duration.value;
                    secDecorridosTotal += itemStep.duration.value;
                    kmsPercorrido += (itemStep.distance.value / 1000);
                    kmsPercorridoTotal += (itemStep.distance.value / 1000);
                    dataAtual.setSeconds(dataAtual.getSeconds() + itemStep.duration.value);

                    //QUANDO ATINGIR O MAXIMO DO TRECHO
                    if (kmsPercorrido >= kmsParada) {

                        var dataSaida = new Date(dataAtual);
                        dataSaida.setMinutes(dataSaida.getMinutes() + TempoAbastecimento);

                        var dataTempo = new Date(1982, 5, 15, 0, 0, 0, 0);
                        dataTempo.setSeconds(secDecorridos);

                        var _marker = new google.maps.Marker({
                            position: itemStep.end_location,
                            title: dataAtual.toString(),
                            icon: 'Content/img/fillingstation.png',
                            infowindow: new google.maps.InfoWindow({
                                content: '<div id="content"><div id="bodyContent"><ul>'
                                    + '<li><b>Latitude Longitude:</b>' + itemStep.end_location.lat() + " , " + itemStep.end_location.lng() + '</li>'
                                    + '<li><b>Quilometragem:</b>' + kmsPercorrido + '</li>' + '<li><b>Quilometragem Total:</b>' + kmsPercorridoTotal + '</li>'
                                    + '<li><b>Tempo a partir do ultimo ponto:</b> horas ' + dataTempo.getHours() + ', minutos ' + dataTempo.getMinutes() + '</li>'
                                    + '<li><b>Horario Chegada:</b>' + dataAtual.toString() + '</li>'
                                    + '<li><b>Horario Saida:</b>' + dataSaida.toString() + '</li>'
                                    + '</ul></div></div>'
                            })
                        });

                        dataAtual.setMinutes(dataAtual.getMinutes() + TempoAbastecimento);

                        _marker.addListener('click', function (e) {
                            this.infowindow.open($scope.currentMap, this);
                        });
                        _marker.setMap($scope.currentMap);
                        
                        secDecorridos = 0;
                        kmsPercorrido = 0;
                    }
                }

                //if ($scope.waypoints.length > 0) {
                //    var parada = $scope.waypoints[i];
                //    if (parada != undefined) {
                //        debugger;
                //        var tempoParada = (parseInt(parada.Tempo.split(':')[0]) * 60) + parseInt(parada.Tempo.split(':')[1])

                //        var dataSaida = new Date(dataAtual);
                //        dataSaida.setMinutes(dataSaida.getMinutes() + tempoParada);

                //        var _marker = new google.maps.Marker({
                //            position: itemLeg.end_location,
                //            title: dataAtual.toString(),
                //            icon: 'Content/photo.png',
                //            infowindow: new google.maps.InfoWindow({
                //                content: '<div id="content"><div id="bodyContent"><ul>'
                //                    + '<li><b>Latitude Longitude:</b>' + itemLeg.end_location.lat() + " , " + itemLeg.end_location.lng() + '</li>'
                //                    + '<li><b>Horario Chegada:</b>' + dataAtual.toString() + '</li>'
                //                    + '<li><b>Horario Saida:</b>' + dataSaida.toString() + '</li>'
                //                    + '</ul></div></div>'
                //            })
                //        });

                //        dataAtual.setMinutes(dataAtual.getMinutes() + tempoParada);

                //        _marker.addListener('click', function (e) {
                //            this.infowindow.open(App.GoogleMap, this);
                //        });
                //        _marker.setMap(App.GoogleMap);

                //        App.GasMarkers.push(_marker);
                //    }
                //}

                //if (i == 0) {
                //    var _marker = new google.maps.Marker({
                //        position: itemLeg.start_location,
                //        title: App.Componets.DataPartida.toString(),
                //        icon: 'Content/motorbike.png',
                //        infowindow: new google.maps.InfoWindow({
                //            content: '<div id="content"><div id="bodyContent"><ul>'
                //                + '<li><b>Latitude Longitude:</b>' + itemLeg.start_location.lat() + " , " + itemLeg.start_location.lng() + '</li>'
                //                + '<li><b>Horario Saida:</b>' + App.Componets.DataPartida.toString() + '</li>'
                //                + '</ul></div></div>'
                //        })
                //    });

                //    _marker.addListener('click', function (e) {
                //        this.infowindow.open(App.GoogleMap, this);
                //    });
                //    _marker.setMap(App.GoogleMap);

                //    App.GasMarkers.push(_marker);
                //}

                //if (i == result.routes[0].legs.length - 1) {
                //    var _marker2 = new google.maps.Marker({
                //        position: itemLeg.end_location,
                //        title: dataAtual.toString(),
                //        icon: 'Content/finish.png',
                //        infowindow: new google.maps.InfoWindow({
                //            content: '<div id="content"><div id="bodyContent"><ul>'
                //                + '<li><b>Latitude Longitude:</b>' + itemLeg.end_location.lat() + " , " + itemLeg.end_location.lng() + '</li>'
                //                + '<li><b>Horario Chegada:</b>' + dataAtual.toString() + '</li>'
                //                + '</ul></div></div>'
                //        })
                //    });

                //    _marker2.addListener('click', function (e) {
                //        this.infowindow.open(App.GoogleMap, this);
                //    });
                //    _marker2.setMap(App.GoogleMap);

                //    App.GasMarkers.push(_marker2);
                //}

            }





            /**********************************************************************************************************************************************************/

            debugger;

        });
    };


}]);
