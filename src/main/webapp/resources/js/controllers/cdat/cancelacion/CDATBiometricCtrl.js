/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('cdatCtrlBiometric', ['$scope', '$rootScope', 'CONFIG', 'lovs', '$api', '$slm-dialog', '$utilities', '$filter', '$spaUtils', function ($scope, $rootScope, CONFIG, lovs, $api, $dialog, $utilities, $filter, $spaUtils) {

        /* ------------------------------------------------------------------------------------------
         | INIT
         -------------------------------------------------------------------------------------------- */
        $scope.$on('$viewContentLoaded', function (event) {

            $scope.content = 'Content from biometricCDATCtrl';

        });

        /* ------------------------------------------------------------------------------------------
         | SETUP
         -------------------------------------------------------------------------------------------- */

        $scope.lovs = lovs;
        // huella capturada
        $scope.biometricData = {};
        $scope.consultaCDTCDAT = $rootScope.consultaCDTCDAT;
        $scope.constitucion = $rootScope.constitucion;
        $scope.simulacion = $rootScope.simulacion;
        $scope.proyeccion = $rootScope.proyeccion;
        $scope.cancelacion = $rootScope.cancelacion;
        $scope.cliente = $rootScope.CLIENT.CLIENTE;

        $scope.datos = {
            emailCliente: ''
        };

        $scope.enviado = false;
        // captions
        $scope.caption = {
            firmaDigital: 'Envíe la condiciones pactadas en el producto al correo que el cliente determine: <br> <label gui="label-inline"> <gs col-push="x-2|md-6"><label gui="label-inline"><span>Correo electrónico:</span> <input gui="input-control" ng-change="$gui.timerEmail(emailCliente);" ng-model="emailCliente" gui-validate="" rules="{&quot;required&quot;: true, &quot;email&quot;: true}" text-align="right" chars="email"></label></gs></label>'
        };

        $scope.casbData = $spaUtils.compareBiometric(2) ? $rootScope.autenticacion : undefined;

        $scope.llamadoConstitucion = 0;
        $scope.mensajeConstitucion = "";

        // quitar el currency del valor actual
        var valorActualSinPesos = $scope.consultaCDTCDAT.valorInicial.replace('$', ''),
            valorActualSinCurrency = valorActualSinPesos.replace(/,/g, '');

        /* ------------------------------------------------------------------------------------------
         | GUI FUNCTIONS
         -------------------------------------------------------------------------------------------- */

        $scope.$gui = {

            bioCapture: function (data) {

                $scope.biometricData = data;

                if (data.base64 && (!$spaUtils.compareBiometric(2) ? true : data.autenticado)) {

                    $scope.$api.cancelacionCdat().then(function (resp) {

                        $spaUtils.disableProduct('2');

                        $scope.llamadoConstitucion = 1;
                        $scope.aperturaCdAT = resp.data;
                        if (resp.data.confirmacionCredito && resp.data.confirmacionCredito.fecFechaAprobacionHomologado) {

                            $scope.aperturaCdAT.fecha = resp.data.confirmacionCredito.fecFechaAprobacionHomologado.split('T')[0];
                            $scope.aperturaCdAT.hora = resp.data.confirmacionCredito.fecFechaAprobacionHomologado.split('T')[1];

                        }
                        $scope.mensajeConstitucion = resp.data.msgRespuesta || "El CDAT Virtual ha sido cancelado exitosamente";

                    }, function (resp) {

                        $scope.llamadoConstitucion = 2;
                        $scope.mensajeConstitucion = resp.headers('Respuesta') || 'Ha ocurrido un error inesperado. Intente nuevamente';

                    });

                }

            },

            timerEmail: function () {

                if (/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test($scope.datos.emailCliente)) {

                    $dialog.open({
                        type: 'confirm',
                        content: 'El email ' + $scope.datos.emailCliente + ' es correcto?',
                        accept: function () {

                            $scope.$api.generarDocumentos().then(function (response) {

                                $dialog.open({
                                    status: 'success',
                                    content: '</b><br> Enviado correctamente',
                                    accept: function () {

                                        $scope.enviado = true;

                                    }
                                });


                            }, function (response) {

                                $dialog.open({
                                    status: 'error',
                                    content: '</b><br> Falló al generar documentos'
                                });

                            });

                        }

                    });


                }

            }


        };


        /* ------------------------------------------------------------------------------------------
         | PROGRAM FUNCTIONS
         -------------------------------------------------------------------------------------------- */

        /* ------------------------------------------------------------------------------------------
         | API FUNCTIONS
         -------------------------------------------------------------------------------------------- */

        $scope.$api = {

            cancelacionCdat: function () {

                return $api.Cdat.cancelacionCdat({
                    rowId: CONFIG.rowId,
                    oficinaTotal: '6322',
                    usuario: CONFIG.usuario,
                    contextoRequerimiento: {
                        idTransaccional: CONFIG.rowId
                    },
                    informacionCDT: {
                        valNumeroCDT: $scope.consultaCDTCDAT.numeroCompletoCDAT,
                        codCompania: '0090'
                    },
                    detallePagos: [{
                        codTipoDocumento: CONFIG.idType,
                        idDocumento: CONFIG.idNumber,
                        codFormaPago: $scope.cancelacion.tipo,
                        valCuentaCliente: $scope.cancelacion.value, // cuenta destino
                        codMonedaPago: '0',
                        valPorcentajePago: '100',
                        codPeriocidadPago: '' // enviar vacio
                    }],
                    movimientoMonetarios: [{
                        codTipoDocumento: CONFIG.idType,
                        idDocumento: CONFIG.idNumber,
                        codMoneda: '0',
                        codProducto: $scope.cancelacion.tipo,
                        valCuentaDebito: $scope.cancelacion.value, // cuenta destino
                        valValorMovimiento: $scope.consultaCDTCDAT.valorNetoPagar.replace('$', '').replace(/,/g, '')
                    }]

                });

            },

            generarDocumentos: function () {

                return $api.compartida.generacionDoc({
                    rowId: CONFIG.rowId.split('-')[1],
                    oficinaTotal: CONFIG.oficinaTotal,
                    session: "0",
                    paqueteDocId: 'CANCELACION_CDAT_360',
                    cliente: {
                        valTipoIdentificacion: CONFIG.idType,
                        valNumeroIdentificacion: CONFIG.idNumber,
                        valMail: $scope.datos.emailCliente || ($filter('filter')($rootScope.CLIENT.EMAILS, {
                            DAV_PrincipalEmail: 'Y'
                        })[0] || {
                            Email: ''
                        }).Email
                    },
                    parametros: {
                        parametro: [{
                            id: "{Nombres}",
                            valor: $scope.cliente.Nombres + ' ' + $scope.cliente.PrimerApellido + ' ' + $scope.cliente.SegundoApellido
                        }, {
                            id: "{CDAT_No}",
                            valor: $scope.consultaCDTCDAT.numeroCompletoCDAT
                        }, {
                            id: "{Valor_Cancelacion}",
                            valor: $scope.consultaCDTCDAT.valorNetoPagar
                        }, {
                            id: "{Cuenta_Translado}",
                            valor: $scope.cancelacion.value
                        }],
                        adjunto: [{
                            valNombre: "huella_registrada",
                            valContenido: $scope.biometricData.base64,
                            valTipo: "PNG"
                        }]
                    },
                    enviarCopiaCorreo: "true",
                    requiereClave: "true",
                    valClaveDocumento: CONFIG.idNumber
                });

            }

        };


    }]);

});
