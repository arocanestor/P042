/* global define, console*/
define(['../../app'], function (app) {

    'use strict';
    app.controller('mainAsociadasCtrl', [
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
            $scope.numCuentaSeleccionada={
                valTipoId:" "
            };
            

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

                daviSolModCuen: function () {                    
                  
                        $scope.$api.daviSolModCuen().then(function(response){

                        },function (response) {

                        if (response.status == 417) {                            
                            $dialog.open({
                                status: 'error',
                                content: response.headers('Respuesta')                                
                            });

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Ha ocurrido un error inesperado'
                                
                            });

                        }
                    });
                           
                                    
                },
                formatear: function (data){
                    //$filter('lov')(data,lovs.LOV_FONDOS_TIPO_CUENTA)
                   
                    $scope.numCuentaSeleccionada.valTipoId = 'Cuenta Corriente'
                },
               
                consultarAsociacionAFondosCuentas:function(){
                    $scope.$api.asociacionAFondosCuentas().then(function(res) {
                       
                    })
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
                            numTipoDeConsulta: '03',
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
                },

                daviSolModCuen: function(){
                   
                    return $api.novedades.daviSolModCuen(
                        {
                            rowId: "1-37545452356",
                            usuario: "HCUSBA",
                            oficinaTotal: "8001",
                            codIndTransaccion: "02",
                            valNumeroProducto: "0600099800023133",
                            cuentaAsociada: {
                              codIndCambioTipoCuenta: 1,
                              codTipoCuenta: 3,
                              codIndCambioNumeroCuenta: 1,
                              valNumCuenta: "0560098369999408"
                            },
                            cuentaRetiros: {
                              codIndCambioTipoCuenta: 0,
                              codTipoCuenta: 0,
                              codIndCambioNumeroCuenta: 0,
                              valNumeroCuenta: 0,
                              valEntidadAch: 0
                            }
                        }
                    )
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
