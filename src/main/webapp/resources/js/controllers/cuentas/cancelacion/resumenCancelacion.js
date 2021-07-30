/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('resumenCancelacionCtrl', ['$scope', '$rootScope', '$api', 'CONFIG', '$slm-dialog', function ($scope, $rootScope, $api, CONFIG, $dialog) {

        /* ------------------------------------------------------------------------------------------
         | INIT
         -------------------------------------------------------------------------------------------- */
        $scope.$on('$viewContentLoaded', function (event) {

            $scope.content = 'Content from resumencancelacionCtrl';
            $scope.valorInicial = $rootScope.consultaCDTCDAT.valorInicial;

        });

        $scope.aperturaCdAT = {};
        $scope.cancelacion = $rootScope.cancelacion;
        $scope.consultaCDTCDAT = $rootScope.consultaCDTCDAT;

        /* ------------------------------------------------------------------------------------------
         | SETUP
         -------------------------------------------------------------------------------------------- */

        $scope.llamadocancelacion = 0;
        $scope.mensajecancelacion = "";

        // captions
        $scope.caption = {
            titleResumen: 'Confirme al Cliente los resultados de la cancelación',
            confirmHuella: 'Si la información es correcta, solicite la huella al cliente, de lo contrario haga click en Regresar'
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



    }]);

});
