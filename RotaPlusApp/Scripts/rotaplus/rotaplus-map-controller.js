var rotaplus = angular.module('rotaplus');
rotaplus.controller('rotaplus-map-controller', ['$scope', 'gmap-geocode-service', 'gmap-marker-service', 'gmap-directions-service', '$timeout', function ($scope, geoCode, markerSrc, direcSrc, $timeout) {
    //Controles Privados de escopo da controller
    $scope.currentMap = null;
    $scope.addressAutoComplete = null;
    $scope.waypoints = [];

    $scope.directionsDisplays = [];
    $scope.haveCalc = false;

    //Models
    $scope.DepartureDate = moment(new Date()).format("DD/MM/YYYY HH:mm");
    $scope.PathSize = 150;
    $scope.TimeStop = "30 minutos";
    $scope.loadingMessage = "";
        

    //Watch
    $scope.$watch('addressAutoComplete', function (newValue, oldValue) {
        if ($scope.addressAutoComplete != null)
            $scope.IncluirWayPoint($scope.addressAutoComplete);
    });

    //Map Events Callback
    $scope.MapClick = function (ev) {
        $scope.IncluirWayPoint({ geometry: { location: ev.latLng } });
    }

    //Interações do usuário com o mapa
    $scope.IncluirWayPoint = function (waypointInfo) {
        if (!$scope.haveCalc) {
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

                    markerSrc.addMarker(nWaypoint, $scope.currentMap);

                    $scope.waypoints.push(nWaypoint);

                } else {
                    window.alert('Localidade já adicionada.');
                }
            }).then(function () {
                markerSrc.fitBounds($scope.waypoints, $scope.currentMap)
            });
        }
    };
    $scope.RemoverWayPoint = function (index) {
        if (!$scope.haveCalc) {
            if ($scope.waypoints[index].currentMarker) {
                $scope.waypoints[index].currentMarker.setMap(null);
                $scope.waypoints[index].currentMarker = null;
            }

            $scope.waypoints.splice(index, 1);

            markerSrc.fitBounds($scope.waypoints, $scope.currentMap);
        }
    };
       

    $scope.updateLoadingMessageIndex = 1;
    $scope.updateLoadingMessage = function (updateResponse) {
        if (updateResponse && updateResponse.message) {
            $timeout(function () { $scope.loadingMessage = updateResponse.message; }, 0, true);
            $scope.updateLoadingMessageIndex += 1;
        }
    }

    var callbackObterRota = function (data, departureDate) {

        //Incluir resultados de trajeto no mapa
        $scope.updateLoadingMessage({ message: 'Traçando rota no mapa' });
        _.each($scope.directionsDisplays, function (display) {
            display.setMap(null);
        });
        $scope.directionsDisplays = [];

        for (var i = 0; i < data.pages.length; i++) {
            var directionsDisplay = direcSrc.ExibirDirecoes(data.pages[i].responseDirections, $scope.currentMap);
            $scope.directionsDisplays.push(directionsDisplay);
        }
        markerSrc.fitBounds($scope.waypoints, $scope.currentMap);
        $scope.updateLoadingMessage({ message: 'Rota traçada' });
        //Resultados de trajeto incluidos no mapa
        
        direcSrc.CalcularReducoes(data, $scope.waypoints).then(function (reductions) {
            for (var i = 0; i < $scope.waypoints.length; i++)
                $scope.waypoints[i].index = i;

            var totalPercorrido = 0;
            var totalPercorridoTrecho = 0;

            var totalPercorridoTrechoSector = 0;
            //TODO: Constante tamanho do trecho

            var tamanhoTrecho = (parseInt($scope.PathSize) > 0) ? parseInt($scope.PathSize) * 1000 : 150 * 1000;
            var secAlmocoJantar = 60 * 60;
            //TODO: Constante tempo parada abastecimento
            var secAbastecimentoParada = !$scope.TimeStop || $scope.TimeStop.totalSeconds == undefined ? 30 * 60 : $scope.TimeStop.totalSeconds();

            var totalSeconds = 0;
            var totalSecondsTrecho = 0;
            var dataAtual = departureDate.date;

            var haveAlmoco = false;
            var haveJantar = false;

            for (var i = 0; i < reductions.reducedSteps.length; i++) {
                var step = reductions.reducedSteps[i];

                var fPoint = _.filter($scope.waypoints, function (point) { return point.selectedLocation.lat() == step.start_location.lat() && point.selectedLocation.lng() == step.start_location.lng(); });

                var datInicioTrecho = moment(dataAtual).format('DD/MM/YYYY HH:mm');

                if (fPoint.length > 0) {
                    if (fPoint[0].index == 0) {
                        var content = '<div>'
                        + '<ul>'
                        + '<li>'
                        + '<h5>' + fPoint[0].input_string + '</h5>'
                        + '</li>'
                        + '<li>'
                        + '<label>Data Partida: </label>'
                        + '<span>' + moment(dataAtual).format('DD/MM/YYYY HH:mm') + '</span>'
                        + '</li>'
                        + '<li>'
                        + '<small>' + fPoint[0].selectedLocation.lat() + ', ' + fPoint[0].selectedLocation.lng() + '</small>'
                        + '</li>'
                        + '</ul>'
                        + '</div>';

                        totalPercorridoTrechoSector = 0;

                        if (fPoint[0].currentMarker) {
                            fPoint[0].currentMarker.setMap(null);
                            fPoint[0].currentMarker = null;
                        }

                        step.currentMarker = markerSrc.addMarker(fPoint[0], $scope.currentMap, 'Content/img/motorbike.png', content);
                    }
                    else {
                        var totalParada = fPoint[0].stopTimeControl.totalSeconds == undefined ? 0 : fPoint[0].stopTimeControl.totalSeconds();
                        var paradaInfo = {}

                        paradaInfo.dataChegada = new Date(dataAtual);
                        dataAtual.setSeconds(dataAtual.getSeconds() + totalParada);

                        paradaInfo.dataPartida = new Date(dataAtual);
                        paradaInfo.tempoViagem = new Date(2016, 01, 01, 0, 0, totalSeconds, 0);
                        paradaInfo.tempoViagemTrecho = new Date(2016, 01, 01, 0, 0, totalSecondsTrecho, 0);
                        paradaInfo.totalPercorrido = totalPercorrido;
                        paradaInfo.totalPercorridoTrechoSector = totalPercorridoTrechoSector;

                        totalSeconds += totalParada;

                        var content = '<div>'
                        + '<ul>'
                        + '<li>'
                        + '<h5>' + fPoint[0].input_string + '</h5>'
                        + '</li>'
                        + '<li>'
                        + '<label>Data Chegada: </label>'
                        + '<span>' + moment(paradaInfo.dataChegada).format('DD/MM/YYYY HH:mm') + '</span>'
                        + '</li>'
                        + '<li>'
                        + '<label>Data Partida: </label>'
                        + '<span>' + moment(paradaInfo.dataPartida).format('DD/MM/YYYY HH:mm') + '</span>'
                        + '</li>'

                        + '<li>'
                        + '<label>Tempo de Viagem: </label>'
                        + '<span>' + moment(paradaInfo.tempoViagem).format('HH:mm') + '</span>'
                        + '</li>'

                        + '<li>'
                        + '<label>Tempo de Trecho: </label>'
                        + '<span>' + moment(paradaInfo.tempoViagemTrecho).format('HH:mm') + '</span>'
                        + '</li>'

                        + '<li>'
                        + '<label>Total rodado: </label>'
                        + '<span>' + parseInt(paradaInfo.totalPercorrido / 1000) + ' kms</span>'
                        + '</li>'

                        + '<li>'
                        + '<label>Total setor: </label>'
                        + '<span>' + parseInt(totalPercorridoTrechoSector / 1000) + ' kms</span>'
                        + '</li>'


                        + '<li>'
                        + '<small>' + fPoint[0].selectedLocation.lat() + ', ' + fPoint[0].selectedLocation.lng() + '</small>'
                        + '</li>'
                        + '</ul>'
                        + '</div>';

                        if (fPoint[0].currentMarker) {
                            fPoint[0].currentMarker.setMap(null);
                            fPoint[0].currentMarker = null;
                        }

                        step.currentMarker = markerSrc.addMarker(fPoint[0], $scope.currentMap, 'Content/img/photo.png', content);

                        totalPercorridoTrechoSector = 0;
                    }

                    step.isWaypoint = true;

                } else if (totalPercorridoTrecho >= tamanhoTrecho) {



                    step.dataChegada = new Date(dataAtual);
                    dataAtual.setSeconds(dataAtual.getSeconds() + secAbastecimentoParada);

                    step.dataPartida = new Date(dataAtual);
                    step.tempoViagem = new Date(2016, 01, 01, 0, 0, totalSeconds, 0);
                    step.tempoViagemTrecho = new Date(2016, 01, 01, 0, 0, totalSecondsTrecho, 0);
                    step.totalPercorrido = totalPercorrido;
                    step.totalPercorridoTrechoSector = totalPercorridoTrechoSector;

                    totalSeconds += secAbastecimentoParada;

                    //geoCode.GetGeocodeData({ geometry: { location: step.end_location } }, step).then(function (data) {
                    var content = '<div>'
                    + '<ul>'
                    + '<li>'
                    + '<h5>Parada</h5>'
                    + '</li>'
                    + '<li>'
                    + '<label>Data Chegada: </label>'
                    + '<span>' + moment(step.dataChegada).format('DD/MM/YYYY HH:mm') + '</span>'
                    + '</li>'
                    + '<li>'
                    + '<label>Data Partida: </label>'
                    + '<span>' + moment(step.dataPartida).format('DD/MM/YYYY HH:mm') + '</span>'
                    + '</li>'

                    + '<li>'
                    + '<label>Tempo de Viagem: </label>'
                    + '<span>' + moment(step.tempoViagem).format('HH:mm') + '</span>'
                    + '</li>'

                    + '<li>'
                    + '<label>Tempo de Trecho: </label>'
                    + '<span>' + moment(step.tempoViagemTrecho).format('HH:mm') + '</span>'
                    + '</li>'

                    + '<li>'
                    + '<label>Total rodado: </label>'
                    + '<span>' + parseInt(step.totalPercorrido / 1000) + ' kms</span>'
                    + '</li>'

                    + '<li>'
                    + '<label>Total setor: </label>'
                    + '<span>' + parseInt(totalPercorridoTrechoSector / 1000) + ' kms</span>'
                    + '</li>'

                    + '<li>'
                    + '<small>' + step.end_location.lat() + ', ' + step.end_location.lng() + '</small>'
                    + '</li>'
                    + '</ul>'
                    + '</div>';

                    step.currentMarker = markerSrc.addMarker({ selectedLocation: step.end_location }, $scope.currentMap, 'Content/img/fillingstation.png', content);
                    //});                       

                    totalPercorridoTrechoSector = 0;
                    totalPercorridoTrecho = 0;
                    totalSecondsTrecho = 0;


                } else if ((!haveAlmoco && dataAtual.getHours() == 13) || (!haveJantar && dataAtual.getHours() == 19)) {
                    var horaAtual = dataAtual.getHours();
                    
                    step.dataChegada = new Date(dataAtual);
                    dataAtual.setSeconds(dataAtual.getSeconds() + secAlmocoJantar);

                    step.dataPartida = new Date(dataAtual);
                    step.tempoViagem = new Date(2016, 01, 01, 0, 0, totalSeconds, 0);
                    step.tempoViagemTrecho = new Date(2016, 01, 01, 0, 0, totalSecondsTrecho, 0);
                    step.totalPercorrido = totalPercorrido;
                    step.totalPercorridoTrechoSector = totalPercorridoTrechoSector;

                    totalSeconds += secAlmocoJantar;

                    var content = '<div>'
                    + '<ul>'
                    + '<li>'
                    + '<h5>' + (horaAtual == 13? 'Almoço':'Jantar')  + '</h5>'
                    + '</li>'
                    + '<li>'
                    + '<label>Data Chegada: </label>'
                    + '<span>' + moment(step.dataChegada).format('DD/MM/YYYY HH:mm') + '</span>'
                    + '</li>'
                    + '<li>'
                    + '<label>Data Partida: </label>'
                    + '<span>' + moment(step.dataPartida).format('DD/MM/YYYY HH:mm') + '</span>'
                    + '</li>'

                    + '<li>'
                    + '<label>Tempo de Viagem: </label>'
                    + '<span>' + moment(step.tempoViagem).format('HH:mm') + '</span>'
                    + '</li>'

                    + '<li>'
                    + '<label>Tempo de Trecho: </label>'
                    + '<span>' + moment(step.tempoViagemTrecho).format('HH:mm') + '</span>'
                    + '</li>'

                    + '<li>'
                    + '<label>Total rodado: </label>'
                    + '<span>' + parseInt(step.totalPercorrido / 1000) + ' kms</span>'
                    + '</li>'

                    + '<li>'
                    + '<label>Total setor: </label>'
                    + '<span>' + parseInt(totalPercorridoTrechoSector / 1000) + ' kms</span>'
                    + '</li>'

                    + '<li>'
                    + '<small>' + step.end_location.lat() + ', ' + step.end_location.lng() + '</small>'
                    + '</li>'
                    + '</ul>'
                    + '</div>';


                    step.currentMarker = markerSrc.addMarker({ selectedLocation: step.end_location }, $scope.currentMap, 'Content/img/restaurant.png', content);


                    totalPercorridoTrechoSector = 0;
                    totalPercorridoTrecho = 0;
                    totalSecondsTrecho = 0;



                    if (horaAtual == 13)
                        haveAlmoco = true;
                    else
                        haveJantar = true;
                }

                totalPercorridoTrecho += step.distance.value;
                totalPercorrido += step.distance.value;
                totalPercorridoTrechoSector += step.distance.value;

                totalSeconds += step.duration.value;
                totalSecondsTrecho += step.duration.value;

                dataAtual.setSeconds(dataAtual.getSeconds() + step.duration.value);

                if (i == reductions.reducedSteps.length - 1) {
                    var endWaypoint = $scope.waypoints[$scope.waypoints.length - 1];

                    var totalTempo = new Date(2016, 01, 01, 0, 0, totalSeconds, 0);

                    var content = '<div>'
                        + '<ul>'
                        + '<li>'
                        + '<h5>' + endWaypoint.input_string + '</h5>'
                        + '</li>'
                        + '<li>'
                        + '<label>Data Chegada: </label>'
                        + '<span>' + moment(dataAtual).format('DD/MM/YYYY HH:mm') + '</span>'
                        + '</li>'
                        + '<li>'
                        + '<label>Tempo de Viagem: </label>'
                        + '<span>' + moment(totalTempo).format('HH:mm') + '</span>'
                        + '</li>'
                        + '<li>'
                        + '<label>Total rodado: </label>'
                        + '<span>' + parseInt(totalPercorrido / 1000) + ' kms</span>'
                        + '</li>'

                        + '<li>'
                        + '<label>Total setor: </label>'
                        + '<span>' + parseInt(totalPercorridoTrechoSector / 1000) + ' kms</span>'
                        + '</li>'

                        + '<li>'
                        + '<small>' + endWaypoint.selectedLocation.lat() + ', ' + endWaypoint.selectedLocation.lng() + '</small>'
                        + '</li>'
                        + '</ul>'
                        + '</div>';

                    if (endWaypoint.currentMarker) {
                        endWaypoint.currentMarker.setMap(null);
                        endWaypoint.currentMarker = null;
                    }

                    step.currentMarker = markerSrc.addMarker(endWaypoint, $scope.currentMap, 'Content/img/finish.png', content);
                }

            }
        },
        /*Error*/
        function (error) { },
        /*Notify*/
        function (update) {
            $scope.updateLoadingMessage(update);
        }).then(function () {
            $('#modalLoading').modal('hide');
        });
    };

    $scope.CalcularRota = function () {
        $scope.updateLoadingMessageIndex = 1;
        $scope.haveCalc = true;

        $('#modalLoading').modal({ backdrop: 'static', keyboard: false });

        var departureDate = angular.copy($scope.DepartureDate);
        if (!departureDate.date) {
            var dateNow = new Date();
            departureDate = {
                value: moment(dateNow).format("DD/MM/YYYY HH:mm"),
                date: dateNow,
                toString: function () {
                    return moment(this.date).format("DD/MM/YYYY HH:mm");
                }
            };
        }               

        direcSrc.ObterRota($scope.waypoints, departureDate.date).then(
            /*Resolve*/
            function (response) {
                callbackObterRota(response, departureDate)
            },
            /*Error*/
            function (error) {
                
            },
            /*Notify*/
            function (update) {
                $scope.updateLoadingMessage(update);
            });

    };


}]);
