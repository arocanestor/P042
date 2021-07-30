/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('novedadesCDTCtrl', [
        '$scope',
        'servicioNumCDT',
        '$rootScope',
        '$api',
        'CONFIG',
        '$timeout',
        '$slm-dialog',
        '$filter',
        '$state',
        'textos',
        '$utilities',
        function (
            $scope,
            servicioNumCDT,
            $rootScope,
            $api,
            CONFIG,
            $timeout,
            $dialog,
            $filter,
            $state,
            textos,
            $utilities
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var CLIENTE = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT.CLIENTE : $rootScope.COMPANY.CLIENTE,
                // RESERVED NAMESPACE
                nameSpace = $rootScope.account[$rootScope.routeApp['3']];

            $scope.lovs = nameSpace.lovs;
            $scope.codOficina = CONFIG.hostOficina;
            nameSpace.textos = textos;

            $scope.title = 'Novedades';
            if (CONFIG.persona == 'natural' || CONFIG.naturalConNegocio) {

                $scope.icon = 'fa-user-circle';
                $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            } else {

                $scope.icon = 'fa-building';
                $scope.extract = CLIENTE.Name;

            }
            $scope.fechaSistema = $filter('date')(new Date(), 'dd/MM/yyyy');
            $scope.textos = nameSpace.textos;

            $scope.novedad = {};
            $scope.cdts = [];
            $scope.cdt = {};
            nameSpace.cdtSeleccionado = [];
            $scope.tipoSeleccion = {};
            $scope.cdtValidacion = [];
            $scope.valFusion = {};
            $scope.count = {};

            // captions
            $scope.caption = {
                intereses: 'Si el CDT tiene intereses pendientes, acompañe al cliente a Caja para realizar el pago.'
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {

                greaterThan: function (cdt) {

                    return cdt.valRendimientoXPagaNeto > 0;

                },

                almacenarNumCDT: function () {

                    servicioNumCDT.cdt = [];
                    servicioNumCDT.cdt = nameSpace.cdtSeleccionado;

                },

                guardarInfo: function () {

                    nameSpace.cdtSeleccionado = [];
                    angular.forEach($scope.cdts, function (val) {

                        if (val.check) {

                            nameSpace.cdtSeleccionado.push(val);

                        }

                    });

                },

                guardarInfoCheck: function (value) {

                    $scope.novedad.tipo = '';

                    if (value) {

                        $scope.cdtValidacion = [];

                        angular.forEach($scope.cdts, function (val) {

                            if (val.check) {

                                $scope.cdtValidacion.push(val);

                            }

                        });

                        if ($scope.cdtValidacion.length > 1) {

                            $scope.count += 1;
                            $scope.valFusion = '0';
                            $scope.count = 0;

                            angular.forEach($scope.cdtValidacion, function (cdtList) {

                                if (cdtList.validacionEstado != '1') {

                                    if (cdtList.validacion == '1' || cdtList.validacion == '2' || cdtList.validacion == '3' || cdtList.validacion == '4') {

                                        $scope.valFusion = '1';

                                    }

                                } else {

                                    $scope.count++;

                                }

                            });

                        } else {

                            $scope.tipoSeleccion = '1';

                        }

                    } else if ($scope.cdtValidacion.length >= 1) {

                        $scope.$gui.guardarInfoCheck(true);

                    }

                },

                llamarNovedad: function () {

                    $scope.$gui.guardarInfo();
                    $scope.$gui.almacenarNumCDT();

                    var tipo = $scope.novedad.tipo;

                    $scope.cdts = [];

                    switch (tipo) {
                        case "1":
                            $state.go('.endoso');
                            break;
                        case "2":
                            $state.go('.fraccionamiento');
                            break;
                        case "3":
                            $state.go('.fusion');
                            break;
                        case "4":
                            $state.go('.cambioFormaPago');
                            break;
                        case "5":
                            $state.go('.bloqueoDesbloqueo');
                            break;
                        case "6":
                            $state.go('.instruccionCancelacion');
                            break;
                        default:
                            break;
                    }

                },
                abrirNovedad: function () {}
            };


            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$program = {

                consultaCdtXEstado: function () {

                    $scope.$api.consultaCdtXEstado().then(function (response) {

                        if (response.data) {

                            if (response.data.registros) {

                                var fechaSistema = $filter('date')(new Date(), 'dd/MM/yyyy');

                                angular.forEach(response.data.registros, function (registro, i) {

                                    // si es ACT y fecVencimientoOperacion diferente de la actual no se muestra
                                    if (registro.valEstado == 'ACT') {

                                        // validaciones para definir el Subestado
                                        if (registro.valBloqueoLegal && registro.valBloqueoLegal == 'S') {

                                            registro.subEstado = 'EMBARGADO';
                                            registro.validacion = '4';

                                        } else if (registro.valBloqueoNovedades && registro.valBloqueoNovedades == 'S') {

                                            registro.subEstado = 'BLOQUEADO ' + (registro.valDescCausalBloqueo ? registro.valDescCausalBloqueo : '');
                                            registro.validacion = '3';

                                        } else if (registro.valDescAccionSiguiente && registro.valDescAccionSiguiente == 'POR CANCELAR') {

                                            registro.subEstado = 'INSTRUCCIÓN DE CANCELACIÓN';
                                            registro.validacion = '1';

                                        } else if (registro.valProductoEnGarantia && registro.valProductoEnGarantia == 'S') {

                                            registro.subEstado = 'EN GARANTÍA';
                                            registro.validacion = '1';

                                        } else if (registro.valTipoDeposito && registro.valTipoDeposito == 'CDAT') {

                                            registro.validacion = '1';

                                        } else if (registro.valRendimientoXPagarNeto && registro.valRendimientoXPagarNeto > '0') {

                                            registro.validacion = '2';

                                        }

                                        registro.validacionEstado = '0';

                                    } else {

                                        if (registro.valBloqueoLegal && registro.valBloqueoLegal == 'S') {

                                            registro.subEstado = 'EMBARGADO';
                                            registro.validacion = '4';

                                        }

                                        registro.validacionEstado = '1';

                                    }


                                    var tipoOperacion = $filter('lov')(registro.codTipoOperacion, $scope.lovs.lov_cdt_tipo_operacion, 'desc', 'codigo');
                                
                                    if (tipoOperacion == '0') {
                                        registro.mostrarCDT = false;
                                    } else if (tipoOperacion == '1') { 
                                        if (registro.valNumeroPreimpreso && registro.valNumeroPreimpreso != '0') {
                                            registro.mostrarCDT = true;
                                        } else {
                                            registro.mostrarCDT = false;
                                        }
                                    } else {
                                        registro.mostrarCDT = true;
                                    }

                                    $scope.cdts.push(registro);

                                });

                            } else {

                                $dialog.open({
                                    status: 'error',
                                    content: 'Sin Registros Para Aplicar Novedades.',
                                    accept: function () {

                                        $utilities.closeApp();

                                    }

                                });

                            }

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>200</b><br>Intente Nuevamente',
                                accept: function () {

                                    $utilities.closeApp();

                                }

                            });

                        }

                    }, function (response) {

                        if (response.status !== 417) {

                            $dialog.open({
                                status: 'error',
                                content: 'Ha ocurrido un error inesperado'
                            });

                        }

                    });

                }

            };


            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                consultaCdtXEstado: function () {

                    return $api.consultaCdt.consultaCdtXEstado({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficina,
                        codEstado: 'ACT,VEN',
                        codTipoDocumento: CONFIG.idType,
                        valNumeroDocumento: CONFIG.idNumber
                    });

                }

            };


            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            // hace el llamado al servicio que llena la tabla de cdts
            $scope.$on('$viewContentLoading', function () {

                if ($state.current.name == 'app.cdt.novedades') {

                    $scope.$program.consultaCdtXEstado();

                }

            });

        }
    ]);

});
