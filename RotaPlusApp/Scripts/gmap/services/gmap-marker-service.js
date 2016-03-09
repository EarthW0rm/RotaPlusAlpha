var gmap = angular.module("gmap");

gmap.service("gmap-marker-service", function ($q) {
    
    var googleGeocodeService = new google.maps.Geocoder();

    this.addMarker = function (geocodeData, gmapMap, icon, infoWindowContent) {
        return $q(function (resolve, reject) {
            geocodeData.currentMarker = new google.maps.Marker({
                position: geocodeData.selectedLocation,
                title: geocodeData.input_string,
                icon: icon ? icon : 'Content/img/star-3.png'
            });

            geocodeData.currentMarker.setMap(gmapMap);

            if (infoWindowContent) {
                geocodeData.currentMarker.infowindow = new google.maps.InfoWindow({
                    content: infoWindowContent
                })

                geocodeData.currentMarker.addListener('click', function (e) {
                    this.infowindow.open(this.map, this);
                });
            }            

            resolve(geocodeData.currentMarker);
        });
    };

    this.fitBounds = function (markers, gmapMap) {
        return $q(function (resolve, reject) {
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < markers.length; i++) {
                bounds.extend(markers[i].selectedLocation);
            }
            gmapMap.fitBounds(bounds);

            resolve(bounds);
        });
    };

});