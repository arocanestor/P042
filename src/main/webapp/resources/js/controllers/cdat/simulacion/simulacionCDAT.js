 /* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('simulacionCDATCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        'CONFIG',
        '$timeout',
        '$slm-dialog',
        '$filter',
        '$state',
        'lovs',
        '$utilities',
        function ($scope, $rootScope, $api, CONFIG, $timeout, $dialog, $filter, $state, lovs, $utilities) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var CLIENTE = $rootScope.CLIENT.CLIENTE,
                nameSpace = $rootScope.account[$rootScope.routeApp['2']] = {};

            $scope.title = 'Apertura ' + $rootScope.lov.lov_productos_venta_en_linea_obj['2'].desc;
            $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;
            $scope.simulacion = {};
            nameSpace.simulacion = {};
            nameSpace.proyeccion = {};
            $scope.inputChangedPromise = '';

            $scope.intereses = [{
                value: 'Si',
                label: 'Si'
            }, {
                value: 'No',
                label: 'No'
            }];

            $scope.lovs = lovs;
            // $scope.formValid = false;

            $scope.tiposCDAT = [];

            $scope.tiposPlazo = [{
                codigo: 'dias',
                desc: 'Días'
            }, {
                codigo: 'calendario',
                desc: 'Fecha Específica'
            }];

            $scope.periodo = {};
            $scope.rendimientos = [];

            $scope.proyeccionCDT = {};
            $scope.proyeccion1 = {};
            $scope.proyeccion2 = {};
            $scope.tipoProyeccion = {
                seleccion: ''
            };
            $scope.form = {};

            $scope.caption = {
                resultSimulacion: '<ul gui="list"><li> Si el cliente acepta la oferta, continúe. </li><li> Si el cliente desea hacer otra simulación, haga click en Volver a Simular.</li></ul>',
                listas: {
                    status: '',
                    content: ''
                }
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                model: {
                    resultado: false,
                    toDay: new Date()
                },

                vaciarFormulario: function () {

                    $scope.simulacion = {};
                    $scope.consultaTipoDepositoSolicitud();

                }

            };

            $scope.guardarPeriocidad = function () {

                nameSpace.simulacion.interes = $scope.simulacion.interes;

                if ($scope.simulacion.interes == 'Si') {

                    nameSpace.simulacion.frecuenciaDesc = 'AL VENCIMIENTO';
                    nameSpace.simulacion.frecuenciaCod = 'NNN';

                } else if ($scope.simulacion.frecuencia) {

                    nameSpace.simulacion.frecuenciaDesc = $scope.simulacion.frecuencia.valDescripcionPeriodo;
                    nameSpace.simulacion.frecuenciaCod = $scope.simulacion.frecuencia.codPeriodo;

                }

            };

            $scope.cambioValorSimulacion = function () {


                if ($scope.inputChangedPromise) {

                    $timeout.cancel($scope.inputChangedPromise);

                }
                $scope.inputChangedPromise = $timeout(function () {

                    if ($scope.form.valoresCDAT.$valid) {

                        nameSpace.simulacion.tipoPlazo = $scope.simulacion.tipoPlazo;
                        nameSpace.simulacion.valorInversion = $scope.simulacion.valorInversion;
                        nameSpace.simulacion.tipoCDAT = $scope.simulacion.tipoCDAT.codigo;
                        nameSpace.simulacion.codMoneda = $scope.simulacion.tipoCDAT.codMoneda;
                        nameSpace.simulacion.codSubproductoRPR = $scope.simulacion.tipoCDAT.codSubproductoRPR;

                        $scope.$api.consultaPeriodoSolicitud().then(function (resp) {

                            $scope.rendimientos = [];

                            angular.forEach(resp.data.periodos[0].periodos, function (periodo, i) {

                                if (periodo.valDescripcionPeriodo != 'ANUAL') {

                                    $scope.rendimientos.push({
                                        codPeriodo: periodo.codPeriodo,
                                        valDescripcionPeriodo: periodo.valDescripcionPeriodo
                                    });

                                }

                            });

                            $scope.periodo = resp.data.periodo;

                            $scope.simulacion.vencimiento = $scope.periodo.fecFechaVencimientoHomologado;
                            nameSpace.simulacion.plazo = $scope.simulacion.tipoPlazo != 'calendario' ? ($scope.simulacion.tipoPlazo == 'dias' ? $scope.simulacion.plazo : $scope.simulacion.plazo * 30) : $scope.periodo.valPlazoDias; // eslint-disable-line no-nested-ternary

                        }, function (resp) {

                            $dialog.open({
                                status: 'error',
                                title: 'CONSULTA PERIODO SOLICITUD',
                                content: resp.data || 'A ocurrido un error inesperado'
                            });

                        });

                    }

                }, 1000);


            };

            $scope.simular = function () {

                $scope.$api.simulacionCdat().then(function (resp) {

                    nameSpace.simulacion.frecuencia = $scope.simulacion.frecuencia;

                    $scope.tipoProyeccion.seleccion = 'cdt';

                    angular.forEach(resp.data.proyecciones, function (proyeccion, i) {

                        if (proyeccion.idTipoProyeccion == 'cdt') {

                            $scope.proyeccionCDT = proyeccion;

                        } else if (proyeccion.idTipoProyeccion == 'proyeccion1') {

                            $scope.proyeccion1 = proyeccion;

                        } else {

                            $scope.proyeccion2 = proyeccion;

                        }

                    });

                    // $scope.proyeccionSeleccionada = 'cdt';

                }, function (resp) {

                    $dialog.open({
                        status: 'error',
                        title: 'SIMULACIÓN',
                        content: resp.data || 'A ocurrido un error inesperado'
                    });

                });

            };


            $scope.guardarCDT = function () {

                if ($scope.tipoProyeccion.seleccion == 'cdt') {

                    nameSpace.proyeccion = $scope.proyeccionCDT;

                } else if ($scope.tipoProyeccion.seleccion == 'proyeccion1') {

                    nameSpace.proyeccion = $scope.proyeccion1;

                } else {

                    nameSpace.proyeccion = $scope.proyeccion2;

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.consultaTipoDepositoSolicitud = function () {

                $scope.$api.consultaTipoDepositoSolicitud().then(function (resp) {

                    var depositos = resp.data.depositos,
                        arrTipoDeposito = [];

                    angular.forEach(depositos, function (deposito, i) {

                        arrTipoDeposito.push({
                            codigo: deposito.codTipoDeposito,
                            desc: deposito.valDescripcionTipoDeposito,
                            montoMin: Number(deposito.rangoMontos[0].valMontoMin) - 1,
                            montoMax: Number(deposito.rangoMontos[0].valMontoMax) + 1,
                            plazoMin: Number(deposito.rangoMontos[0].valPlazoMin) - 1,
                            plazoMax: Number(deposito.rangoMontos[0].valPlazoMax) + 1,
                            fechaPlazoMin: formatoFechaMinMax(deposito.rangoMontos[0].fecFechaPlazoMinHomologado),
                            fechaPlazoMax: formatoFechaMinMax(deposito.rangoMontos[0].fecFechaPlazoMaxHomologado),
                            codMoneda: deposito.codMoneda,
                            codSubproductoRPR: deposito.codSubproductoRPR
                        });

                    });

                    $scope.tiposCDAT = arrTipoDeposito;
                    $scope.simulacion.tipoCDAT = arrTipoDeposito[0];

                }, function (resp) {

                    $dialog.open({
                        status: 'error',
                        title: 'SIMULACION',
                        content: resp.data || 'A ocurrido un error inesperado'
                    });

                    $utilities.closeApp();

                });

            };

            function formatoFecha (date) {

                var value = date.toString().replace(/[//]/g, '');

                return value.replace(/(\d{2})(\d{2})(\d+)/, '$3-$2-$1T00:00:00');

            }

            function formatoFechaMinMax (date) {

                var value = date.toString().replace(/[//]/g, '');

                return value.replace(/(\d{4})(\d{2})(\d+)/, '$3/$2/$1');

            }

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                consultaTipoDepositoSolicitud: function () {

                    return $api.Cdat.consultaTipoDepositoSolicitud({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        contextoRequerimiento: {
                            idTransaccional: CONFIG.rowId
                            // valDireccionIpConsumidor: "90.4.3.5"
                        },
                        consultarTipoDeposito: {
                            codOficina: 6322,
                            codMoneda: ''
                        }
                    });

                },

                consultaPeriodoSolicitud: function () {

                    var actualDate = new Date();

                    return $api.Cdat.consultaPeriodoSolicitud({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        contextoRequerimiento: {
                            idTransaccional: CONFIG.rowId
                            // valDireccionIpConsumidor: "90.4.3.5"
                        },
                        consultaPeriodo: {
                            codTipoDeposito: $scope.simulacion.tipoCDAT.codigo,
                            fecFechaConsulta: $filter('date')(actualDate, 'yyyy-MM-dd') + 'T00:00:00',
                            valPlazoDias: $scope.simulacion.tipoPlazo != 'calendario' ? ($scope.simulacion.tipoPlazo == 'dias' ? Number($scope.simulacion.plazo) : Number($scope.simulacion.plazo) * 30) : null, // eslint-disable-line no-nested-ternary
                            fecFechaVencimiento: $scope.simulacion.tipoPlazo == 'calendario' ? formatoFecha($scope.simulacion.dateFrom) : null
                        }
                    });

                },

                simulacionCdat: function () {

                    var actualDate = new Date();

                    return $api.Cdat.simulacionCdat({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        contextoRequerimiento: {
                            idTransaccional: 'SimulacionCDaT'
                            // valDireccionIpConsumidor: "90.4.3.5"
                        },
                        informacionCliente: {
                            codTipoIdentificacion: CONFIG.idType,
                            valNumeroIdentificacion: CONFIG.idNumber
                        },
                        informacionSimulacionCDT: {
                            codTipoDeposito: $scope.simulacion.tipoCDAT.codigo,
                            codCategoria: "NOM",
                            codMoneda: "0",
                            valPlazoDias: $scope.simulacion.tipoPlazo != 'calendario' ? ($scope.simulacion.tipoPlazo == 'dias' ? Number($scope.simulacion.plazo) : Number($scope.simulacion.plazo) * 30) : $scope.periodo.valPlazoDias == '29' ? Number($scope.periodo.valPlazoDias) + 1 : $scope.periodo.valPlazoDias, // eslint-disable-line no-nested-ternary
                            valMontoInversion: $scope.simulacion.valorInversion,
                            codPeriodoPago: nameSpace.simulacion.frecuenciaCod, // si el cliente no quiere capitalizar intereses se envia por defecto el periodo Al vencimiento(NNN)
                            fecFechaInversion: $filter('date')(actualDate, 'yyyy-MM-dd') + 'T00:00:00',
                            fecFechaVencimiento: $filter('date')($filter('davDates')($scope.simulacion.vencimiento, 'yyyyMMdd'), 'yyyy-MM-ddT00:00:00'),
                            codMomento: 'N',
                            codNumBanco: ''
                        }
                    });

                },

                // CHECK LISTAS RESTRICTIVAS
                checkListas: function () {

                    return $api.cautela.listas({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        perfil: CONFIG.perfil,
                        tipoIdentificacionTitular: CONFIG.idType,
                        nroIdentificacionTitular: CONFIG.idNumber,
                        oficinaTotal: CONFIG.oficina
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.$api.checkListas().then(function (response) {

                var data = response.data,
                    coincidencias = $filter('filter')($scope.lovs.lov_listas_cuenta_digital, {
                        codigo: data.registros[0].codigoMarcacion
                    });

                if (coincidencias.length) {

                    $scope.caption.listas.status = 'success';
                    $scope.caption.listas.content = coincidencias[0].desc;

                } else {

                    $scope.caption.listas.status = 'error';
                    $scope.caption.listas.content = data.registros[0].codigoMarcacionMensajeHomologado || data.registros[0].codigoListaHomolgado;

                }

            }, function (response) {

                if (response.status === 417) {

                    $scope.caption.listas.status = 'success';
                    $scope.caption.listas.content = response.headers('Respuesta');

                } else {

                    $dialog.open({
                        status: 'error',
                        title: 'CONSULTA LISTAS RESTRICTIVAS',
                        content: 'Error código: <b>' + response.status + '</b><br>Intente Nuevamente',
                        accept: function () {

                            $state.go('^'); // volvemos al dashboard

                        }
                    });

                }

            });

            $scope.consultaTipoDepositoSolicitud();

        }
    ]);

});
