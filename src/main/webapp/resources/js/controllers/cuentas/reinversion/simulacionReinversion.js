/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('simulacionCDATCtrl', ['$scope', '$rootScope', '$api', 'CONFIG', '$timeout', '$slm-dialog', '$filter', '$state', 'lovs', '$utilities', function ($scope, $rootScope, $api, CONFIG, $timeout, $dialog, $filter, $state, lovs, $utilities) {

        /* ------------------------------------------------------------------------------------------
         | SETUP
         -------------------------------------------------------------------------------------------- */
        var CLIENTE = $rootScope.CLIENT.CLIENTE;

        $scope.title = 'Reinversión CDAT Virtual';
        $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

        $scope.consultaCDTCDAT = $rootScope.consultaCDTCDAT;
        $rootScope.simulacion = {};

        $scope.simulacion = {
            valorActual: $scope.consultaCDTCDAT.valorNetoPagar
        };

        // quitar el currency del valor actual
        var segment = $scope.simulacion.valorActual.split('.')[0],
            valorActualSinPesos = segment.replace('$', ''),
            valorActualHomologado = valorActualSinPesos.replace(/,/g, '');

        $rootScope.proyeccion = {};

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
            resultSimulacion: '<ul gui="list"><li> Si el cliente acepta la oferta, continúe. </li><li> Si el cliente desea hacer otra simulación haga click en Volver a Simular.</li></ul>'
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
                $scope.consultaTipoDepositoProductoSolicitud();
                $scope.simulacion.valorActual = $scope.consultaCDTCDAT.valorInicial;

            }

        };

        $scope.guardarPeriocidad = function () {

            $rootScope.simulacion.interes = $scope.simulacion.interes;

            if ($scope.simulacion.interes == 'Si') {

                $rootScope.simulacion.frecuenciaDesc = 'AL VENCIMIENTO';
                $rootScope.simulacion.frecuenciaCod = 'NNN';

            } else if ($scope.simulacion.frecuencia) {

                $rootScope.simulacion.frecuenciaDesc = $scope.simulacion.frecuencia.valDescripcionPeriodo;
                $rootScope.simulacion.frecuenciaCod = $scope.simulacion.frecuencia.codPeriodo;

            }

        };

        $scope.cambioValorSimulacion = function () {

            if ($scope.inputChangedPromise) {

                $timeout.cancel($scope.inputChangedPromise);

            }
            $scope.inputChangedPromise = $timeout(function () {

                if ($scope.form.valoresCDAT.$valid) {

                    $rootScope.simulacion.tipoPlazo = $scope.simulacion.tipoPlazo;
                    $rootScope.simulacion.valorReinvertir = $scope.simulacion.valorReinvertir;
                    $rootScope.simulacion.valorActualHomologado = valorActualHomologado;
                    $rootScope.simulacion.tipoCDAT = $scope.simulacion.tipoCDAT.codigo;
                    $rootScope.simulacion.codMoneda = $scope.simulacion.tipoCDAT.codMoneda;
                    $rootScope.simulacion.codSubproductoRPR = $scope.simulacion.tipoCDAT.codSubproductoRPR;

                    $scope.$api.consultaPeriodoSolicitud().then(function (resp) {

                        $scope.rendimientos = resp.data.periodos[0].periodos;
                        $scope.periodo = resp.data.periodo;

                        $scope.simulacion.vencimiento = $scope.periodo.fecFechaVencimientoHomologado;
                        $rootScope.simulacion.plazo = (function () {

                            var plazo = '';

                            if ($scope.simulacion.tipoPlazo != 'calendario') {

                                plazo = $scope.simulacion.tipoPlazo == 'dias' ? $scope.simulacion.plazo : $scope.simulacion.plazo * 30;

                            } else {

                                plazo = $scope.periodo.valPlazoDias;

                            }

                            return plazo;

                        }());

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

                $rootScope.simulacion.frecuencia = $scope.simulacion.frecuencia;

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

                $rootScope.proyeccion = $scope.proyeccionCDT;

            } else if ($scope.tipoProyeccion.seleccion == 'proyeccion1') {

                $rootScope.proyeccion = $scope.proyeccion1;

            } else {

                $rootScope.proyeccion = $scope.proyeccion2;

            }

        };

        /* ------------------------------------------------------------------------------------------
         | PROGRAM FUNCTIONS
         -------------------------------------------------------------------------------------------- */

        $scope.consultaTipoDepositoProductoSolicitud = function () {

            $scope.$api.consultaTipoDepositoProductoSolicitud().then(function (resp) {

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
                        fechaPlazoMin: $filter('date')($filter('davDates')(deposito.rangoMontos[0].fecFechaPlazoMinHomologado, 'yyyyMMdd'), 'dd/MM/yyyy'),
                        fechaPlazoMax: $filter('date')($filter('davDates')(deposito.rangoMontos[0].fecFechaPlazoMaxHomologado, 'yyyyMMdd'), 'dd/MM/yyyy'),
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

        /* ------------------------------------------------------------------------------------------
         | API FUNCTIONS
         -------------------------------------------------------------------------------------------- */

        $scope.$api = {

            consultaTipoDepositoProductoSolicitud: function () {

                return $api.Cdat.consultaTipoDepositoProductoSolicitud({
                    rowId: CONFIG.rowId,
                    oficinaTotal: CONFIG.oficinaTotal,
                    usuario: CONFIG.usuario,
                    contextoRequerimiento: {
                        idTransaccional: 'ConsultaTipoDepositoProductoSolicitud'
                        // valDireccionIpConsumidor: "90.4.3.5"
                    },
                    consultarTipoDeposito: {
                        codTipoDeposito: $scope.consultaCDTCDAT.serie + '00',
                        // si vienen solo 5 numeros al final se dwebe añadir un 0
                        valNumeroCDT: $scope.consultaCDTCDAT.numeroCompletoCDAT,
                        codMoneda: "1"
                    }
                });

            },

            consultaPeriodoSolicitud: function () {

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
                        fecFechaConsulta: $filter('date')($filter('davDates')($scope.consultaCDTCDAT.fechaProximoVencimiento, 'yyyyMMdd'), 'yyyy-MM-ddT00:00:00'),
                        valPlazoDias: $scope.simulacion.tipoPlazo != 'calendario' ? ($scope.simulacion.tipoPlazo == 'dias' ? Number($scope.simulacion.plazo) : Number($scope.simulacion.plazo) * 30) : null,
                        fecFechaVencimiento: $scope.simulacion.tipoPlazo == 'calendario' ? $filter('date')($filter('davDates')($scope.simulacion.dateFrom, 'ddMMyyyy'), 'yyyy-MM-ddT05:00:00') : null
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
                        codMoneda: $scope.simulacion.tipoCDAT.codMoneda,
                        valPlazoDias: $scope.simulacion.tipoPlazo != 'calendario' ? ($scope.simulacion.tipoPlazo == 'dias' ? Number($scope.simulacion.plazo) : Number($scope.simulacion.plazo) * 30) : $scope.periodo.valPlazoDias == '29' ? Number($scope.periodo.valPlazoDias) + 1 : $scope.periodo.valPlazoDias, // eslint-disable-line no-nested-ternary
                        valMontoInversion: $scope.simulacion.valorReinvertir,
                        codPeriodoPago: $rootScope.simulacion.frecuenciaCod,
                        fecFechaInversion: $filter('date')($filter('davDates')($scope.consultaCDTCDAT.fechaProximoVencimiento, 'yyyyMMdd'), 'yyyy-MM-ddT00:00:00'),
                        fecFechaVencimiento: $filter('date')($scope.periodo.fecFechaVencimiento, 'yyyy-MM-dd') + 'T00:00:00',
                        codMomento: 'R',
                        codNumBanco: $scope.consultaCDTCDAT.numeroCompletoCDAT
                    }
                });

            }
        };

        /* ------------------------------------------------------------------------------------------
         | INIT
         -------------------------------------------------------------------------------------------- */

        $scope.consultaTipoDepositoProductoSolicitud();

    }]);

});
