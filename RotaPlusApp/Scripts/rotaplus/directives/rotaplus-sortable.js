var gmap = angular.module("rotaplus");

gmap.directive('rotaplusSortable', ['$compile', '$rootScope', function ($compile, $rootScope) {
    return {
        restrict: 'A'
        , scope: {
            arrayItens: '@rpArraySorted'
        }
        , link: function preLink(scope, element, attrs) {

            var sortableEle = $(element).sortable({
                start: scope.dragStart,
                update: scope.dragEnd
            });
        }
        , controller: ['$scope', function ($scope) {
            $scope.dragStart = function (e, ui) {
                ui.item.data('start', ui.item.index());
            }

            $scope.dragEnd = function (e, ui) {
                var start = ui.item.data('start'),
                    end = ui.item.index();

                $scope.$parent[$scope.arrayItens]
                $scope.$parent[$scope.arrayItens].splice(end, 0,
                    $scope.$parent[$scope.arrayItens].splice(start, 1)[0]);

                $scope.$apply();
            }
        }]
    };
    
}]);