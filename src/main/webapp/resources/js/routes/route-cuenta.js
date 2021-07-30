/* global define */
define(['angularAMD'], function ($ngAMD) {

    'use strict';

    var app = angular.module('routes.cuenta', ['ui.router']);

    app.config([
        '$locationProvider',
        '$stateProvider',
        '$urlRouterProvider',
        '$httpProvider',
        function ($locationProvider, $stateProvider, $urlRouterProvider, $httpProvider) {

            // CUENTA DE AHORROS
            $stateProvider
                .state('app.cuenta-ahorros', {
                    url: '/ahorros',
                    views: {
                        main_content: $ngAMD.route({
                            templateUrl: 'resources/html/views/ahorros/ahorros.html',
                            controller: 'ahorrosCtrl',
                            controllerUrl: 'controllers/ahorros/ahorrosCtrl'
                        })
                    },
                    data: {
                        title: 'Cuenta de Ahorros digital',
                        bread: 'Cuenta de Ahorros'
                    },
                    resolve: {
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_tipo_identif',
                                id: '13'
                            }, {
                                name: 'lov_oficinas',
                                id: '15'
                            }, {
                                name: 'lov_oficina_ciudad',
                                id: '160'
                            }, {
                                name: 'lov_listas_cuenta_digital',
                                id: '251'
                            }, {
                                name: 'lov_subproducto_cuenta_digital',
                                id: '252'
                            }, {
                                name: 'lov_clase_cuenta_digital',
                                id: '253'
                            }, {
                                name: 'lov_tipo_cuenta_digital',
                                id: '254'
                            }, {
                                name: 'lov_objetivo_cuenta_digital',
                                id: '255'
                            }, {
                                name: 'lov_extracto_cuenta_digital',
                                id: '256'
                            }, {
                                name: 'lov_estrategia_cuenta_digital',
                                id: '257'
                            }, {
                                name: 'lov_tipo_identif_homologado',
                                id: '258'
                            }, {
                                name: 'lov_checks_venta_en_linea',
                                id: '259'
                            }, {
                                name: 'lov_msg_venta_cuenta',
                                id: '271'
                            }]);

                            return xhr;

                        }],
                        textos: ['$api', '$q', function ($api, $q) {

                            var xhr = $q.defer();

                            $api.reportes.textosReporte('R_CTA_DIGITAL_C023').then(function (response) {

                                xhr.resolve(response.data);

                            });

                            return xhr.promise;

                        }]
                    }
                })
                .state('app.cuenta-ahorros.terms', {
                    url: '/terms',
                    views: {
                        'ahorros-main': $ngAMD.route({
                            templateUrl: 'resources/html/views/ahorros/ahorrosTerms.html',
                            controller: 'ahorrosTermsCtrl',
                            controllerUrl: 'controllers/ahorros/ahorrosTermsCtrl'
                        })
                    },
                    data: {
                        title: 'Condiciones Solicitud Exención del Gravamen a Movimientos Financieros (GMF)',
                        bread: 'Condiciones GMF'
                    }
                })
                .state('app.cuenta-ahorros.biometric', {
                    url: '/biometric',
                    views: {
                        'ahorros-main': $ngAMD.route({
                            templateUrl: 'resources/html/views/ahorros/ahorrosBiometric.html',
                            controller: 'ahorrosCtrlBiometric',
                            controllerUrl: 'controllers/ahorros/ahorrosBiometricCtrl'
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
