/* global define */
define(['angularAMD'], function ($ngAMD) {

    'use strict';

    $ngAMD.filter('accountCounter', ['CONFIG', function (CONFIG) {

        return function (value, range) {

            // today context
            var toDay = new Date(),
                thisYear = toDay.getFullYear().toString(),
                thisMonth = (('00' + (Number(toDay.getMonth()) + 1)).slice(-2).toString()).toString(),
                daysInMonth = new Array(new Date(thisYear, thisMonth + 1, 0).getDate()),
                // User context
                obj = localStorage.getItem(CONFIG.usuario) ? angular.fromJson(localStorage.getItem(CONFIG.usuario)) : {},
                accounts = obj.accounts || {},
                account = accounts[value] || {},
                counter;

            range = range || 'toDay';

            switch (range) {

                case 'toDay':

                    counter = account[thisYear + thisMonth + toDay.getDate()];

                    break;

                case 'month':

                    counter = (function () {

                        var count = 0;
                        angular.forEach(daysInMonth, function (obj, i) {

                            count += Number((account[thisYear + thisMonth + ('0' + i).slice(-2)]) || 0);

                        });

                        return count;

                    }());

                    break;
                default:
                    break;

            }

            return counter || 0;

        };


    }]);

});
