/* global define, console*/
define(['../../app'], function (app) {

    'use strict';
    app.controller('mainNovCuentaRetiro', [
        '$scope',
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

            $scope.cuentas = [];
            $scope.tipoCuenta = '';

            // N si es natural o J si es juridica para hacer validaciones en el hotmail
            $scope.tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';

            if (CONFIG.persona == 'natural' || CONFIG.naturalConNegocio) {

                $scope.icon = 'fa-user-circle';
                $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            } else {

                $scope.icon = 'fa-building';
                $scope.extract = CLIENTE.Name;

            }



            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {

                aceptar: function (cuenta) {
                    $scope.$api.enviarNovedades(cuenta).then(function (response) {
                        var data = response.data;
                        if (data) {
                            $dialog.open({
                                status: 'success',
                                content: data.msgRespuesta
                            });
                        }

                    });
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
                asociacionAFondosCuentas: function () {
                    return $api.novedadescuentas.consultarAsociacionAFondosCuentas(
                        {
                            rowId: CONFIG.rowId,
                            usuario: CONFIG.usuario,
                            oficinaTotal: CONFIG.oficina,
                            codIdioma: 'ES',
                            codPais: 'CO',
                            numNumeroId: CONFIG.idNumber,
                            numTipoId: CONFIG.idType,
                            numTipoDeConsulta: 3,
                            valNaturalezaJuridica: CONFIG.persona == 'natural' ? 'N' : (CONFIG.naturalConNegocio ? 'A' : 'J'),
                            numCodigoDeBanco: 0,
                            numTipoDeProducto: 0,
                            numNumeroDeProducto: 0
                        }
                    );
                },

                modificacionDeCuentas: function (cuenta) {
                    return $api.novedadescuentas.daviplusYSolidezModificacionDeCuentas(
                        {
                            rowId: CONFIG.rowId,
                            usuario: CONFIG.usuario,
                            oficinaTotal: 0,
                            codIndTransaccion: 1,
                            valNumeroProducto: cuenta,
                            cuentaAsociada: null,
                            cuentaRetiros: null,
                            seguridad: null
                        }
                    );
                }

            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */
            $scope.$api.asociacionAFondosCuentas().then(function (response) {
                var data = response.data;
                if (data) {
                    $scope.cuentas = data.cuentas.cuentas;

                    angular.forEach($scope.lovs.lov_novedades_fondos_inversion_tipo_asociacion_cuentas, function (tipoCuenta) {

                        angular.forEach($scope.cuentas, function (cuenta) {

                            if (cuenta.numTipoDeProducto == tipoCuenta.codigo){
                                cuenta.numTipoDeProducto = tipoCuenta.desc;
                            }

                        });

                    });
                }
            });

        }
    ]);

});
