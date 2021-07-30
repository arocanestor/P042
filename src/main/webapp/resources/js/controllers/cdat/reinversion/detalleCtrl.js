define(['../../../app'], function (app) {

    'use strict';

    app.controller('detalleCtrl', [
        '$scope',
        'lovs',
        '$rootScope',
        '$filter',
        '$slm-dialog',
        '$api',
        'CONFIG',
        '$utilities',
        'siebelSP',
        'casb',
        '$state',
        function ($scope, lovs, $rootScope, $filter, $dialog, $api, CONFIG, $utilities, siebelSP, casb, $state) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            $scope.subtitle = 'Seleccione el CDAT Virtual que el cliente quiere reinvertir:';
            $scope.tableTitle = 'CDAT Virtual N° ';

            // $rootScope.CLIENT = {};

            // DATOS DE ENROLAMIENTO DEL CLIENTE
            $rootScope.autenticacion = casb.data;

            $scope.lovs = lovs;

            $scope.dialogs = {
                checkListas: 'Error al verificar al cliente en listas restrictivas. Intente mas tarde',
                checkCDaT: 'El cliente no presenta CDAT Virtual en fecha de vencimiento o días hábiles de gracia para su Reinversión'
            };

            $scope.productos = [];
            $scope.llamadoMensajeBloqueo = 0;

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.reinversion = function (producto) {

                $rootScope.consultaCDTCDAT = producto;
                $state.go('app.cdat.reinversion.detalle.simulacion');

            };


            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.consultaSaldosCdtCdat = function (numProduct) {

                // si es un producto CDAT continua con el proceso
                $scope.$api.consultaSaldosCdtCdat(numProduct).then(function (response) {

                    // se obtiene el codigo de la oficina parametrico en BD
                    var codOficina = $filter('filter')($scope.lovs.lov_oficinas_cdat, {
                        codigo: '01'
                    })[0].desc;


                    response.data.numeroCompletoCDAT = numProduct;
                    if ((response.data.valIndicadorReinversion == '3') || (response.data.valIndicadorReinversion == '4')) {

                        $scope.productos.push(response.data);

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

            /* ------------------------------------------------------------------------------------------
            | INIT
            -------------------------------------------------------------------------------------------- */


            $scope.$api.consultarProductos().then(function (response) {

                angular.forEach(response.data.productos, function (producto, i) {

                    if ((producto.codigoProducto == '0510' || producto.codigoProducto == '510') && producto.codigoSubproducto == '5160') {

                        $scope.consultaSaldosCdtCdat(producto.numeroProducto);

                    }

                });

            }, function (response) {

                $dialog.open({
                    status: 'error',
                    title: 'CONSULTA PRODUCTOS',
                    content: response.data || 'A ocurrido un error inesperado'
                });

            });



        }
    ]);

});
