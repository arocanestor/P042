define(['angularAMD'], function (angularAMD) {

    'use strict';

    angularAMD.service('$spaUtils', [
        '$http',
        '$q',
        'CONFIG',
        '$state',
        '$filter',
        '$rootScope',
        function ($http, $q, CONFIG, $state, $filter, $rootScope) {

            var utils = {};

            utils.setCounter = function (accountType) {

                var toDay = new Date(),
                    thisYear = toDay.getFullYear().toString(),
                    thisMonth = (('00' + (Number(toDay.getMonth()) + 1)).slice(-2)).toString(),
                    toDayStr = thisYear + thisMonth + toDay.getDate(),
                    daysInMonth = new Array(new Date(thisYear, thisMonth + 1, 0).getDate()),
                    obj = localStorage.getItem(CONFIG.usuario) ? angular.fromJson(localStorage.getItem(CONFIG.usuario)) : {};

                obj.accounts = obj.accounts || {};
                obj.accounts[accountType] = obj.accounts[accountType] || {};
                obj.accounts[accountType][toDayStr] = Number(obj.accounts[accountType][toDayStr] || 0) + 1;

                localStorage.setItem(CONFIG.usuario, angular.toJson(obj));

            };

            utils.disableProduct = function (code) {

                // deshabilitamos la navegacion dentro del producto
                $state.$current.path[1].data.redirect = 'app';
                $filter('filter')($rootScope.lov.lov_productos_novedades_fondos_inversion, {
                    codigo: code
                })[0].disabled = true;

            };

            utils.disableInitProduct = function (code) {

                $filter('filter')($rootScope.lov.lov_productos_novedades_fondos_inversion, {
                    codigo: code
                })[0].disabled = true;

            };

            utils.disableInitProductbiometric = function (code) {

                $filter('filter')($rootScope.lov.lov_productos_novedades_fondos_inversion, {
                    codigo: code
                })[0].disabled = true;

                $filter('filter')($rootScope.lov.lov_productos_novedades_fondos_inversion, {
                    codigo: code
                })[0].disabledBiometric = true;

            };

            utils.compareBiometric = function (ID, autenticado) {

                var compare = $filter('filter')($rootScope.lov.lov_compare_biometric_venta_en_linea, {
                    codigo: ID.toString()
                }, true)[0].desc;

                return compare === '1';

            };

            return utils;

        }
    ]);

});
