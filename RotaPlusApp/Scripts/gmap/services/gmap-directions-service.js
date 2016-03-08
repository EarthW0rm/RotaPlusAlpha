//gmap-directions-service
var gmap = angular.module("gmap");

gmap.service("gmap-directions-service", function ($q) {

    var googleDirectionsService = new google.maps.DirectionsService();

    this.ObterDirecoes = function (waypoins, gmapMap) {
        return $q(function (resolve, reject) {
            debugger
            var waypointsPages = [];

            for (var i = 0; i < waypoins.length; i += 9) {
                waypointsPages.push({itens: waypoins.slice(i, 9 + i + 1)});
            }

            resolve({ pages: waypointsPages });
        }).then(function (data) {

            return $q(function (resolve, reject) {
                debugger;

                for (var i = 0; i < data.pages.length; i++) {

                    data.pages[i].requestDirections = {
                        origin: data.pages[i].itens.slice(0, 1)[0].selectedLocation
                        , destination: data.pages[i].itens.slice(data.pages[i].itens.length - 1, data.pages[i].itens.length)[0].selectedLocation
                        , waypoints: data.pages[i].itens.length > 2 ?  _.map(data.pages[i].itens.slice(1, data.pages[i].itens.length - 1), function (item) {
                            return { location: item.selectedLocation };
                        }) : []
                        , optimizeWaypoints: false
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
                }
                resolve(data);
            });
        }).then(function (data) {
            debugger;

            var deferred = $q.defer();

            var directionsService = new google.maps.DirectionsService();

            for (var i = 0; i < data.pages.length; i++) {
                directionsService.route(data.pages[i].requestDirections, function (result, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        deferred.notify({ data: result, pages: data.pages});
                    }
                });
            }

            return deferred.promise;

        });



    };


    this.getDirections = function (waypoints) {

    };


});