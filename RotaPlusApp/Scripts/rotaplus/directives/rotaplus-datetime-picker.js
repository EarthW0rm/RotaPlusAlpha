var gmap = angular.module("rotaplus");

gmap.directive("rotaplusDatetimePicker", function () {

    return {
        restrict: 'A'
        , link: function (scope, element, attrs) {
            var dtpConfig = {
                locale: 'pt-br'
            };

            if (attrs.dateTimePickerFormat && attrs.dateTimePickerFormat != "") {
                dtpConfig.format = attrs.dateTimePickerFormat;
            }

            $(element[0]).datetimepicker(dtpConfig)
                .on('dp.change', function (ev, date) {
                    scope.$apply(function () {

                        var selectedText = element.val();
                        var ngModelArray = attrs.ngModel.split('.');

                        var treeScopeFinder = scope;
                        for (var i = 0; i < ngModelArray.length - 1; i++) {
                            treeScopeFinder = treeScopeFinder[ngModelArray[i]];
                        }

                        treeScopeFinder[ngModelArray[ngModelArray.length - 1]] = {
                            value: selectedText,
                            date: new Date(ev.date),
                            toString: function () {
                                return this.value;
                            }
                        }

                    });
                });
        }
    };
});

