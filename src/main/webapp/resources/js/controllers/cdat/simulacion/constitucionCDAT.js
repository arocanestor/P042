 /* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('constitucionCDATCtrl', [
        '$scope',
        '$rootScope',
        'CONFIG',
        'lovs',
        function ($scope, $rootScope, CONFIG, lovs) {


            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */


            var nameSpace = $rootScope.account[$rootScope.routeApp['2']];
            $scope.simulacion = nameSpace.simulacion;
            $scope.proyeccion = nameSpace.proyeccion;
            $scope.constitucion = {};

            $scope.productos = [];

            // VALIDATE CHECKS
            $scope.validateChecks = {
                '01-acepto-reglamento': true,
                '02-autoriza-huella': true
            };

            $scope.lovs = lovs;
            $scope.lovReinversion = lovs.lov_checks_CDaT;
            $scope.lovs.listaReinversion = [];
            $scope.lovs.listaReinversion = (function () {

                var listaReinversion = [];

                $scope.lovReinversion.sort(function (lov1, lov2) {

                    return Number(lov1.codigo.slice(0, 2)) > Number(lov2.codigo.slice(0, 2));

                });

                angular.forEach($scope.lovReinversion, function (condiciones) {

                    if (condiciones.codigo != '03-autoriza-huella-reinversion') {

                        listaReinversion.push(condiciones);

                    }

                });

                return listaReinversion;

            }());
            // huella capturada
            $scope.biometricData = {};

            $scope.caption = {
                confirmApertura: '<ul gui="list"><li> Para pasar a la confirmación de la apertura, continúe. </li><li> Haga click en Regresar para volver al paso anterior.</li></ul>'
            };


            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.guardarInfo = function () {

                nameSpace.constitucion = $scope.constitucion;

            };

            $scope.$gui = {

                bioCapture: function (data) {

                    $scope.biometricData = data;

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$program = {

                lovCuentas: function () {

                    var arr = CONFIG.objPersona.listOfDavFincorpaccountBc ? CONFIG.objPersona.listOfDavFincorpaccountBc.davFincorpaccountBc : CONFIG.objPersona.listOfFincorpAccount.fincorpAccount,
                        cuentas = [];

                    angular.forEach(arr, function (value, i) {

                        if ((value.davEffectiveProduct === 'VIGENTE' || value.davEffectiveProduct === '01')) {

                            var codigoSubProducto = value.davSubproductCode.slice(-4);

                            if ((['0001', '0002', '0003', '0008', '0010', '0012', '0026', '0029', '0060']).indexOf(codigoSubProducto) != -1) {

                                cuentas.push({
                                    value: value.accountNumber3,
                                    label: 'Cuenta Davivienda - Ahorros ' + value.accountNumber3.slice(-4),
                                    tipo: 'AHO'
                                });

                            }

                            if ((['2000', '2001', '2080', '2081', '2090']).indexOf(codigoSubProducto) != -1) {

                                cuentas.push({
                                    value: value.accountNumber3,
                                    label: 'Cuenta Davivienda - Corriente ' + value.accountNumber3.slice(-4),
                                    tipo: 'CTE'
                                });

                            }

                        }

                    });


                    $scope.productos = cuentas;

                }

            };

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.$program.lovCuentas();


        }
    ]);

});
