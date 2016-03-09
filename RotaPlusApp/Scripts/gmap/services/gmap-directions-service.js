//gmap-directions-service
var gmap = angular.module("gmap");

gmap.service("gmap-directions-service", function ($q, $timeout, $interval) {

    /*OBTERROTA*/    
    var paginarWaypoints = function (waypoints, departureDate) {
        var primaryProcess = $q.defer();

        $timeout(function (waypoints, departureDate) {
            debugger;
            
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
        debugger;
        var primaryProcess = $q.defer();

        var directionsService = new google.maps.DirectionsService();

        for (var i = 0; i < paginarWaypointsResponse.responseData.length; i++) {

            $timeout(function (pagesArray, index) {
                primaryProcess.notify({ message: 'Efetuando a solicitação do mapeamento da rota...' });
                directionsService.route(pagesArray[index].requestDirections, function (result, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        primaryProcess.notify({ message: 'Recebendo dados de trajeto de rota...' });
                        pagesArray[index].responseDirections = result;
                        
                        if (_.filter(pagesArray, function (page) { return !page.responseDirections }).length == 0) 
                            primaryProcess.resolve({ responseData: result, pages: pagesArray });
                        
                    } else {
                        window.alert("Não foi possivel calcular esta rota");
                    }
                });
            }, 1000 * i, false, paginarWaypointsResponse.responseData, i);
        }    
        return primaryProcess.promise;
    };
    
    this.ObterRota = function (waypoins, departureDate) {
        var primaryProcess = $q.defer();

        paginarWaypoints(waypoins, departureDate)
            .then(
            /*Resolve*/
            function (response) {
                debugger;
                return requisitarRotasWaypoints(response, departureDate);
            },
            /*Error*/
            function (error) {
                primaryProcess.reject(error);
            },
            /*Notify*/
            function (update) {
                debugger;
                primaryProcess.notify(update);
            })
            .then(
                /*Resolve*/
                function (response) {
                    debugger;
                    primaryProcess.resolve(response);
                },
                /*Error*/
                function (error) {
                    primaryProcess.reject(error);
                },
                /*Notify*/
                function (update) {
                    debugger;
                    primaryProcess.notify(update);
                });

        return primaryProcess.promise;        
    };
    /*OBTERROTA*/

    /*CALCULARREDUCOES*/
    this.CalcularReducoes = function (data, waypoints) {
        var proccess = $q(function (resolve, reject) {

            var allLegs = [];
            var allSteps = [];
            var ttTrajeto = 0;
            
            var maxDistanceToCalculate = 25 * 1000;

            for (var i = 0; i < data.pages.length; i++) {
                var legs = data.pages[i].responseDirections.routes[0].legs
                for (var j = 0; j < legs.length; j++) {
                    
                    var leg = legs[j];
                    leg.legIndex = j;

                    leg.steps[0].start_location = waypoints[j].selectedLocation;

                    leg.steps[0].path.splice(0, 0, waypoints[j].selectedLocation);

                    allLegs.push(leg);
                    for (var k = 0; k < leg.steps.length; k++) {
                        var step = leg.steps[k];
                        step.stepIndex = k;
                        step.legIndex = j;
                        step.haveSubSteps = step.distance.value > maxDistanceToCalculate;

                        allSteps.push(step);
                    }
                }
            }

            var _stepsToReduce = _.filter(allSteps, function (stp) {
                return stp.haveSubSteps;
            });

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
                        }
                    }
                }
            }

            resolve(allSteps);

        }).then(function (allSteps) {
            var deferred = $q.defer();
            
            var distanceMatrixService = new google.maps.DistanceMatrixService();

            var _stepsToReduce = _.filter(allSteps, function (stp) {
                return stp.haveSubSteps;
            });

            var pagePaths = [];

            for (var a = 0; a < _stepsToReduce.length; a++) {
                for (var b = 0; b < _stepsToReduce[a].reducePagesPaths.length; b++)
                {
                    pagePaths.push(_stepsToReduce[a].reducePagesPaths[b]);
                }
            }
            if (pagePaths.length > 0) {
                for (var x = 0; x < pagePaths.length; x++) {

                    $timeout(function (path, allSteps) {
                        var distanceMatrixService = new google.maps.DistanceMatrixService();
                        distanceMatrixService.getDistanceMatrix(path.requestDistance, function (result, status) {
                            path.responseDistance = result
                            deferred.notify({ steps: allSteps });
                        });

                    }, 1000 * x, false, pagePaths[x], allSteps);

                }
            } else {
                $timeout(function (allSteps) {
                    deferred.notify({ steps: allSteps });
                }, 500, false, allSteps);
            }
            
            return deferred.promise;
        });

        var deferred = $q.defer();

        proccess.then(function (data) { }
        , function (data) { }
        , function (data) {
            var valid = true;

            var steps = _.filter(data.steps, function (item) { return item.haveSubSteps });
            for (var i = 0; i < steps.length && valid; i++) {
                for (var j = 0; j < steps[i].reducePagesPaths.length && valid; j++) {
                    if (!steps[i].reducePagesPaths[j].responseDistance) {
                        valid = false;
                        break;
                    }
                }
            }

            if (valid) {
                
                var transSteps = [];
                for (var i = 0; i < data.steps.length; i++) {
                    var currStep = data.steps[i];
                    if (!currStep.haveSubSteps) {
                        transSteps.push(currStep);
                    } else {
                        for (var j = 0; j < currStep.reducePagesPaths.length; j++) {
                            
                            var redPage = currStep.reducePagesPaths[j];
                            var nStp = {
                                distance: redPage.responseDistance.rows[0].elements[0].distance
                                , duration: redPage.responseDistance.rows[0].elements[0].duration
                                , end_location: redPage.itens[redPage.itens.length-1]
                                , start_location: redPage.itens[0]
                                , path: redPage.itens
                            };
                            transSteps.push(nStp);
                        }
                    }
                }
                deferred.resolve({reducedSteps: transSteps});
            }

        });

        return deferred.promise;
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