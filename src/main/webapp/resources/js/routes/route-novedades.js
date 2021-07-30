/* global define */
define(['angularAMD'], function ($ngAMD) {

    'use strict';

    var app = angular.module('routes.novedadcuentas', ['ui.router']);

    app.config([
        '$locationProvider',
        '$stateProvider',
        '$urlRouterProvider',
        '$httpProvider',
        function ($locationProvider, $stateProvider, $urlRouterProvider, $httpProvider) {

            // NOVEDADES CUENTAS
            $stateProvider
                .state('app.novedadcuentas', {
                    url: '/novedadcuentas',
                    views: {
                        main_content: $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/mainNovedades.html',
                            controller: 'novedadesCtrl',
                            controllerUrl: 'controllers/novedadcuentas/mainNovedades'
                        })
                    },
                    data: {
                        title: 'Novedades de Fondos',
                        bread: 'Novedad Cuenta Retiro'
                    }
                });

            $stateProvider
                /*.state('app.novedadcuentas.caracteristicas', {
                    url: '/novedadcuentas-caracteristicas',
                    views: {
                        novedadcuentas_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/simulacion/caracteristicasCDAT.html',
                            controller: 'caracteristicasCDATCtrl',
                            controllerUrl: 'controllers/novedadcuentas/simulacion/caracteristicasCDAT'
                        })
                    },
                    data: {
                        title: 'CDAT Virtual - Características',
                        bread: 'CDAT Virtual - Características'
                    },
                    resolve: {
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_CDAT_C023').then(function (response) {

                                xhr.resolve(response.data);

                            });

                            return xhr.promise;

                        }],
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_listas_cuenta_digital',
                                id: '251'
                            }]);

                            return xhr;

                        }]
                    }
                })
                .state('app.novedadcuentas.caracteristicas.simulacion', {
                    url: '/novedadcuentas-simulacion',
                    views: {
                        "novedadcuentas-caracteristicas": $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/simulacion/simulacionCDAT.html',
                            controller: 'simulacionCDATCtrl',
                            controllerUrl: 'controllers/novedadcuentas/simulacion/simulacionCDAT'
                        })
                    },
                    data: {
                        title: 'CDAT Virtual - Simulación',
                        bread: 'CDAT Virtual - Simulación'
                    }
                })
                .state('app.novedadcuentas.caracteristicas.simulacion.constitucion', {
                    url: '/apertura',
                    views: {
                        'novedadcuentas-constitucion': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/simulacion/constitucionCDAT.html',
                            controller: 'constitucionCDATCtrl',
                            controllerUrl: 'controllers/novedadcuentas/simulacion/constitucionCDAT'
                        })
                    },
                    data: {
                        bread: 'Apertura'
                    },
                    resolve: {
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_checks_CDaT',
                                id: '261'
                            }]);

                            return xhr;

                        }]
                    }
                })
                .state('app.novedadcuentas.caracteristicas.simulacion.constitucion.resumen', {
                    url: '/confirmacion',
                    views: {
                        'novedadcuentas-constitucion-resumen': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/simulacion/resumenConstitucion.html',
                            controller: 'resumenConstitucionCtrl',
                            controllerUrl: 'controllers/novedadcuentas/simulacion/resumenConstitucion'
                        })
                    },
                    data: {
                        bread: 'Confirmación'
                    }
                })
                .state('app.novedadcuentas.caracteristicas.simulacion.constitucion.resumen.biometric', {
                    url: '/biometric',
                    views: {
                        'novedadcuentas-constitucion-resumen-biometric': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/simulacion/CDATBiometric.html',
                            controller: 'novedadcuentasCtrlBiometric',
                            controllerUrl: 'controllers/novedadcuentas/simulacion/CDATBiometricCtrl'
                        })
                    }
                });*/


            // CDAT Reinversion
            $stateProvider
                .state('app.novedadcuentas.reinversion', {
                    url: '/caracteristicas',
                    views: {
                        novedadcuentas_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/reinversion/caracteristicasCDAT.html',
                            controller: 'caracteristicasReinvCDATCtrl',
                            controllerUrl: 'controllers/novedadcuentas/reinversion/caracteristicasCDAT'
                        })
                    },
                    data: {
                        title: 'Características',
                        bread: 'Características'
                    },
                    resolve: {
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_CDAT_P038').then(function (response) {

                                xhr.resolve(response.data);

                            }, function (response) {

                            });

                            return xhr.promise;

                        }],
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_novedadcuentas_permitidos',
                                id: '270'
                            }, {
                                name: 'lov_listas_cuenta_digital',
                                id: '251'
                            }]);

                            return xhr;

                        }]
                    }
                })
                .state('app.novedadcuentas.reinversion.detalle', {
                    url: '/novedadcuentas-detalle',
                    views: {
                        'novedadcuentas-simulacion': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/reinversion/detalleCtrl.html',
                            controller: 'detalleCtrl',
                            controllerUrl: 'controllers/novedadcuentas/reinversion/detalleCtrl'
                        })
                    },
                    data: {
                        title: 'Detalle CDAT Virtual',
                        bread: 'Detalle CDAT Virtual'
                    },
                    resolve: {
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_oficinas_novedadcuentas',
                                id: '290'
                            }]);

                            return xhr;

                        }]
                    }
                })
                .state('app.novedadcuentas.reinversion.detalle.simulacion', {
                    url: '/novedadcuentas-simulacion',
                    views: {
                        "novedadcuentas-detalle": $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/reinversion/simulacionReinversion.html',
                            controller: 'simulacionCDATCtrl',
                            controllerUrl: 'controllers/novedadcuentas/reinversion/simulacionReinversion'
                        })
                    },
                    data: {
                        title: 'Simulación',
                        bread: 'Simulación'
                    }
                })
                .state('app.novedadcuentas.reinversion.detalle.simulacion.reinversion', {
                    url: '/reinversion',
                    views: {
                        'novedadcuentas-reinversion': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/reinversion/reinversionCDAT.html',
                            controller: 'reinversionCDATCtrl',
                            controllerUrl: 'controllers/novedadcuentas/reinversion/reinversionCDAT'
                        })
                    },
                    data: {
                        bread: 'Reinversión'
                    },
                    resolve: {
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_checks_CDaT',
                                id: '261'
                            }]);

                            return xhr;

                        }]
                    }
                })
                .state('app.novedadcuentas.reinversion.detalle.simulacion.reinversion.resumen', {
                    url: '/resumen',
                    views: {
                        'novedadcuentas-reinversion-resumen': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/reinversion/resumenReinversion.html',
                            controller: 'resumenReinversionCtrl',
                            controllerUrl: 'controllers/novedadcuentas/reinversion/resumenReinversion'
                        })
                    },
                    data: {
                        bread: 'Resumen'
                    }
                })
                .state('app.novedadcuentas.reinversion.detalle.simulacion.reinversion.resumen.biometric', {
                    url: '/biometric',
                    views: {
                        'novedadcuentas-reinversion-biometric': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/reinversion/CDATBiometric.html',
                            controller: 'novedadcuentasCtrlBiometric',
                            controllerUrl: 'controllers/novedadcuentas/reinversion/CDATBiometricCtrl'
                        })
                    },
                    data: {
                        title: 'Captura de huella',
                        bread: 'Firma electrónica'
                    }
                });

            // CDAT Canclecion
            $stateProvider
                .state('app.novedadcuentas.cancelacion', {
                    url: '/cancelacion',
                    views: {
                        novedadcuentas_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/cancelacion/cancelacionCDAT.html',
                            controller: 'cancelacionCDATCtrl',
                            controllerUrl: 'controllers/novedadcuentas/cancelacion/cancelacionCDAT'
                        })
                    },
                    data: {
                        title: 'Cancelación CDAT Virtual',
                        bread: 'Cancelación CDAT Virtual'
                    },
                    resolve: {
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_CDAT_P038').then(function (response) {

                                xhr.resolve(response.data);

                            }, function (response) {

                            });

                            return xhr.promise;

                        }],
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_novedadcuentas_permitidos',
                                id: '270'
                            }, {
                                name: 'lov_listas_cuenta_digital',
                                id: '251'
                            }, {
                                name: 'lov_oficinas_novedadcuentas',
                                id: '290'
                            }]);

                            return xhr;

                        }]
                    }
                })
                .state('app.novedadcuentas.cancelacion.resumen', {
                    url: '/resumen',
                    views: {
                        'novedadcuentas-cancelacion': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/cancelacion/resumenCancelacion.html',
                            controller: 'resumenCancelacionCtrl',
                            controllerUrl: 'controllers/novedadcuentas/cancelacion/resumenCancelacion'
                        })
                    },
                    data: {
                        title: 'Confirmación Cancelación CDAT Virtual',
                        bread: 'Confirmación Cancelación CDAT Virtual'
                    }
                })
                .state('app.novedadcuentas.cancelacion.resumen.biometric', {
                    url: '/biometric',
                    views: {
                        'novedadcuentas-cancelacion-biometric': $ngAMD.route({
                            templateUrl: 'resources/html/views/novedadcuentas/cancelacion/CDATBiometric.html',
                            controller: 'novedadcuentasCtrlBiometric',
                            controllerUrl: 'controllers/novedadcuentas/cancelacion/CDATBiometricCtrl'
                        })
                    },
                    data: {
                        title: 'Captura de huella',
                        bread: 'Firma electrónica'
                    }
                });

        }
    ]);

});
