/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('cdatCtrlBiometric', ['$scope', '$rootScope', 'CONFIG', 'lovs', '$api', '$slm-dialog', '$utilities', '$filter', '$spaUtils', function ($scope, $rootScope, CONFIG, lovs, $api, $dialog, $utilities, $filter, $spaUtils) {

        /* ------------------------------------------------------------------------------------------
         | INIT
         -------------------------------------------------------------------------------------------- */
        $scope.$on('$viewContentLoaded', function (event) {

            $scope.content = 'Content from biometricCDATCtrl';
            $scope.constitucion = $rootScope.constitucion;
            $scope.consultaCDTCDAT = $rootScope.consultaCDTCDAT;
            $scope.simulacion = $rootScope.simulacion;
            $scope.proyeccion = $rootScope.proyeccion;
            $scope.cliente = $rootScope.CLIENT.CLIENTE;

        });

        /* ------------------------------------------------------------------------------------------
         | SETUP
         -------------------------------------------------------------------------------------------- */
        var date = new Date();
        var dateFormat;
        var hourFormat;

        dateFormat = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        hourFormat = ('0' + (date.getHours())).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);

        $scope.fecha = dateFormat;
        $scope.hora = hourFormat;

        $scope.enviado = false;

        $scope.lovs = lovs;
        // huella capturada
        $scope.biometricData = {};
        $scope.datos = {
            emailCliente: ''
        };
        // captions
        $scope.caption = {
            firmaDigital: 'Envíe la condiciones pactadas en el producto al correo que el cliente determine: <br> <label gui="label-inline"> <gs col-push="x-2|md-6"><label gui="label-inline"><span>Correo electrónico:</span> <input gui="input-control" ng-change="$gui.timerEmail(emailCliente);" ng-model="emailCliente" gui-validate="" rules="{&quot;required&quot;: true&quot;, &quot;email&quot;: true&quot;}" text-align="right" chars="email"></label></gs></label>'
        };

        $scope.casbData = $spaUtils.compareBiometric(2) ? $rootScope.autenticacion : undefined;

        $scope.llamadoConstitucion = 0;
        $scope.mensajeConstitucion = "";

        $scope.diferencia = Number($rootScope.simulacion.valorReinvertir) - Number($rootScope.simulacion.valorActualHomologado);
        // quitar el currency del valor actual
        var valorActualSinPesos = $scope.consultaCDTCDAT.valorInicial.replace('$', ''),
            valorActualSinCurrency = valorActualSinPesos.replace(/,/g, '');

        // Homologar el tipo de identificacion

        var tipoIdentificacion;

        if (CONFIG.idType == 1) {

            tipoIdentificacion = 'CC';

        } else if (CONFIG.idType == 2) {

            tipoIdentificacion = 'CE';

        }

        /* ------------------------------------------------------------------------------------------
         | GUI FUNCTIONS
         -------------------------------------------------------------------------------------------- */

        $scope.$gui = {

            bioCapture: function (data) {

                $scope.biometricData = data;

                // si la huella es correcta se consume el servicio de constitucionCDAT
                if (data.base64 && (!$spaUtils.compareBiometric(2) ? true : data.autenticado)) {

                    $scope.$api.reinversionCdat().then(function (resp) {

                        $spaUtils.disableProduct('2');

                        $scope.llamadoConstitucion = 1;
                        $scope.aperturaCdAT = resp.data;
                        $scope.aperturaCdAT.fecha = resp.data.confirmacionReinversion.fecFechaAprobacionHomologado.split('T')[0];
                        $scope.aperturaCdAT.hora = resp.data.confirmacionReinversion.fecFechaAprobacionHomologado.split('T')[1];
                        $scope.mensajeConstitucion = "La reinversión del CDAT Virtual ha sido exitosa, le recuerdo que el número del producto es: " + $scope.consultaCDTCDAT.numeroCompletoCDAT;

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

            reinversionCdat: function () {

                return $api.Cdat.reinversionCdat({
                    rowId: CONFIG.rowId,
                    oficinaTotal: '6322',
                    usuario: CONFIG.usuario,
                    contextoRequerimiento: {
                        idTransaccional: CONFIG.rowId
                    },
                    informacionReinversion: {
                        valProductoRPR: '0510',
                        valSubproductoRPR: '5160',
                        valNumeroCDT: $scope.consultaCDTCDAT.numeroCompletoCDAT, // numero cdat constituido
                        codNumBancoSimulacion: $rootScope.proyeccion.valNumeroCDT, // simulacion valnumeroCDT
                        // valPuntosAdicionalesTasa: '',
                        valIncrementoDecremento: $scope.diferencia >= 0 ? $scope.diferencia : $scope.diferencia.toString().split('-')[1], // diferencia entre los valores de reinversion y el actual, debe ir positiva
                        valOperadorIncreDecre: $scope.diferencia < 0 ? '-' : '+',
                        valMontoOrigen: valorActualSinCurrency.split('.')[0], // tolt inversion
                        codCompania: '0090', // conulsta prodcutos cod cokmpania ????????????????????????????????????????????????????????????????????? u.u
                        codCapitaliza: $scope.consultaCDTCDAT.tipoDeNegocio == 'CAPITALIZABLE' ? 'S' : 'N',
                        codOficinaSiebel: CONFIG.oficina.slice(-4),
                        codAgenteVendedor: CONFIG.employee.davIdentificationNumber2
                    },
                    beneficiarios: [{
                        codTipoDocumento: CONFIG.idType,
                        valDocumento: CONFIG.idNumber,
                        codRol: 'T',
                        codCondicion: 'O',
                        codTipo: 'T'
                    }],
                    movimientoMonetarios: [{
                        codTipoDocumento: CONFIG.idType,
                        idDocumento: CONFIG.idNumber,
                        codMoneda: $scope.simulacion.codMoneda, // cod moneda del cdat seleccionado
                        codProducto: $rootScope.constitucion.productoOrigen.tipo, // tipo cuenta Ahorros, corriente
                        valCuentaDebito: $rootScope.constitucion.productoOrigen.value, // num cuenta
                        valValorMovimiento: $rootScope.simulacion.valorReinvertir // ingresado en simulacion
                        // valSecuencialFormaPago: '1'
                    }],
                    detallePagos: [{
                        codTipoDocumento: CONFIG.idType,
                        idDocumento: CONFIG.idNumber,
                        codFormaPago: $scope.simulacion.interes == 'Si' ? $rootScope.constitucion.productoOrigen.tipo : $rootScope.constitucion.productoDestino.tipo,
                        valCuentaCliente: $scope.simulacion.interes == 'Si' ? $rootScope.constitucion.productoOrigen.value : $rootScope.constitucion.productoDestino.value, // si el cliente quiere capitalizar intereses la cuenta destino es la misma de origen
                        codMonedaPago: '0',
                        valPorcentajePago: '100',
                        codPeriocidadPago: $rootScope.simulacion.frecuenciaCod // periocidad seleccionada
                    }]

                });

            },

            generarDocumentos: function () {

                return $api.compartida.generacionDoc({
                    rowId: CONFIG.rowId.split('-')[1],
                    oficinaTotal: CONFIG.oficinaTotal,
                    session: "0",
                    paqueteDocId: 'REINVERSION_CDAT_360',
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
                            id: "{CDAT_No}",
                            valor: $scope.consultaCDTCDAT.numeroCompletoCDAT
                        }, {
                            id: "{Valor_Inversion}",
                            valor: '$' + $filter('number')($scope.simulacion.valorReinvertir)
                        }, {
                            id: "{Plazo_Meses}",
                            valor: Number($scope.proyeccion.valPlazoDias)
                        }, {
                            id: "{Tasa_EA}",
                            valor: $scope.proyeccion.valTasaEfectiva + '%'
                        }, {
                            id: "{Fecha_Vencimiento}",
                            valor: $scope.proyeccion.fecFechaVencimientoHomologado.toString().replace(/[/-]/g, '').replace(/(\d{4})(\d{2})(\d+)/, '$1-$2-$3')
                        }, {
                            id: "{Total_Rendimientos}",
                            valor: '$' + $filter('number')($scope.proyeccion.valTotalInteresesNeto)
                        }, {
                            id: "{Nombres}",
                            valor: $scope.cliente.Nombres + ' ' + $scope.cliente.PrimerApellido + ' ' + $scope.cliente.SegundoApellido
                        }, {
                            id: "{Tipo_Identificacion}",
                            valor: tipoIdentificacion
                        }, {
                            id: "{Numero_Identificacion}",
                            valor: $filter('formatIDNumber')(CONFIG.idNumber)
                        }, {
                            id: "{Fecha}",
                            valor: $scope.fecha
                        }, {
                            id: "{Hora}",
                            valor: $scope.hora
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
