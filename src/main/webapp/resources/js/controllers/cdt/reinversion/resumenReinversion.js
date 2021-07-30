 /* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('resumenReinversionCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        'CONFIG',
        '$slm-dialog',
        '$spaUtils',
        '$filter',
        '$state',
        function (
            $scope,
            $rootScope,
            $api,
            CONFIG,
            $dialog,
            $spaUtils,
            $filter,
            $state
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            var nameSpace = $rootScope.account[$rootScope.routeApp['3']];

            $scope.reinversion = nameSpace.reinversion;
            $scope.simulacion = nameSpace.simulacion;
            $scope.proyeccion = nameSpace.proyeccion;
            $scope.cdtSeleccionado = nameSpace.cdtSeleccionado;
            $scope.cheques = nameSpace.cheques;

            // captions
            $scope.caption = {
                cambioValor: $scope.simulacion.diferenciaValores == 0 ? 'Imprima el nuevo título físico y haga entrega al cliente. Al título físico actual escribirle “REINVERTIDO”, y lo debe enviar en el movimiento de la oficina.' : '<ul gui="list"><li>Finalice la reinversión en Caja, donde se hará la entrega del título físico. Si no termina el proceso en Caja, la reinversión se anulará de manera automática al finalizar el día.</li><li>Al título físico actual debe escribirle “REINVERTIDO”, y lo debe enviar en el movimiento de la oficina.</li></ul>'
            };

            $scope.llamadoReinversion = 0;
            $scope.mensajeReinversion = "";
            $scope.habilitaVista = "";
            $scope.tituloVer = 'Ver más';
            $scope.tituloIcono = 'fa fa-plus';

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                cambiarValor: function (data) {

                    if ($scope.habilitaVista == true) {

                        $scope.habilitaVista = false;
                        $scope.tituloVer = 'Ver más';
                        $scope.tituloIcono = 'fa fa-plus';

                    } else {

                        $scope.habilitaVista = true;
                        $scope.tituloVer = 'Ver menos';
                        $scope.tituloIcono = 'fa fa-minus';

                    }

                },

                confirmarReinversion: function () {

                    $scope.$api.consultaDetalleXcdt().then(function (resp) {

                        if (resp.data.beneficiarios.length > 0) {

                            $scope.$program.armarObjMovimientos();
                            $scope.$program.armarObjDetalleCheques();

                            // se llama el servicio de constitucion del CDT
                            $scope.$api.reinversionCdtSolicitud(resp.data.beneficiarios).then(function (resp) {

                                $scope.llamadoReinversion = 1;
                                $scope.mensajeReinversion = "LA REINVERSIÓN DEL CDT HA SIDO EXITOSA, EL NÚMERO DEL PRODUCTO ES: " + resp.data.valNumeroCDT;
                                $state.$current.path[2].data.redirect = 'app.cdt.reinversion';

                            }, function (resp) {

                                $scope.llamadoReinversion = 2;
                                $scope.mensajeReinversion = resp.headers("Respuesta") || "No fue posible realizar la creación del CDT, por favor intente nuevamente";

                            });

                        } else {

                            $scope.llamadoReinversion = 2;
                            $scope.mensajeReinversion = "No fue posible realizar la creación del CDT, por favor intente nuevamente";

                        }

                    }, function (resp) {

                        $scope.llamadoReinversion = 2;
                        $scope.mensajeReinversion = resp.headers("Respuesta") || "No fue posible realizar la creación del CDT, por favor intente nuevamente";

                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$program = {

                armarObjMovimientos: function () {

                    $scope.requesObjMovimientos = [];

                    // si el valor a reinvertir es mayor a la inversion actual
                    if ($scope.simulacion.diferenciaValores > 0) {

                        if ($scope.reinversion.checks.efectivoCheck) {

                            $scope.requesObjMovimientos.push({
                                codTipoDocumento: CONFIG.idType,
                                idDocumento: CONFIG.idNumber,
                                codMoneda: $scope.simulacion.tipoCDT.codMoneda,
                                codProducto: 'EFEC',
                                valValorMovimiento: Math.abs($scope.reinversion.valorEfectivo ? $scope.reinversion.valorEfectivo : $scope.simulacion.diferenciaValores),
                                fecFechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                valSecuencialFormaPago: '0',
                                codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                            });

                        }

                        if ($scope.reinversion.checks.cuentaCheck) {

                            $scope.requesObjMovimientos.push({
                                codTipoDocumento: CONFIG.idType,
                                idDocumento: CONFIG.idNumber,
                                codMoneda: $scope.simulacion.tipoCDT.codMoneda,
                                codProducto: $scope.reinversion.cuenta.tipo, // tipo cuenta Ahorros, corriente
                                valCuentaDebito: $scope.reinversion.cuenta.value, // num cuenta
                                valValorMovimiento: Math.abs($scope.reinversion.valorDebito ? $scope.reinversion.valorDebito : $scope.simulacion.diferenciaValores),
                                fecFechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                valSecuencialFormaPago: 0,
                                codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                            });

                        }

                        if ($scope.reinversion.checks.chequeCheck) {

                            var sumaValCheques = 0;

                            angular.forEach($scope.cheques, function (value, i) {

                                sumaValCheques += Number(value.valorCheque);

                            });

                            $scope.requesObjMovimientos.push({
                                codTipoDocumento: CONFIG.idType,
                                idDocumento: CONFIG.idNumber,
                                codMoneda: $scope.simulacion.tipoCDT.codMoneda,
                                codProducto: 'CHG',
                                valValorMovimiento: Math.abs(sumaValCheques),
                                fecFechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                valSecuencialFormaPago: 0,
                                codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                            });

                        }

                    }

                    // si el valor a reinvertir es igual a la inversion actual
                    if ($scope.simulacion.diferenciaValores == 0) {

                        $scope.requesObjMovimientos.push({
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codMoneda: $scope.simulacion.tipoCDT.codMoneda,
                            codProducto: 'EFEC',
                            valValorMovimiento: Math.abs($scope.simulacion.diferenciaValores),
                            fecFechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                            valSecuencialFormaPago: '0',
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                        });

                    }

                    // si el valor a reinvertir es menor a la inversion actual
                    if ($scope.simulacion.diferenciaValores < 0) {

                        $scope.requesObjMovimientos.push({
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codMoneda: $scope.simulacion.tipoCDT.codMoneda,
                            codProducto: $scope.reinversion.pagoDisminuyo.codigo == '1' ? $scope.reinversion.cualPagoDisminuyo.tipo : ($scope.reinversion.pagoDisminuyo.codigo == '2' ? 'EFEC' : 'CHG'),
                            valCuentaDebito: $scope.reinversion.pagoDisminuyo.codigo != '1' ? undefined : $scope.reinversion.cualPagoDisminuyo.value,
                            valValorMovimiento: Math.abs($scope.simulacion.diferenciaValores),
                            fecFechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                            valSecuencialFormaPago: '0',
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                        });

                    }

                },

                armarObjDetalleCheques: function () {

                    $scope.requesObjDetalleCheques = [];

                    if ($scope.simulacion.diferenciaValores > 0 && $scope.reinversion.checks.chequeCheck) {

                        angular.forEach($scope.cheques, function (cheque, i) {

                            $scope.requesObjDetalleCheques.push({
                                codTipoDocumento: CONFIG.idType,
                                idDocumento: CONFIG.idNumber,
                                codBanco: cheque.codBanco,
                                valCuentaCorriente: cheque.numCuenta,
                                valNumeroCheque: cheque.numCheque,
                                valMontoCheque: cheque.valorCheque
                            });

                        });

                    }

                }

            };

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                consultaDetalleXcdt: function () {

                    return $api.consultaCdt.consultaDetalleXcdt({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        codNumBanco: $scope.cdtSeleccionado.valNumeroCDT
                    });

                },

                reinversionCdtSolicitud: function (beneficiarios) {

                    // modificar el arreglo de beneficiarios para enviarlo al sericio
                    $scope.arrBeneficiarios = [];

                    angular.forEach(beneficiarios, function (obj, i) {

                        $scope.arrBeneficiarios.push({
                            codTipoDocumento: obj.codTipoDocumento,
                            valDocumento: obj.codClienteBeneficiarioTitular,
                            codRol: obj.codRolCliente,
                            codCondicion: obj.valCondicion,
                            codTipo: obj.codTipoCliente
                        });

                    });

                    return $api.consultaCdt.reinversionCdtSolicitud({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        contextoRequerimiento: {
                            idTransaccional: CONFIG.rowId
                        },
                        informacionReinversion: {
                            valNumeroCDT: $scope.cdtSeleccionado.valNumeroCDT,
                            codNumBancoSimulacion: $scope.proyeccion.valNumeroCDT, // simulacion valnumeroCDT
                            valIncrementoDecremento: $scope.simulacion.diferenciaValores >= 0 ? $scope.simulacion.diferenciaValores : Number($scope.simulacion.diferenciaValores.toString().split('-')[1]), // diferencia entre los valores de reinversion y el actual, debe ir positiva
                            valOperadorIncreDecre: $scope.simulacion.diferenciaValores < 0 ? '-' : '+',
                            codCapitaliza: $scope.simulacion.interes == 'Si' ? 'S' : 'N',
                            valPuntos: $scope.simulacion.tasaAtribucion ? Number($scope.simulacion.tasaAtribucion) - Number($scope.simulacion.tasaCartelera) : '0.00',
                            codAgenteVendedor: $rootScope.$data.codAgenteVendedor,
                            codOficinaSiebel: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                            indicadorSolicitudReinversion: $scope.simulacion.diferenciaValores == 0 ? 'S' : 'N'
                        },
                        beneficiarios: $scope.arrBeneficiarios,
                        movimientosMonetarios: $scope.requesObjMovimientos,
                        detallesPagos: [{
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codFormaPago: ($scope.simulacion ? ($scope.simulacion.interes ? ($scope.simulacion.interes == 'Si') : false) : false) ? 'CTRL' : (($scope.reinversion ? ($scope.reinversion.formaPago ? ($scope.reinversion.formaPago.codigo ? ($scope.reinversion.formaPago.codigo == '2') : false) : false) : false) ? 'EFEC' : ($scope.reinversion.cuentaFormaPago ? $scope.reinversion.cuentaFormaPago.tipo : null)),
                            valCuentaCliente: (($scope.reinversion ? ($scope.reinversion.formaPago ? ($scope.reinversion.formaPago.codigo ? $scope.reinversion.formaPago.codigo == '2' : false) : false) : false) || ($scope.simulacion ? ($scope.simulacion.interes ? $scope.simulacion.interes == 'Si' : false) : false)) ? undefined : ($scope.reinversion.cuentaFormaPago ? $scope.reinversion.cuentaFormaPago.value : null),
                            // codFormaPago: $scope.reinversion.formaPago.codigo == '1' ? $scope.reinversion.cuentaFormaPago.tipo : 'EFEC',
                            // valCuentaCliente: $scope.reinversion.formaPago.codigo != '1' ? undefined : $scope.reinversion.cuentaFormaPago.value,
                            codMonedaPago: '0',
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                            valPorcentajePago: '100',
                            codPeriocidadPago: $scope.simulacion.frecuenciaCod // periocidad seleccionada
                        }],
                        detalleCheques: $scope.requesObjDetalleCheques.length > 0 ? $scope.requesObjDetalleCheques : undefined
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */


        }

    ]);

});
