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
                5: "traslado-portafolios",
                6: "seguros",
                //6: "novedad-cuentas-retiros"
            };

            // RESERVED NAMESPACES
            $rootScope.account = {};

            // ICONOS DE LAS CUENTAS, RELACIONADOS AL MISMO NOMBRE DEL ROUTE
            $scope.accountIcons = {};
            $scope.accountIcons[$rootScope.routeApp[1]] = 'flat-financial-003-tax-1';
            $scope.accountIcons[$rootScope.routeApp[2]] = 'flat-financial-016-exchange';
            $scope.accountIcons[$rootScope.routeApp[3]] = 'flat-financial-027-smartphone';
            $scope.accountIcons[$rootScope.routeApp[4]] = 'flat-financial-023-check';
            $scope.accountIcons[$rootScope.routeApp[5]] = 'flat-financial-018-briefcase-1';
            $scope.accountIcons[$rootScope.routeApp[6]] = 'flat-financial-007-safebox';

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
