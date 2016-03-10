//gmap-directions-service
var gmap = angular.module("gmap");

gmap.service("gmap-directions-service", function ($q, $timeout, $interval) {

    /*OBTERROTA*/    
    var paginarWaypoints = function (waypoints, departureDate) {
        var primaryProcess = $q.defer();

        $timeout(function (waypoints, departureDate) {
           
            var waypointsPages = [];
            primaryProcess.notify({ message: 'Iniciando divisão de pontos do trajeto.' });

            for (var i = 0; i < waypoints.length; i += 9) {
                waypointsPages.push({ itens: waypoints.slice(i, 9 + i + 1) });
                primaryProcess.notify({ message: 'Página de pontos criada...' });
            }

            primaryProcess.notify({ message: 'Criando solicitações de rota.' });

            for (var i = 0; i < waypointsPages.length; i++) {
                waypointsPages[i].requestDirections = {
                    origin: waypointsPages[i].itens.slice(0, 1)[0].selectedLocation
                    , destination: waypointsPages[i].itens.slice(waypointsPages[i].itens.length - 1, waypointsPages[i].itens.length)[0].selectedLocation
                    , waypoints: waypointsPages[i].itens.length > 2 ? _.map(waypointsPages[i].itens.slice(1, waypointsPages[i].itens.length - 1), function (item) {
                        return { location: item.selectedLocation };
                    }) : []
                    , optimizeWaypoints: false
                    , travelMode: google.maps.DirectionsTravelMode.DRIVING
                    , transitOptions: {
                        departureTime: departureDate ? departureDate : new Date()
                    }
                    , drivingOptions: {
                        departureTime: departureDate ? departureDate : new Date()
                        , trafficModel: "pessimistic"
                    }
                    , unitSystem: google.maps.UnitSystem.METRIC
                };
                primaryProcess.notify({ message: 'Solicitação de rota criada...' });
            }

            primaryProcess.notify({ message: waypoints.length + " pontos no trajeto, dividido em " + waypointsPages.length + (waypointsPages.length > 1 ? ' rota' : ' rotas'), responseData: waypointsPages });
            primaryProcess.resolve({ responseData: waypointsPages });

        }, 0, false, waypoints, departureDate);
        
        return primaryProcess.promise;
    };

    var requisitarRotasWaypoints = function (paginarWaypointsResponse, departureDate) {
        var primaryProcess = $q.defer();

        var directionsService = new google.maps.DirectionsService();

        for (var i = 0; i < paginarWaypointsResponse.responseData.length; i++) {

            $timeout(function (pagesArray, index) {
                primaryProcess.notify({ message: 'Efetuando a solicitação do mapeamento da rota...' });
                directionsService.route(pagesArray[index].requestDirections, function (result, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        primaryProcess.notify({ message: 'Recebendo dados de trajeto de rota...' });
                        pagesArray[index].responseDirections = result;
                        
                        if (_.filter(pagesArray, function (page) { return !page.responseDirections }).length == 0) {
                            primaryProcess.notify({ message: 'Rotas recebidas...' });
                            primaryProcess.resolve({ responseData: result, pages: pagesArray });                            
                        }
                        
                    } else {
                        window.alert("Não foi possivel calcular esta rota");
                    }
                });
            }, 1000 * i, true, paginarWaypointsResponse.responseData, i);

        }    
        return primaryProcess.promise;
    };
    
    this.ObterRota = function (waypoins, departureDate) {
        var primaryProcess = $q.defer();

        paginarWaypoints(waypoins, departureDate)
            .then(
            /*Resolve*/
            function (response) {
                return requisitarRotasWaypoints(response, departureDate);
            },
            /*Error*/
            function (error) {
                primaryProcess.reject(error);
            },
            /*Notify*/
            function (update) {
                return primaryProcess.notify(update);
            })
            .then(
                /*Resolve*/
                function (response) {
                    primaryProcess.resolve(response);
                },
                /*Error*/
                function (error) {
                    primaryProcess.reject(error);
                },
                /*Notify*/
                function (update) {
                    primaryProcess.notify(update);
                });

        return primaryProcess.promise;        
    };
    /*OBTERROTA*/

    /*CALCULARREDUCOES*/
    var spliStepsToReduce = function (data, waypoints) {
        var primaryProcess = $q.defer();

        $timeout(function (data, waypoints) {
            var maxDistanceToCalculate = 25 * 1000;

            var allSteps = [];

            primaryProcess.notify({message: "Filtrando passos do trajeto que necessitam de redução"});
            for (var i = 0; i < data.pages.length; i++) {
                var legs = data.pages[i].responseDirections.routes[0].legs
                for (var j = 0; j < legs.length; j++) {
                    legs[j].steps[0].start_location = waypoints[j].selectedLocation;
                    legs[j].steps[0].path.splice(0, 0, waypoints[j].selectedLocation);

                    for (var k = 0; k < legs[j].steps.length; k++) {
                        var step = legs[j].steps[k];
                        step.haveSubSteps = step.distance.value > maxDistanceToCalculate;
                        allSteps.push(step);
                    }
                }
            }
            primaryProcess.notify({ message: "Localizado " + _.filter(allSteps, function (item) { return item.haveSubSteps; }).length + " passos para redução;" });

            primaryProcess.notify({ message: "Iniciando processo de calculo de páginas para redução." });
            var totalReduces = 0;

            for (var i = 0; i < allSteps.length; i++) {
                var _stpReduce = allSteps[i];
                if (_stpReduce.haveSubSteps) {
                    _stpReduce.reducePagesPaths = [];

                    var divizor = parseInt(_stpReduce.distance.value / maxDistanceToCalculate);
                    var dividendo = parseInt(parseInt(_stpReduce.path.length / divizor) / 2);

                    for (var k = 0; k < _stpReduce.path.length; k += dividendo) {
                        var rPaths = _stpReduce.path.slice(k, dividendo + k + 1);
                        if (rPaths.length > 1) {
                            var pathPage = { itens: rPaths };

                            pathPage.responseDistance = undefined;
                            pathPage.requestDistance = {
                                origins: [rPaths[0]]
                                , destinations: [rPaths[rPaths.length - 1]]
                                , travelMode: google.maps.DirectionsTravelMode.DRIVING
                                , transitOptions: {
                                    departureTime: new Date()
                                }
                                , drivingOptions: {
                                    departureTime: new Date()
                                    , trafficModel: "pessimistic" // google.maps.TrafficModel.OPTIMISTIC, google.maps.TrafficModel.BEST_GUESS

                                }
                                , unitSystem: google.maps.UnitSystem.METRIC
                            };
                            _stpReduce.reducePagesPaths.push(pathPage);
                            totalReduces += 1;
                        }
                    }
                }
            }

            primaryProcess.notify({ message: "Um total de " + totalReduces + " reduções serão calculadas, com base no divisor " + (maxDistanceToCalculate /1000) + " kms" });
            
            primaryProcess.resolve(allSteps);

            //Fim Timeout
        }, 0, false, data, waypoints);

        return primaryProcess.promise;
    }
    
    var calculateDistanceMatrix = function (allSteps) {
        var primaryProcess = $q.defer();

        $timeout(function (allSteps) {
            primaryProcess.notify({ message: "Iniciando pesquisas de redução" });
            var _stepsToReduce = _.filter(allSteps, function (stp) { return stp.haveSubSteps; });

            var pagePaths = [];
            for (var a = 0; a < _stepsToReduce.length; a++) {
                for (var b = 0; b < _stepsToReduce[a].reducePagesPaths.length; b++) {
                    pagePaths.push(_stepsToReduce[a].reducePagesPaths[b]);
                }
            }

            if (pagePaths.length > 0) {
                for (var x = 0; x < pagePaths.length; x++) {
                    $timeout(function (path, allSteps, index, total) {
                        primaryProcess.notify({ message: "Solicitando calculo de redução nº" + index + " de " + total });

                        var distanceMatrixService = new google.maps.DistanceMatrixService();
                        distanceMatrixService.getDistanceMatrix(path.requestDistance, function (result, status) {
                            primaryProcess.notify({ message: "Agregando redução nº" + index + " de " + total });
                            path.responseDistance = result
                            
                            var valid = true;
                            var steps = _.filter(allSteps, function (item) { return item.haveSubSteps });

                            for (var i = 0; i < steps.length && valid; i++) {
                                for (var j = 0; j < steps[i].reducePagesPaths.length && valid; j++) {
                                    if (!steps[i].reducePagesPaths[j].responseDistance) {
                                        valid = false;
                                        break;}}}
                            if (valid) {
                                var transSteps = [];
                                for (var i = 0; i < allSteps.length; i++) {
                                    var currStep = allSteps[i];
                                    if (!currStep.haveSubSteps) {
                                        transSteps.push(currStep);
                                    } else {
                                        for (var j = 0; j < currStep.reducePagesPaths.length; j++) {

                                            var redPage = currStep.reducePagesPaths[j];
                                            var nStp = {
                                                distance: redPage.responseDistance.rows[0].elements[0].distance
                                                , duration: redPage.responseDistance.rows[0].elements[0].duration
                                                , end_location: redPage.itens[redPage.itens.length - 1]
                                                , start_location: redPage.itens[0]
                                                , path: redPage.itens
                                            };
                                            transSteps.push(nStp);
                                        }
                                    }
                                }
                                primaryProcess.resolve({ reducedSteps: transSteps });
                            }

                        });

                    }, 1000 * x, false, pagePaths[x], allSteps, x, pagePaths.length);
                }
            } else {
                $timeout(function (allSteps) {
                    primaryProcess.resolve({ reducedSteps: allSteps });
                }, 500, false, allSteps);
            }
        }, 0, false, allSteps);

        return primaryProcess.promise;
    }
    
    this.CalcularReducoes = function (data, waypoints) {
        var primaryProcess = $q.defer();

        spliStepsToReduce(data, waypoints)
            .then(
            /*Resolve*/
            function (response) {
                return calculateDistanceMatrix(response);
            },
            /*Error*/
            function (error) {
                primaryProcess.reject(error);
            },
            /*Notify*/
            function (update) {
                return primaryProcess.notify(update);
            })
            .then(
                /*Resolve*/
                function (response) {
                    primaryProcess.resolve(response);
                },
                /*Error*/
                function (error) {
                    primaryProcess.reject(error);
                },
                /*Notify*/
                function (update) {
                    primaryProcess.notify(update);
                });

        return primaryProcess.promise;

    }
    
    /*CALCULARREDUCOES*/
    this.ExibirDirecoes = function (responseDirections, gmapMap) {
        var directionsDisplay = new google.maps.DirectionsRenderer();

        directionsDisplay.setMap(gmapMap);
        directionsDisplay.setOptions({ suppressMarkers: true });
        directionsDisplay.setDirections(angular.copy(responseDirections));

        return directionsDisplay;
    };


});