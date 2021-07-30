/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('cancelacionCDATCtrl', ['$scope', '$rootScope', 'CONFIG', 'textos', '$api', '$slm-dialog', '$state', '$filter', 'lovs', function ($scope, $rootScope, CONFIG, textos, $api, $dialog, $state, $filter, lovs) {

        /* ------------------------------------------------------------------------------------------
         | INIT
         -------------------------------------------------------------------------------------------- */
        $scope.$on('$viewContentLoaded', function (event) {

            $scope.content = 'Content from cancelacionCDATCtrl';
            lovCuentas();

        });

        $scope.lovs = lovs;
        $scope.noJuridico = CONFIG.persona !== 'natural' && !CONFIG.naturalConNegocio;

        $scope.cancelacion = {
            producto: ''
        };
        // $rootScope.cancelacion = {};

        $rootScope.textos = textos;
        $scope.textos = $rootScope.textos;

        $scope.infoCDAT = $rootScope.consultaCDTCDAT;

        /* ------------------------------------------------------------------------------------------
         | SETUP
         -------------------------------------------------------------------------------------------- */
        $scope.productos = [];
        $scope.productosCDaT = [];

        $scope.subtitle = 'Seleccione la cuenta a donde el cliente quiere trasladar los recursos y luego el CDAT Virtual que desea cancelar';

        // captions
        $scope.caption = {
            firmaDigital: 'La huella se utilizará como firma digital para los documentos',
            productos: 'El cliente no presenta CDAT Virtual en fecha de vencimiento o días hábiles de gracia para su Cancelación'
        };

        $scope.intereses = [{
            value: 'Si',
            label: 'Si'
        },
        {
            value: 'No',
            label: 'No'
        }
        ];

        // VALIDATE CHECKS
        $scope.validateChecks = {
            'acepto-reglamento': true,
            'habeas-data': true,
            'autorizo-compartir': false,
            'autoriza-huella': true
        };

        // huella capturada
        $scope.biometricData = {};



        // ////////////////////////////// VALIDACION PERSONA
        if (CONFIG.persona !== 'natural' && !CONFIG.naturalConNegocio) {

            $dialog.open({
                status: 'error',
                content: 'Transacción aplica únicamente para personas Naturales',
                accept: function () {

                    $state.go('^');

                }
            });
            return;

        }

        /* ------------------------------------------------------------------------------------------
         | GUI FUNCTIONS
         -------------------------------------------------------------------------------------------- */

        // $scope.guardarInfo = function (producto) {
        //
        //     $rootScope.cancelacion = producto;
        //
        // };

        $scope.$gui = {

            bioCapture: function (data) {

                $scope.biometricData = data;

            },

            cancelacion: function (producto) {

                $rootScope.consultaCDTCDAT = producto;
                $state.go('app.cdat.cancelacion.resumen');

            },

            guardarInfo: function (producto) {

                $rootScope.cancelacion = producto;

            }

        };

        /* ------------------------------------------------------------------------------------------
         | PROGRAM FUNCTIONS
         -------------------------------------------------------------------------------------------- */

        $scope.consultaSaldosCdtCdat = function (numProduct) {

            // si es un producto CDAT continua con el proceso
            $scope.$api.consultaSaldosCdtCdat(numProduct).then(function (response) {

                if (response.data && response.data.serie) {

                    // se obtiene el codigo de la oficina parametrico en BD
                    var codOficina = $filter('filter')($scope.lovs.lov_oficinas_cdat, {
                        codigo: '01'
                    })[0].desc;


                    response.data.numeroCompletoCDAT = numProduct;

                    if ((response.data.valIndicadorReinversion == '3') || (response.data.valIndicadorReinversion == '4')) {

                        $scope.productosCDaT.push(response.data);

                    }

                }

            }, function (response) {

                if (response.status !== 417) {

                    $dialog.open({
                        status: 'error',
                        content: 'Ha ocurrido un error inesperado'
                    });

                }

                // $utilities.closeApp();

            });

        };


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

        $scope.$api = {

            consultarProductos: function () {

                return $api.Cdat.consultarProductos({
                    usuario: CONFIG.usuario,
                    oficinaTotal: CONFIG.oficinaTotal,
                    rowId: CONFIG.rowId,
                    numeroIdentificacion: CONFIG.idNumber,
                    tipoIdentificacion: CONFIG.idType,
                    tipoConsulta: "0",
                    compania: "90",
                    vinculacion: "510",
                    codigoProducto: "510",
                    codigoSubProducto: "5160",
                    numeroProducto: "0"
                });

            },

            consultaSaldosCdtCdat: function (numeroP) {

                return $api.Cdat.consultaSaldosCdtCdat({

                    rowId: CONFIG.rowId,
                    oficinaTotal: CONFIG.oficinaTotal || '1',
                    usuario: CONFIG.usuario,
                    serie: numeroP.slice(4, 6),
                    numeroCertificado: numeroP.slice(6)

                });

            }

        };



        $scope.$api.consultarProductos().then(function (response) {

            angular.forEach(response.data.productos, function (producto, i) {

                if ((producto.codigoProducto == '0510' || producto.codigoProducto == '510') && producto.codigoSubproducto == '5160') {

                    $scope.consultaSaldosCdtCdat(producto.numeroProducto);

                }

            });

        }, function (response) {

            $dialog.open({
                status: 'error',
                title: 'CONSULTA PERIODO SOLICITUD',
                content: response.data || 'A ocurrido un error inesperado'
            });

        });

    }]);

});
