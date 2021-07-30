define(['../../app'], function (app) {

    'use strict';
    app.controller('tarMovilCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        '$slm-dialog',
        'CONFIG',
        '$filter',
        '$state',
        '$utilities',
        'lovs',
        'textos',
        function ($scope, $rootScope, $api, $dialog, CONFIG, $filter, $state, $utilities, lovs, textos) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            // RESERVED NAMESPACE

            $scope.hoy = new Date();

            var nameSpace = $rootScope.account[$rootScope.routeApp['5']] = {},
                CLIENTE = $rootScope.CLIENT.CLIENTE,
                CLIENTE_ALL = $rootScope.CLIENT,
                tiposIdentificacion = $filter('filter')($rootScope.lov.lov_tipo_id_venta_linea, {
                    codigo: 1
                })[0] || {};

            $scope.config = CONFIG;

            $scope.title = 'Tarjeta de Crédito Móvil';
            $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            nameSpace.textos = textos;
            nameSpace.title = $rootScope.lov.lov_productos_venta_en_linea_obj['5'].desc;
            $scope.textos = nameSpace.textos;
            nameSpace.lovs = lovs; // guardamos listas en nameSpace
            nameSpace.lovs.lov_msg_venta_xpress_obj = $utilities.arr2Obj(lovs.lov_msg_venta_xpress, 'codigo');
            $scope.lov_msg = nameSpace.lovs.lov_msg_venta_xpress_obj;
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
