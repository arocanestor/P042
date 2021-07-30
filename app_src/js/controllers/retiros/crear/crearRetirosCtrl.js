/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('crearRetirosCtrl', [
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
            $scope.retiros = [];
            $scope.cuentas = [];
            $scope.campPeriocidad = false;
            $scope.downBox = false;
            $scope.campMotCancelacion = false;
            $scope.tipoNovedadSeleccionada = '';
            $scope.valorProgramado = '';
            $scope.fechaPago = '';
            $scope.nuevaPrtogaramacion = {
                tipoProgramSelec : ''
            }

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {

                programacionSeleccionada: function (value) {
                    $scope.nuevaPrtogaramacion.tipoProgramSelec = value.codigo;
                    
                    if (value.codigo == '03' || value.codigo == '02') {//Retiro de Rendimientos ó Retiro Periódico Fijo                        
                        $scope.campMotCancelacion = false;
                        $scope.campPeriocidad = true;
                    } else if (value.codigo == '05') {//Retiro Total con Cancelación
                        $scope.campPeriocidad = false;
                        $scope.campMotCancelacion = true;
                    } 
                     else {
                        $scope.campPeriocidad = false;
                        $scope.campMotCancelacion = false;                        

                        $scope.$api.asociacionAFondosCuentas().then(function (response) {
                            var data = response.data;
                            if (data)
                                $scope.cuentas = data.cuentas.cuentas;

                        });

                        $scope.downBox = true;
                    }                   
                },

                aceptar: function () {
                    if (value.tipoNovedadSeleccionada == '01' || value.tipoNovedadSeleccionada == '04') {//Retiro Parcial ó Retiro Total sin Cancelación

                        $scope.$api.programacionAportesRetiros(valorProgramado, fechaPago).then(function (response) {
                            var data = response.data;
                            if (data)
                                $scope.cuentas = data.cuentas.cuentas;

                        });

                    } else {

                        $scope.$api.programacionAportesRetiros(valorProgramado, fechaPago).then(function (response) {
                            var data = response.data;
                            if (data)
                                $scope.cuentas = data.cuentas.cuentas;

                        });

                    }
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
                            numTipoDeConsulta: 6,
                            valNaturalezaJuridica: CONFIG.persona == 'natural' ? 'N' : (CONFIG.naturalConNegocio ? 'A' : 'J'),
                            numCodigoDeBanco: 0,
                            numTipoDeProducto: 0,
                            numNumeroDeProducto: 0
                        }
                    );
                },

                programacionAportesRetiros: function (valorProgramado, fechaPago) {
                    return $api.novedadescuentas.programacionAportesRetiros(
                        {
                            rowId: CONFIG.rowId,
                            usuario: CONFIG.usuario,
                            oficinaTotal: CONFIG.oficina,
                            valTalon: 0,
                            valNumeroProducto: '',
                            codTipoProducto: '',//No define en el mapeo
                            valOficinaRecaudo: 0,//No define en el mapeo
                            valIdentificacion: CONFIG.idNumber,
                            codTipoIdentificacion: CONFIG.idType,
                            codTipoNovedad: 0,
                            valMedioPago: 0,
                            valValorProgramado: 776787878,
                            valPeriodicidadProgramacionRetiro: 0,
                            valIndicadorAfc: 0,
                            valCuentaFinancieraRetiros: '',//No define en el mapeo
                            fecFechaPagoDeRetiro: '',//No define en el mapeo
                            valCantidadPortafolios: 776787878,//No define en el mapeo
                            codTipoProgramacion: '',//No define en el mapeo
                            codEntidadRetiro: 0,
                            codTipoCuentaRetiro: '',//No define en el mapeo
                            valIndicadorCancelacion: 0,
                            codTransaccionRetiro: '',//No define en el mapeo
                            codSubtransaccionRetiro: '',//No define en el mapeo
                            valNumeroProductoDestino: '0',
                            codTipoProductoDestino: 0,
                            registros: [
                                {
                                    codMultifondo: 0,
                                    valProgramado: valorProgramado,
                                    fecProgramada: fechaPago
                                }
                            ]
                        }
                    );
                }
            };
            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */
        }
    ]);

});
