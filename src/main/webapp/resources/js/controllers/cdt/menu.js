/* global define, console*/
define(['../../app'], function (app) {

    'use strict';
    app.controller('menuCtrl', [
        '$rootScope',
        'lovs',
        'CONFIG',
        '$api',
        function (
            $rootScope,
            lovs,
            CONFIG,
            $api
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            CONFIG.getHost().then(function (response) {

                CONFIG.hostName = response.data ? response.data.Mensaje : '';

                if (CONFIG.hostName != '') {

                    $api.consultaCdt.obtenerOficinaHost(

                        CONFIG.hostName

                    ).then(function (resp) {

                        if (resp.data != '') {

                            CONFIG.hostOficina = resp.data.oficina;

                        }

                    });

                }


            }, function () {

                CONFIG.hostName = '';
                CONFIG.hostOficina = undefined;

            });

            var nameSpace = $rootScope.account[$rootScope.routeApp['3']] = {};
            nameSpace.lovs = lovs;

            $rootScope.$data = {
                oficina: CONFIG.hostOficina || CONFIG.oficinaTotal,
                codAgenteVendedor: CONFIG.employee.davIdentificationNumber2,
                codAgenteVendedorCopy: CONFIG.employee.davIdentificationNumber2,
                codAgenteVendedorRecovery: CONFIG.employee.davIdentificationNumber2
            };


            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

        }
    ]);

});
