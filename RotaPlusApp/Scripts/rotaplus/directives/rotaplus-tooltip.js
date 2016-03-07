var gmap = angular.module("rotaplus");

gmap.directive('rotaplusTooltip', ['$compile', '$rootScope', function ($compile, $rootScope) {
    return {
        restrict: 'A'
        , link: function preLink(scope, element, attrs) {
            $(element).tooltip({ placement: attrs.rptooltipplace ? attrs.rptooltipplace : "bottom"  });


            $(element).on('shown.bs.tooltip', function () {
                setTimeout(function () { $(element).tooltip('hide');}, 1000);
            });
        }
    };

}]);