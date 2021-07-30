
define(['../../app'], function (app) {

    'use strict';
    app.controller('confirmacionCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        '$slm-dialog',
        'CONFIG',
        '$filter',
        '$state',
        '$utilities',
        'actualizaSiebel',
        '$spaUtils',
        function ($scope, $rootScope, $api, $dialog, CONFIG, $filter, $state, $utilities, $siebel, $spaUtils) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            $scope.hoy = new Date();

            var nameSpace = $rootScope.account[$rootScope.routeApp['5']],
                CLIENTE = $rootScope.CLIENT.CLIENTE,
                CLIENTE_ALL = $rootScope.CLIENT,
                tiposIdentificacion = $filter('filter')($rootScope.lov.lov_tipo_id_venta_linea, {
                    codigo: 1
                })[0] || {};

            $scope.estado = $rootScope.estado;
            $scope.tarjeta = $rootScope.tarjeta;
            $scope.ubicacion = $rootScope.ubicacion;
            $scope.textos = nameSpace.textos;
            $scope.lovs = nameSpace.lovs;

            $scope.caption = {
                originacion: 'La Tarjeta de crédito ha sido creada exitosamente!',
                originacionFallida: 'Creación de Tarjeta no exitosa. Por favor, inicie el proceso normal de venta.',
                info: '<ul gui="list"><li> ' + $scope.lov_msg['recuerde-entrega'].desc + '</li></ul>',
                confirmacion: $scope.lov_msg['paso-3-confirmacion'].desc
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

            $spaUtils.disableProduct(5);


        }
    ]);

});
