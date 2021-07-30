/* global define*/
define(['../app'], function (app) {

    'use strict';
    app.controller('mainCtrl', [
        '$rootScope',
        '$scope',
        '$api',
        'CONFIG',
        '$slm-dialog',
        '$utilities',
        '$spaUtils',
        'lovs',
        'siebelSP',
        'casb',
        '$filter',
        'permisos',
        function ($rootScope, $scope, $api, CONFIG, $dialog, $utilities, $spaUtils, lovs, siebelSP, casb, $filter, permisos) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            $rootScope.lov = lovs;
            $scope.numProdDafaturo = null;

            lovs.lov_productos_novedades_fondos_inversion_obj = $utilities.arr2Obj(lovs.lov_productos_novedades_fondos_inversion, 'codigo');

            // HOMOLOGACION INTERNA CONTRA LOV_PRODUCTOS_VENTA_EN_LINEA PARA EL ROUTE DE LA APP
            $rootScope.routeApp = {
                1: "novedad-cuenta-retiros",
                2: "novedad-cuentas-asociadas",
                3: "programacion-retiros",
                4: "novedad-aportes",
                //4: "traslado-portafolios",
                //5: "seguros",
                //6: "novedad-cuentas-retiros"
            };

            // RESERVED NAMESPACES
            $rootScope.account = {};

            // ICONOS DE LAS CUENTAS, RELACIONADOS AL MISMO NOMBRE DEL ROUTE
            $scope.accountIcons = {};
            $scope.accountIcons[$rootScope.routeApp[1]] = 'flat-financial-033-money-bag';
            $scope.accountIcons[$rootScope.routeApp[2]] = 'flat-financial-010-piggy-bank';
            $scope.accountIcons[$rootScope.routeApp[3]] = 'flat-financial-040-coin';
            $scope.accountIcons[$rootScope.routeApp[4]] = 'flat-financial-010-piggy-bank';
            //$scope.accountIcons[$rootScope.routeApp[5]] = 'flat-financial-040-coin';
            //$scope.accountIcons[$rootScope.routeApp[6]] = 'flat-financial-010-piggy-bank';

            // DATOS DE ENROLAMIENTO DEL CLIENTE
            $rootScope.autenticacion = casb.data;

            // SIEBEL-SP OBJECTS TRANSVERSALES EN LAS CUENTAS
            $rootScope.CLIENT = {};
            $rootScope.COMPANY = {};

            // CERRAMOS SOLICITUD DE SERVICIO EN CUANTO LA VENTANA ES CERRADA POR EL USUARIO
            window.onbeforeunload = function () {

                $rootScope.$broadcast('event:close');

                if (!$rootScope.appIsBlocked) {

                    $utilities.closeApp({
                        request: 'close',
                        async: false
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $rootScope.close = function () {

                $rootScope.$broadcast('event:close');

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {
                consultarFuncionalidadesXUsuario: () => {

                    return $api.administrador.consultarFuncionalidadesXUsuario({
                        usuario: CONFIG.usuario || '',
                        rol: CONFIG.perfil || '',
                        wa: 'P042'
                    });

                }
            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.$on('$viewContentLoaded', function (event) {

                // valida los permisos del usuario
                $scope.numProdDafaturo = CONFIG.numeroProducto;

                var lov_productos_novedades_fondos_inversion = lovs.lov_productos_novedades_fondos_inversion.filter(function (obj) {

                    return !permisos.some(function (obj2) {

                        return obj.codigo == obj2.permiso.split('-')[0];

                    });

                });

                /*angular.forEach(lov_productos_novedades_fondos_inversion, function (valor, i) {

                    $spaUtils.disableInitProduct(valor.codigo);

                });


                if (siebelSP.DATOS_PN) {

                    // Recorre la lista biometrica y la deshabilita.

                    lovs.lov_productos_novedades_fondos_inversion.map(function (obj) {

                        obj.disabledBiometric = false;

                        return obj;

                    });
                    angular.forEach(lovs.lov_productos_novedades_fondos_inversion, function (prodObj) {

                        var validIdsObj = $filter('filter')(lovs.lov_tipo_id_venta_linea, {
                            codigo: prodObj.codigo
                        })[0] || {
                            desc: ''
                        };

                        // VALIDACION TIPO DOCUMENTO
                        if (validIdsObj.desc.split(';').indexOf(siebelSP.DATOS_PN.CLIENTE.IdentificationTypeCode) == -1) {

                            prodObj.disabled = true;

                        }


                    });


                    if (siebelSP.DATOS_PN.CLIENTE.MetodoAutenticacion != 'BIOMÉTRICO') {

                        angular.forEach(lovs.lov_bloqueo_biometrico, function (valor, i) {

                            if (valor.desc == 'true') {

                                $spaUtils.disableInitProductbiometric(valor.codigo);

                            }

                        });

                    }

                } else {

                    angular.forEach(lovs.lov_productos_novedades_fondos_inversion, function (prodObj) {

                        var validIdsObj = $filter('filter')(lovs.lov_tipo_id_venta_linea, {
                            codigo: prodObj.codigo
                        })[0] || {
                            desc: ''
                        };

                        // VALIDACION TIPO DOCUMENTO
                        if (validIdsObj.desc.split(';').indexOf(siebelSP.DATOS_PJ.CLIENTE.IdentificationTypeCode) == -1) {

                            prodObj.disabled = true;

                        }


                    });

                }*/

            });


            if (CONFIG.persona === 'natural' || CONFIG.naturalConNegocio) {

                if (siebelSP.DATOS_PN) {

                    $rootScope.CLIENT = siebelSP.DATOS_PN;

                }

            } else if (siebelSP.DATOS_PJ) {

                $rootScope.COMPANY = siebelSP.DATOS_PJ;

            }

        }
    ]);

});
