﻿var gmap = angular.module("gmap");

gmap.service("gmap-marker-service", function ($q) {
    
    var googleGeocodeService = new google.maps.Geocoder();

    this.addMarker = function (geocodeData, gmapMap) {
        var deferred = $q.defer();

        geocodeData.currentMarker = new google.maps.Marker({
            position: geocodeData.selectedLocation,
            title: geocodeData.input_string,
            icon: 'Content/img/star-3.png'
        });
        geocodeData.currentMarker.setMap(gmapMap);

        deferred.resolve();        
        
        return deferred.promise;
    };

    this.fitBounds = function (markers, gmapMap) {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++)
        {
            bounds.extend(markers[i].selectedLocation);
        }
        gmapMap.fitBounds(bounds);
    };

});