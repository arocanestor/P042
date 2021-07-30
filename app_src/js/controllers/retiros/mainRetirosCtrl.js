/* global define, console*/
define(['../../app'], function (app) {

    'use strict';
    app.controller('mainRetirosCtrl', [
        '$scope',
        'servicioNumCDT',
        '$rootScope',
        'CONFIG',
        '$slm-dialog',
        '$filter',
        '$api',
        '$timeout',
        '$utilities',
        'lovs',
        function (
            $scope,
            servicioNumCDT,
            $rootScope,
            CONFIG,
            $dialog,
            $filter,
            $api,
            $timeout,
            $utilities,
            lovs
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
             var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
             CLIENTE = PERSONA.CLIENTE,
             nameSpace = $rootScope.account[$rootScope.routeApp['3']];

             $scope.numProdDafaturo = CONFIG.numeroProducto;
             $scope.lovs = lovs;
             $scope.retiros = [];

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
             $scope.$gui = {

                nuevaProgramacion: function () {
                }

            };
            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
             $scope.$program = {

            };
            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */
             $scope.$api = {
                consultaProgramacionRetirosFondos: function () {
                    return $api.novedadescuentas.consultaProgramacionRetirosFondos(
                        {
                            rowId: CONFIG.rowId,
                            usuario: CONFIG.usuario,
                            oficinaTotal: CONFIG.oficina,
                            numeroProducto: CONFIG.numeroProducto,
                            numeroIdentificacion: CONFIG.idNumber,
                            tipoIdentificacion: CONFIG.idType
                        }
                    );
                }
            };
            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */
             $scope.$api.consultaProgramacionRetirosFondos().then(function (response) {
                var data = response.data;
                if (data) {
                    $scope.retiros = data.retiroFondos;

                    angular.forEach($scope.lovs.lov_fondos_tipo_novedad_programacion, function (tipoNovedad) {

                        angular.forEach($scope.retiros, function (retiro) {

                            if (retiro.tipoNovedad == tipoNovedad.codigo){
                                cuenta.tipoNovedad = tipoNovedad.desc;
                            }

                        });

                    });
                }
            });
        }
    ]);

});
