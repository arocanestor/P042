/* global define */
define(['angularAMD'], function ($ngAMD) {

    'use strict';

    var app = angular.module('routes.cdt', ['ui.router']);

    app.config([
        '$locationProvider',
        '$stateProvider',
        '$urlRouterProvider',
        '$httpProvider',
        function (
            $locationProvider,
            $stateProvider,
            $urlRouterProvider,
            $httpProvider
        ) {

            var LOVS = [{
                name: 'lov_cdt_sysdate',
                id: '291'
            }, {
                name: 'lov_checks_CDT',
                id: '279'
            }, {
                name: 'lov_cdt_tipo_documento',
                id: '284'
            }, {
                name: 'lov_excluir_listas_cdt',
                id: '283'
            }, {
                name: 'lov_cdt_tipo_manejo',
                id: '285'
            }, {
                name: 'lov_cdt_forma_pago_intereses',
                id: '286'
            }, {
                name: 'lov_cdt_segmento_cliente',
                id: '292'
            }, {
                name: 'lov_cdt_rechazo_tipo_manejo',
                id: '300'
            }, {
                name: 'lov_cdt_rechazo_cuentas',
                id: '301'
            }, {
                name: 'lov_cdt_novedades',
                id: '303'
            }, {
                name: 'lov_tipo_identif',
                id: '13'
            }, {
                name: 'lov_cdt_endoso_tipo_manejo',
                id: '304'
            }, {
                name: 'lov_cdt_tipo_bloqueo',
                id: '311'
            }, {
                name: 'lov_cdt_forma_pago_disminucion',
                id: '299'
            }, {
                name: 'lov_cdt_autenticacion_alterna',
                id: '340'
            }, {
                name: 'lov_tipo_doc_bol',
                id: '73'
            }, {
                name: 'lov_cdt_tipo_operacion',
                id: '360'
            }, {
                name: 'lov_bloqueo_cdt_movil',
                id: '359'
            }, {
                name: 'lov_cdt_tipo_producto',
                id: '361'
            }];

            // CDT
            $stateProvider
                .state('app.cdt', {
                    url: '/cdt',
                    views: {
                        main_content: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/menu.html',
                            controller: 'menuCtrl',
                            controllerUrl: 'controllers/cdt/menu'
                        })
                    },
                    data: {
                        title: 'Menú CDT',
                        bread: 'Menú CDT'
                    },
                    resolve: {
                        lovs: ['$utilities', function ($utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs(LOVS);

                            return xhr;

                        }]
                    }
                })
                .state('app.cdt.caracteristicas', {
                    url: '/caracteristicas',
                    views: {
                        cdt_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/simulacion/caracteristicasCDT.html',
                            controller: 'caracteristicasCDTCtrl',
                            controllerUrl: 'controllers/cdt/simulacion/caracteristicasCDT'
                        })
                    },
                    data: {
                        title: 'Características CDT',
                        bread: 'Características CDT'
                    },
                    resolve: {
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_CDT_C023').then(function (response) {

                                xhr.resolve(response.data);

                            });

                            return xhr.promise;

                        }]
                    }
                })
                .state('app.cdt.caracteristicas.simulacion', {
                    url: '/simulacion',
                    views: {
                        'cdt-simulacion': $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/simulacion/simulacionCDT.html',
                            controller: 'simulacionCDTCtrl',
                            controllerUrl: 'controllers/cdt/simulacion/simulacionCDT'
                        })
                    },
                    data: {
                        title: 'Simulación',
                        bread: 'Simulación'
                    }
                })
                .state('app.cdt.caracteristicas.simulacion.constitucion', {
                    url: '/apertura',
                    views: {
                        'cdt-constitucion': $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/simulacion/constitucionCDT.html',
                            controller: 'constitucionCDTCtrl',
                            controllerUrl: 'controllers/cdt/simulacion/constitucionCDT'
                        })
                    },
                    data: {
                        title: 'Apertura',
                        bread: 'Apertura'
                    }
                })
                .state('app.cdt.caracteristicas.simulacion.constitucion.resumen', {
                    url: '/confirmacion',
                    views: {
                        'cdt-constitucion-resumen': $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/simulacion/resumenConstitucion.html',
                            controller: 'resumenConstitucionCtrl',
                            controllerUrl: 'controllers/cdt/simulacion/resumenConstitucion'
                        })
                    },
                    data: {
                        title: 'Confirmación',
                        bread: 'Confirmación'
                    }
                })
                .state('app.cdt.caracteristicas.simulacion.constitucion.resumen.biometric', {
                    url: '/biometric',
                    views: {
                        'cdt-constitucion-resumen-biometric': $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/simulacion/CDTBiometric.html',
                            controller: 'cdtCtrlBiometric',
                            controllerUrl: 'controllers/cdt/simulacion/CDTBiometricCtrl'
                        })
                    }
                });

            // CONSULTA CDT
            $stateProvider
                .state('app.cdt.consulta', {
                    url: '/consulta',
                    views: {
                        cdt_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/consulta/consultaCDT.html',
                            controller: 'consultaCDTCtrl',
                            controllerUrl: 'controllers/cdt/consulta/consultaCDT'
                        })
                    },
                    data: {
                        title: 'Consulta CDT',
                        bread: 'Consulta CDT'
                    },
                    resolve: {
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_CDT_C023').then(function (response) {

                                xhr.resolve(response.data);

                            });

                            return xhr.promise;

                        }]
                    }
                });

            // NOVEDADES CDT
            $stateProvider
                .state('app.cdt.novedades', {
                    url: '/novedades',
                    views: {
                        cdt_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/novedades/novedadesCDT.html',
                            controller: 'novedadesCDTCtrl',
                            controllerUrl: 'controllers/cdt/novedades/novedadesCDT'
                        })
                    },
                    data: {
                        title: 'Novedades CDT',
                        bread: 'Novedades CDT'
                    },
                    resolve: {
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_CDT_C023').then(function (response) {

                                xhr.resolve(response.data);

                            });

                            return xhr.promise;

                        }]
                    }
                })
                .state('app.cdt.novedades.endoso', {
                    url: '/endoso',
                    views: {
                        novedad_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/novedades/endosoCDT.html',
                            controller: 'endosoCDTCtrl',
                            controllerUrl: 'controllers/cdt/novedades/endosoCDT'
                        })
                    },
                    data: {
                        title: 'Endoso',
                        bread: 'Endoso'
                    }
                })
                .state('app.cdt.novedades.fraccionamiento', {
                    url: '/fraccionamiento',
                    views: {
                        novedad_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/novedades/fraccionamientoCDT.html',
                            controller: 'fraccionamientoCDTCtrl',
                            controllerUrl: 'controllers/cdt/novedades/fraccionamientoCDT'
                        })
                    },
                    data: {
                        title: 'Fraccionamiento',
                        bread: 'Fraccionamiento'
                    }
                })
                .state('app.cdt.novedades.fusion', {
                    url: '/fusion',
                    views: {
                        novedad_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/novedades/fusionCDT.html',
                            controller: 'fusionCDTCtrl',
                            controllerUrl: 'controllers/cdt/novedades/fusionCDT'
                        })
                    },
                    data: {
                        title: 'Fusión',
                        bread: 'Fusión'
                    }
                })
                .state('app.cdt.novedades.instruccionCancelacion', {
                    url: '/instruccionCancelacion',
                    views: {
                        novedad_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/novedades/instruccionCancelacionCDT.html',
                            controller: 'instruccionCancelacionCDTCtrl',
                            controllerUrl: 'controllers/cdt/novedades/instruccionCancelacionCDT'
                        })
                    },
                    data: {
                        title: 'Instrucción de Cancelación',
                        bread: 'Instrucción de Cancelación'
                    }
                })
                .state('app.cdt.novedades.cambioFormaPago', {
                    url: '/cambioFormaPago',
                    views: {
                        novedad_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/novedades/cambioFormaPagoIntCDT.html',
                            controller: 'cambioFormaPagoIntCDTCtrl',
                            controllerUrl: 'controllers/cdt/novedades/cambioFormaPagoIntCDT'
                        })
                    },
                    data: {
                        title: 'Cambio forma de pago intereses',
                        bread: 'Cambio forma de pago intereses'
                    }
                })
                .state('app.cdt.novedades.bloqueoDesbloqueo', {
                    url: '/bloqueoDesbloqueo',
                    views: {
                        novedad_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/novedades/bloqueoDesbloqueoCDT.html',
                            controller: 'bloqueoDesbloqueoCDTCtrl',
                            controllerUrl: 'controllers/cdt/novedades/bloqueoDesbloqueoCDT'
                        })
                    },
                    data: {
                        title: 'Bloqueo / Desbloqueo',
                        bread: 'Bloqueo / Desbloqueo'
                    }
                });

            // REINVERSION CDT
            $stateProvider
                .state('app.cdt.reinversion', {
                    url: '/menu-reinversion',
                    views: {
                        cdt_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/reinversion/reinversionMenu.html',
                            controller: 'reinversionMenuCtrl',
                            controllerUrl: 'controllers/cdt/reinversion/reinversionMenu'
                        })
                    },
                    data: {
                        title: 'Reinversión CDT',
                        bread: 'Reinversión CDT'
                    }
                })
                .state('app.cdt.reinversion.simulacion', {
                    url: '/simulacion',
                    views: {
                        'simulacion-reinversion': $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/reinversion/simulacionReinversion.html',
                            controller: 'simulacionReinversionCtrl',
                            controllerUrl: 'controllers/cdt/reinversion/simulacionReinversion'
                        })
                    },
                    data: {
                        title: 'Simulación',
                        bread: 'Simulación'
                    }
                })
                .state('app.cdt.reinversion.simulacion.reinversion', {
                    url: '/apertura',
                    views: {
                        'cdt-reinversion': $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/reinversion/reinversionCDT.html',
                            controller: 'reinversionCDTCtrl',
                            controllerUrl: 'controllers/cdt/reinversion/reinversionCDT'
                        })
                    },
                    data: {
                        title: 'Reinversión',
                        bread: 'Reinversión'
                    }
                })
                .state('app.cdt.reinversion.simulacion.reinversion.resumen', {
                    url: '/confirmacion',
                    views: {
                        'cdt-reinversion-resumen': $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/reinversion/resumenReinversion.html',
                            controller: 'resumenReinversionCtrl',
                            controllerUrl: 'controllers/cdt/reinversion/resumenReinversion'
                        })
                    },
                    data: {
                        title: 'Confirmación',
                        bread: 'Confirmación'
                    }
                });

            // CUADRE CDT
            $stateProvider
                .state('app.cdt.cuadre', {
                    url: '/cuadre',
                    views: {
                        cdt_main: $ngAMD.route({
                            templateUrl: 'resources/html/views/cdt/cuadre/cuadreCDT.html',
                            controller: 'cuadreCDTCtrl',
                            controllerUrl: 'controllers/cdt/cuadre/cuadreCDT'
                        })
                    },
                    data: {
                        title: 'Cuadre CDT',
                        bread: 'Cuadre CDT'
                    },
                    resolve: {
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_CDT_C023').then(function (response) {

                                xhr.resolve(response.data);

                            });

                            return xhr.promise;

                        }]
                    }
                });

        }
    ]);

});
