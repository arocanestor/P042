define([
    // core imports
    'angularAMD',
    'angular-ui-router',
    'angular-sanitize',
    'core-genericFilters',
    'core-directives',
    'core-config',
    'core-interceptors',
    'core-utilities',
    'core-slm',
    'core-devices',
    'core-calendar',
    'core-extras',
    'core-angularsoap',
    'core-soapclient',
    // app imports
    './routes/route-novCuentasRetiros',
    './routes/route-novasociada',
    './routes/route-proretiros',
    './routes/route-novAportes',
    './routes/route-traslados',
    './services/api',
    './factories/spa-utils',
    './filters/spa-filters'
], function ($ngAMD) {

    var app = angular.module('webapp', [
        'ui.router',
        'ngSanitize',
        'slm',
        'angularSoap',
        'routes.novedaCuentaRetiro',
        'routes.asociadas',
        'routes.retiros',
        'routes.novAportes',
        'routes.traslados'
    ]);

    app.factory('servicioNumCDT', [function () {

        return {
            cdt: {}
        };

    }]);

    app.config([
        '$locationProvider',
        '$stateProvider',
        '$urlRouterProvider',
        '$httpProvider',
        function ($locationProvider, $stateProvider, $urlRouterProvider, $httpProvider) {

            /* ------------------------------------------------------------------------------------------
             | APP ROUTES
             -------------------------------------------------------------------------------------------- */
            $stateProvider
                .state('app', {
                    url: '/app',
                    views: {
                        main: $ngAMD.route({
                            templateUrl: 'resources/html/views/main.html',
                            controller: 'mainCtrl',
                            controllerUrl: 'controllers/mainCtrl'
                        })
                    },
                    data: {
                        title: 'Dashboard Novedades Fondo De Inversión',
                        bread: 'Dashboard'
                    },
                    resolve: {
                        lovs: ['$api', '$utilities', function ($api, $utilities) {

                            var xhr;

                            xhr = $utilities.resolveLovs([{
                                name: 'lov_bloqueo_biometrico',
                                id: '263'
                            }, {
                                name: 'lov_tipo_id_venta_linea',
                                id: '262'
                            },{
                                name: 'lov_compare_biometric_venta_en_linea',
                                id: '308'
                            }, {
                                name: 'lov_acceso_cdt_venta_en_linea',
                                id: '325'
                            }, {
                                name: 'lov_listas_restrictiva_operacion',
                                id: '354' // CONFIRMAR ID
                            }, {
                                name: 'lov_listas_restrictiva_permitir_codigo',
                                id: '355' // CONFIRMAR ID
                            }, {
                                name: 'lov_productos_novedades_fondos_inversion',
                                id: '382'
                            },{
                                name: 'LOV_FONDOS_TIPO_CUENTA',
                                id: '383'
                            }
                            ]);

                            return xhr;

                        }],
                        siebelSP: ['$q', 'CONFIG', '$api', '$slm-dialog', '$utilities', function ($q, CONFIG, $api, $dialog, $utilities) {

                            var xhr = $q.defer(),
                                dialog = function () {

                                    $dialog.open({
                                        status: 'error',
                                        content: 'Error al cargar los recursos necesarios para ejecutar la aplicación.<br>Intente Nuevamente',
                                        accept: function () {

                                            $utilities.closeApp();

                                        }
                                    });

                                    $utilities.closeApp();

                                };
                            if (CONFIG.persona === 'natural' || CONFIG.naturalConNegocio) {

                                $api.siebel.getCliente({
                                    rowId: CONFIG.rowId,
                                    inNumID: CONFIG.idNumber,
                                    inTipoID: CONFIG.idType
                                }).success(function (response) {

                                    if (!response.DATOS_PN || !response.DATOS_PN.CLIENTE) {

                                        dialog();
                                        xhr.reject();
                                        return;

                                    }
                                    xhr.resolve(response);

                                }).error(function (response) {

                                    dialog();
                                    xhr.reject();

                                });

                            } else {

                                $api.siebel.getCompany({
                                    rowId: CONFIG.rowId,
                                    inNumID: CONFIG.idNumber,
                                    inTipoID: CONFIG.idType
                                }).success(function (response) {

                                    if (!response.DATOS_PJ || !response.DATOS_PJ.CLIENTE) {

                                        dialog();
                                        xhr.reject();
                                        return;

                                    }
                                    xhr.resolve(response);

                                }).error(function (response) {

                                    dialog();
                                    xhr.reject();

                                });

                            }
                            return xhr.promise;

                        }],
                        casb: ['$http', '$q', '$api', 'CONFIG', '$timeout', '$slm-dialog', '$utilities', function ($http, $q, $api, CONFIG, $timeout, $dialog, $utilities) {

                            var xhr = $q.defer();

                            if (CONFIG.persona === 'natural' || CONFIG.naturalConNegocio) {

                                $api.autenticacion.consultaCliente({
                                    rowId: CONFIG.rowId,
                                    usuario: CONFIG.usuario,
                                    nroDocumento: CONFIG.idNumber
                                }).then(function (response) {

                                    xhr.resolve(response);

                                }, function () {

                                    xhr.resolve({
                                        data: {}
                                    });
                                    $dialog.open({
                                        status: 'attention',
                                        content: 'No se pudo obtener la información de enrolamiento del cliente'
                                        // status: 'error',
                                        // content: 'Error al cargar los recursos necesarios para ejecutar la aplicación.<br>Intente Nuevamente',
                                        // accept: function () {
                                        //
                                        //     // $utilities.closeApp();
                                        //
                                        // }
                                    });

                                });

                            } else {

                                $timeout(function () {

                                    xhr.resolve({
                                        data: {}
                                    });

                                }, 10);

                            }

                            return xhr.promise;

                        }],
                        permisos: ['$q', 'CONFIG', '$api', '$utilities', '$filter', function ($q, CONFIG, $api, $utilities, $filter) {

                            var arrayPermisos = [];

                            var xhr = $q.defer();

                            $api.administrador.consultarFuncionalidadesXUsuario({
                                usuario: CONFIG.usuario || '',
                                rol: CONFIG.perfil || '',
                                wa: 'P042'
                            }).success(
                                response => {

                                    if (response.caracterAceptacion === "B" && response.codMsgRespuesta == "0") {

                                        xhr.resolve(response.relaciones); // devuelve los permisos

                                    }

                                }
                            ).error(() => {

                                xhr.reject();

                            });

                            return xhr.promise;

                        }]
                    }
                });

            window.location.hash = '/app';
            $urlRouterProvider.otherwise('/app');

            /* ------------------------------------------------------------------------------------------
             | APP INTERCEPTORS
             -------------------------------------------------------------------------------------------- */
            $httpProvider.interceptors.push('actualizaSiebel');
            $httpProvider.interceptors.push('spNormalize');

            /* ------------------------------------------------------------------------------------------
             | COMMON
             -------------------------------------------------------------------------------------------- */
            // RESTORE SCROLLTOP TO ZERO ON EVERY HASH CHANGE EVENT
            window.onhashchange = function () {

                document.body.scrollTop = document.documentElement.scrollTop = 0;

            };

        }
    ]);

    return $ngAMD.bootstrap(app);

});
