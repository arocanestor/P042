/* global define */
define(['angularAMD'], function ($ngAMD) {

    'use strict';

    var app = angular.module('routes.xpress', ['ui.router']);

    app.config([
        '$locationProvider',
        '$stateProvider',
        '$urlRouterProvider',
        '$httpProvider',
        function ($locationProvider, $stateProvider, $urlRouterProvider, $httpProvider) {

            // Xpress
            $urlRouterProvider.when('/app/tarjeta-movil', ['$state', function ($state) {

                $state.go('app.tarjeta-movil.caracteristicas');

            }]);

            $stateProvider
                .state('app.tarjeta-movil', {
                    url: '/tarjeta-movil',
                    views: {
                        main_content: $ngAMD.route({
                            templateUrl: 'resources/html/views/xpress/tarjeta-movil.html',
                            controller: 'tarMovilCtrl',
                            controllerUrl: 'controllers/xpress/tarjetaMovilCtrl'
                        })
                    },
                    data: {
                        title: 'Tarjeta de crédito express',
                        bread: 'Tarjeta de Crédito Móvil'
                    },
                    resolve: {
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_tarjetas_express',
                                id: '266'
                            }, {
                                name: 'lov_actividad_laboral_express',
                                id: '267'
                            }, {
                                name: 'lov_siebel_codigo_ciiu',
                                id: '147'
                            }, {
                                name: 'lov_msg_venta_xpress',
                                id: '278'
                            }, {
                                name: 'lov_oficinas',
                                id: '15'
                            }, {
                                name: 'lov_oficina_ciudad',
                                id: '160'
                            }, {
                                name: 'lov_niveles_tarjetas_express',
                                id: '268'
                            }, {
                                name: 'lov_checks_pxpress',
                                id: '273'
                            }, {
                                name: 'lov_tipo_identif',
                                id: '13'
                            }, {
                                name: 'lov_validaciones_previas_express',
                                id: '309'
                            }, {
                                name: 'lov_state_abbrev',
                                id: '136'
                            }, {
                                name: 'lov_ciud_col',
                                id: '89'
                            }, {
                                name: 'lov_tipo_identif_homologado',
                                id: '258'
                            }]);

                            return xhr;

                        }],
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_XPRESS_C023').then(function (response) {

                                xhr.resolve(response.data);

                            });

                            return xhr.promise;

                        }]
                    }
                })
                .state('app.tarjeta-movil.caracteristicas', {
                    url: '/caracteristicas',
                    views: {
                        main_tarjeta_movil: $ngAMD.route({
                            templateUrl: 'resources/html/views/xpress/caracteristicas.html',
                            controller: 'caracterCtrl',
                            controllerUrl: 'controllers/xpress/caracteristicasCtrl'
                        })
                    },
                    data: {
                        title: 'Tarjeta de crédito express',
                        bread: 'Características'
                    }
                })
                .state('app.tarjeta-movil.autorizaciones', {
                    url: '/autorizaciones',
                    views: {
                        main_tarjeta_movil: $ngAMD.route({
                            templateUrl: 'resources/html/views/xpress/autorizaciones.html',
                            controller: 'autorizaCtrl',
                            controllerUrl: 'controllers/xpress/autorizacionCtrl'
                        })
                    },
                    data: {
                        title: 'Originaci&oacute;n Tarjeta de crédito express',
                        bread: 'Autorizaciones y Declaraciones'
                    }
                })
                .state('app.tarjeta-movil.xpress', {
                    url: '/preanalisis',
                    views: {
                        main_tarjeta_movil: $ngAMD.route({
                            templateUrl: 'resources/html/views/xpress/mainXpress.html',
                            controller: 'xpressCtrl',
                            controllerUrl: 'controllers/xpress/mainXpressCtrl'
                        })
                    },
                    data: {
                        title: 'Tarjeta de crédito express',
                        bread: 'Preanálisis'
                    }
                })
                .state('app.tarjeta-movil.xpress.evaluacion', {
                    url: '/evaluacion',
                    views: {
                        'main-xpress': $ngAMD.route({
                            templateUrl: 'resources/html/views/xpress/evaluacionXpress.html',
                            controller: 'evaxpressCtrl',
                            controllerUrl: 'controllers/xpress/evaluacionXpressCtrl'
                        })
                    },
                    data: {
                        title: 'Tarjeta de crédito express',
                        bread: 'Evaluación'
                    },
                    resolve: {
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_mensajes_Xpress',
                                id: '288'
                            }]);

                            return xhr;

                        }]
                    }
                })
                .state('app.tarjeta-movil.xpress.evaluacion.confirmacion', {
                    url: '/confirmacion',
                    views: {
                        'evaluacion-xpress': $ngAMD.route({
                            templateUrl: 'resources/html/views/xpress/confirmacion.html',
                            controller: 'confirmacionCtrl',
                            controllerUrl: 'controllers/xpress/confirmacionCtrl'
                        })
                    },
                    data: {
                        title: 'Originaci&oacute;n Tarjeta de crédito express',
                        bread: 'Confirmación'
                    }
                });

        }
    ]);

});
