var gmap = angular.module("rotaplus");

gmap.directive("rotaplusTimePicker", function () {

    return {
        restrict: 'A'
        , link: function (scope, element, attrs) {

            var dtpConfig = {
                locale: 'pt-br'
                , keepInvalid: true
            };

            if (attrs.dateTimePickerFormat && attrs.dateTimePickerFormat != "") {
                dtpConfig.format = attrs.dateTimePickerFormat;
            }

            var ngModelArray = attrs.ngModel.split('.');
            var treeScopeFinder = scope;
            for (var i = 0; i < ngModelArray.length - 1; i++) {
                treeScopeFinder = treeScopeFinder[ngModelArray[i]];
            }

            var datetimepicker = $(element[0]).datetimepicker(dtpConfig).show();

            element.parent().on('click', function () {
                scope.$apply(function () {
                    $(this).find('input').datetimepicker('show');
                });
            });

            datetimepicker.on('dp.change', function (ev, date) {
                scope.$apply(function () {

                    var ngModelArray = attrs.ngModel.split('.');

                    var treeScopeFinder = scope;
                    for (var i = 0; i < ngModelArray.length - 1; i++) {
                        treeScopeFinder = treeScopeFinder[ngModelArray[i]];
                    }

                    var sItem = {
                        value: '',
                        element: element,
                        date: new Date(ev.date),
                        totalSeconds: function () {
                            return (this.date.getHours() * 60 * 60) + (this.date.getMinutes() * 60);
                        },
                        toString: function () {
                            var tH = this.date.getHours();
                            var tM = this.date.getMinutes();

                            var stime = "";
                            stime += tH > 0 ? tH + (tH > 1 ? ' horas ' : ' hora') : '';
                            stime += tM > 0 ? (tH > 0 ? 'e ' : '') + tM + (tM > 1 ? ' minutos' : 'minuto') : '';

                            if (stime == "")
                                stime = "sem parada";

                            return stime;
                        }
                    }
                    sItem.value = sItem.toString();
                    element.val(sItem.toString());
                    if (attrs.autoWidth && attrs.autoWidth.toLocaleLowerCase() == "true")
                        element.css('width', (sItem.value.length * 5) + 'px');

                    treeScopeFinder[ngModelArray[ngModelArray.length - 1]] = sItem;
                });
            });

            if (treeScopeFinder[ngModelArray[ngModelArray.length - 1]] == null) {
                element.val('sem parada');
            }

        }
    };
});