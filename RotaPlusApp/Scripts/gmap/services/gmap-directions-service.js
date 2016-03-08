//gmap-directions-service
var gmap = angular.module("gmap");

gmap.service("gmap-directions-service", function ($q, $timeout) {

    var googleDirectionsService = new google.maps.DirectionsService();

    this.ObterDirecoes = function (waypoins, departureDate) {
        debugger;
        var ref = $q(function (resolve, reject) {
            var waypointsPages = [];

            for (var i = 0; i < waypoins.length; i += 9) {
                waypointsPages.push({ itens: waypoins.slice(i, 9 + i + 1) });
            }

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
                        departureTime: departureDate ? departureDate.date : new Date()
                    }
                    , drivingOptions: {
                        departureTime: departureDate ? departureDate.date : new Date()
                        , trafficModel: "pessimistic" // google.maps.TrafficModel.OPTIMISTIC, google.maps.TrafficModel.BEST_GUESS

                    }
                    , unitSystem: google.maps.UnitSystem.METRIC
                };
            }

            resolve({ pages: waypointsPages });

        }).then(function (data) {
            var deferred = $q.defer();

            var directionsService = new google.maps.DirectionsService();

            for (var i = 0; i < data.pages.length; i++) {
                $timeout(function (data, i) {
                    directionsService.route(data.pages[i].requestDirections, function (result, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            data.pages[i].responseDirections = result;
                            deferred.notify({ data: result, pages: data.pages });
                        }
                    });
                }, 1000, false, data, i);
            }

            return deferred.promise;
        });

        var deferred = $q.defer();

        ref.then(function (data) { }
        , function (data) { }
        , function (data) {
            return $q(function (resolve, reject) {
                var leftDirections = _.filter(data.pages, function (page) { return !page.responseDirections })

                if (leftDirections.length == 0)
                    deferred.resolve(data);
            });

        });

        return deferred.promise
    };


    this.getDirections = function (waypoints) {

    };


});