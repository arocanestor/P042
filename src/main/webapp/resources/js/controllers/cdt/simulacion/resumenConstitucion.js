 /* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('resumenConstitucionCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        'CONFIG',
        '$slm-dialog',
        '$spaUtils',
        function (
            $scope,
            $rootScope,
            $api,
            CONFIG,
            $dialog,
            $spaUtils
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            var nameSpace = $rootScope.account[$rootScope.routeApp['3']],
                tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';

            $scope.apertura = nameSpace.apertura;
            $scope.simulacion = nameSpace.simulacion;
            $scope.proyeccion = nameSpace.proyeccion;

            // captions
            $scope.caption = {
                confirmHuella: 'Si la información es correcta, solicite la huella a el(los) titular(es), de lo contrario haga click en Regresar'
            };

            $scope.habilitaVista = "";
            $scope.tituloVer = 'Ver más';
            $scope.tituloIcono = 'fa fa-plus';

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                cambiarValor: function (data) {

                    if ($scope.habilitaVista == true) {

                        $scope.habilitaVista = false;
                        $scope.tituloVer = 'Ver más';
                        $scope.tituloIcono = 'fa fa-plus';

                    } else {

                        $scope.habilitaVista = true;
                        $scope.tituloVer = 'Ver menos';
                        $scope.tituloIcono = 'fa fa-minus';

                    }

                }

            };

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
