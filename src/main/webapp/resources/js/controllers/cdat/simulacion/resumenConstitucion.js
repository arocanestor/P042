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
        function ($scope, $rootScope, $api, CONFIG, $dialog, $spaUtils) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            var nameSpace = $rootScope.account[$rootScope.routeApp['2']];

            $scope.simulacion = nameSpace.simulacion;
            $scope.constitucion = nameSpace.constitucion;
            $scope.proyeccion = nameSpace.proyeccion;
            $scope.llamadoConstitucion = 0;
            $scope.mensajeConstitucion = "";

            // captions
            $scope.caption = {
                confirmHuella: 'Si la información es correcta, solicite la huella al cliente, de lo contrario haga click en Regresar.'
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
            $scope.content = 'Content from resumenConstitucionCtrl';
            $scope.constitucion = nameSpace.constitucion;
            $scope.simulacion = nameSpace.simulacion;
            $scope.proyeccion = nameSpace.proyeccion;

        }
    ]);

});
