/* global define, console*/
define(['../../app'], function (app) {

    'use strict';
    app.controller('novedadesCtrl', [
        '$scope',
        'servicioNumCDT',
        '$rootScope',
        'CONFIG',
        '$slm-dialog',
        '$filter',
        '$api',
        '$timeout',
        '$utilities',
        function (
            $scope,
            servicioNumCDT,
            $rootScope,
            CONFIG,
            $dialog,
            $filter,
            $api,
            $timeout,
            $utilities
        ) {


            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,
                nameSpace = $rootScope.account[$rootScope.routeApp['3']];

            $scope.numCDT = servicioNumCDT.cdt;
            $scope.valMontoActualOperacion = "0";
            $scope.buttonOffDesbloqueo = false;
            $scope.buttonOffBloqueo = false;
            $scope.cdtMovil = false;

            $scope.cuentas = [];

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
                        if(data){
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
                consultaListaNovedades: function () {
                    return $api.novedadescuentas.listaNovedades(
                        {
                            rowId: CONFIG.rowId,
                            usuario: CONFIG.usuario,
                            oficinaTotal: 0,
                            idSesion: '',
                            codIdioma: 'ES',
                            valOrigen: '',
                            codPais: 'CO',
                            numNumeroId: 0,
                            numTipoId: 3,
                            numTipoDeConsulta: 3,
                            valNaturalezaJuridica: $scope.tipoCliente,
                            numCodigoDeBanco: 0,
                            numTipoDeProducto: 0,
                            numNumeroDeProducto: 0
                        }
                    );
                },

                enviarNovedades: function (cuenta) {
                    return $api.novedadescuentas.modificacion(
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
            $scope.$api.consultaListaNovedades().then(function (response) {
                var data = response.data;
                if (data) {
                    $scope.cuentas = data.cuentas.cuentas;
                }
            });

        }
    ]);

});
