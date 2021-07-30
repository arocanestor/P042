define(['../../app'], function (app) {

    'use strict';
    app.controller('autorizaCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        '$slm-dialog',
        'CONFIG',
        '$filter',
        '$state',
        '$utilities',
        function ($scope, $rootScope, $api, $dialog, CONFIG, $filter, $state, $utilities) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            // RESERVED NAMESPACE
            // ////////////////////////////// CAPTIONS

            $scope.hoy = new Date();

            var nameSpace = $rootScope.account[$rootScope.routeApp['5']],
                CLIENTE = $rootScope.CLIENT.CLIENTE,
                CLIENTE_ALL = $rootScope.CLIENT,
                tiposIdentificacion = $filter('filter')($rootScope.lov.lov_tipo_id_venta_linea, {
                    codigo: 1
                })[0] || {};


            $scope.config = CONFIG;

            $scope.title = 'Tarjeta de Crédito Móvil';
            $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;


            $scope.textos = nameSpace.textos;
            $scope.lovs = nameSpace.lovs;

            $scope.caption = {
                listas: {
                    status: '',
                    content: ''
                },
                autoriza: $scope.lov_msg.autoriza.desc
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                regresar: function () {

                    $state.go('app.tarjeta-movil.xpress.evaluacion');

                }

            };



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
