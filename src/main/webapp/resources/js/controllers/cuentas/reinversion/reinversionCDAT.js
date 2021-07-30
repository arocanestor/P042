/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('reinversionCDATCtrl', ['$scope', '$rootScope', 'CONFIG', 'lovs', function ($scope, $rootScope, CONFIG, lovs) {

        /* ------------------------------------------------------------------------------------------
         | SETUP
         -------------------------------------------------------------------------------------------- */

        $scope.simulacion = $rootScope.simulacion;
        $scope.constitucion = {};
        $rootScope.constitucion = {};

        $scope.productos = [];

        $scope.Number = Number;

        // captions
        $scope.caption = {
            firmaDigital: 'La huella se utilizará como firma digital para los documentos'
        };

        // VALIDATE CHECKS
        $scope.validateChecks = {
            '01-acepto-reglamento': true,
            '03-autoriza-huella-reinversion': true,
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

                if (condiciones.codigo != '02-autoriza-huella') {

                    listaReinversion.push(condiciones);

                }

            });

            return listaReinversion;

        }());
        // huella capturada
        $scope.biometricData = {};

        $scope.descCuentaReinversion = function () {

            var desc = 'Seleccione la cuenta para la reinversión.';

            if (Number($scope.simulacion.valorReinvertir) > Number($scope.simulacion.valorActualHomologado)) {

                desc = 'Seleccione la Cuenta de donde se tomará el valor adicional de la reinversión';

            } else if (Number($scope.simulacion.valorReinvertir) < Number($scope.simulacion.valorActualHomologado)) {

                desc = 'Seleccione la Cuenta a donde el cliente quiere que le transfieran el valor que disminuyó en la reinversión';

            }

            return desc;

        };

        $scope.caption = {
            confirmApertura: '<ul gui="list"><li> Para pasar a la confirmación de la reinversión, continúe. </li><li> Haga click en Regresar para volver al paso anterior.</li></ul>'
        };

        /* ------------------------------------------------------------------------------------------
         | GUI FUNCTIONS
         -------------------------------------------------------------------------------------------- */



        $scope.guardarInfo = function () {

            $rootScope.constitucion = $scope.constitucion;

        };

        $scope.$gui = {

            bioCapture: function (data) {

                $scope.biometricData = data;

            }

        };

        /* ------------------------------------------------------------------------------------------
         | PROGRAM FUNCTIONS
         -------------------------------------------------------------------------------------------- */


        function lovCuentas () {

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


        /* ------------------------------------------------------------------------------------------
         | API FUNCTIONS
         -------------------------------------------------------------------------------------------- */


        /* ------------------------------------------------------------------------------------------
         | INIT
         -------------------------------------------------------------------------------------------- */
        lovCuentas();


    }]);

});
