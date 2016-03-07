var gmap = angular.module("gmap");

gmap.service("gmap-geocode-service", function ($q) {
    
    var googleGeocodeService = new google.maps.Geocoder();
    
    ///Asssinatura {name: "Lat, Lng"} ou { geomety: location: { lat:double, lng:double}}
    this.GetGeocodeData = function (autocompleteData) {
        var deferred = $q.defer();
        
        var latLng = null;

        if (autocompleteData.geometry) {
            latLng = new google.maps.LatLng(autocompleteData.geometry.location.lat() ,autocompleteData.geometry.location.lng());
        } else {
            try {
                var latlngRegExp = new RegExp(/([ ]*)?([-+]?[0-9]+([.]{0,1})?([0-9]+)?)([ ]*)?([,])([ ]*)?([-+]?[0-9]+([.]{0,1})?([0-9]+)?)([ ]*)?/g);
                if (latlngRegExp.test(autocompleteData.name))
                    latLng =  new google.maps.LatLng(parseFloat(autocompleteData.name.split(',')[0]), parseFloat(autocompleteData.name.split(',')[1]));
                else
                    throw 'Latitude longitude inválida.';
            }
            catch(err){
                deferred.reject({ success: false, error: err, message: "Não foi possivel a localidade informada." });
            }
        }

        if (latLng != null) {
            var requestGeo = { location: latLng };
            googleGeocodeService.geocode(requestGeo, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    var rObj = {
                        success: true,
                        result: {
                            geodata: results
                            , selectedLocation: latLng
                            , formatted_address: ""
                            , compare: function (location) {
                                return location.lat == this.selectedLocation.lat && location.lng == this.selectedLocation.lng
                            }
                        }
                    };

                    if (autocompleteData.formatted_address)
                        rObj.result.input_string = autocompleteData.formatted_address;
                    else if (autocompleteData.name)
                        rObj.result.input_string = autocompleteData.name;

                    for (var i = 0; i < results.length; i++) {
                        if (results[i].formatted_address.toUpperCase().indexOf("UNNAMED") < 0) {
                            rObj.result.formatted_address = results[i].formatted_address;
                            break;
                        }
                    }
                    
                    deferred.resolve(rObj);
                } else {
                    deferred.reject({ success: false, error: { GeoCodeStatus: status }, message: "Não foi possivelo localizar a localidade informada." });
                }
            });
        }else{
            deferred.reject({ success: false, error: autocompleteData, message: "Não foi possivel a localidade informada." });
        }
        
        return deferred.promise;
    }
});