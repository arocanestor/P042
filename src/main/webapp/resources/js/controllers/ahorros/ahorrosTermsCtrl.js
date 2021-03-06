define(['../../app'], function (app) {

    'use strict';
    app.controller('ahorrosTermsCtrl', [
        '$scope',
        '$rootScope',
        '$utilities',
        function ($scope, $rootScope, $utilities) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            // RESERVED NAMESPACE
            var nameSpace = $rootScope.account[$rootScope.routeApp['1']];

            $scope.textos = nameSpace.textos;
            nameSpace.lovs.lov_msg_venta_cuenta_obj = $utilities.arr2Obj(nameSpace.lovs.lov_msg_venta_cuenta, 'codigo');
            $scope.lovs = nameSpace.lovs;

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {};

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$program = {};

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$api = {};

            /* ------------------------------------------------------------------------------------------
 		     | INIT
 		     -------------------------------------------------------------------------------------------- */


        }
    ]);

});
