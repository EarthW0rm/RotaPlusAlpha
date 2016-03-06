var rotaplus = angular.module('rotaplus');
rotaplus.controller('rotaplus-map-controller', ['$scope', 'gmap-geocode-service', function ($scope, geoCode) {
    $scope.currentMap = null;
    $scope.addressAutoComplete = null;

    $scope.waypoints = [];

    $scope.test = function () {
        
        geoCode.GetGeocodeData($scope.addressAutoComplete).then(function (data) {
            
        });
    }

    $scope.$watch('addressAutoComplete', function (newValue, oldValue) {
        if ($scope.addressAutoComplete != null) {
            geoCode.GetGeocodeData($scope.addressAutoComplete).then(function (data) {
                $scope.waypoints.push(data.result);
            });
        }

    });



    //$scope.dragStart = function (e, ui) {
    //    ui.item.data('start', ui.item.index());
    //}

    //$scope.dragEnd = function (e, ui) {
    //    var start = ui.item.data('start'),
    //        end = ui.item.index();

    //    $scope.waypoints.splice(end, 0,
    //        $scope.waypoints.splice(start, 1)[0]);

    //    $scope.$apply();
    //}

    //var sortableEle = $('.waypoints').sortable({
    //    start: $scope.dragStart,
    //    update: $scope.dragEnd
    //});

}]);
