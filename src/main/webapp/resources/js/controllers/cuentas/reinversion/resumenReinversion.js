/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('resumenReinversionCtrl', ['$scope', '$rootScope', '$api', 'CONFIG', '$slm-dialog', function ($scope, $rootScope, $api, CONFIG, $dialog) {

        /* ------------------------------------------------------------------------------------------
         | INIT
         -------------------------------------------------------------------------------------------- */
        $scope.$on('$viewContentLoaded', function (event) {

            $scope.content = 'Content from resumenConstitucionCtrl';
            $scope.constitucion = $rootScope.constitucion;
            $scope.simulacion = $rootScope.simulacion;
            $scope.proyeccion = $rootScope.proyeccion;

        });

        $scope.aperturaCdAT = {};

        /* ------------------------------------------------------------------------------------------
         | SETUP
         -------------------------------------------------------------------------------------------- */

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


    }]);

});
