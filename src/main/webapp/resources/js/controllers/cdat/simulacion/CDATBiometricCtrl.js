 /* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('cdatCtrlBiometric', [
        '$scope',
        '$rootScope',
        'CONFIG',
        'lovs',
        '$spaUtils',
        '$api',
        'actualizaSiebel',
        '$slm-dialog',
        '$utilities',
        '$filter',
        function (
            $scope,
            $rootScope,
            CONFIG,
            lovs,
            $spaUtils,
            $api,
            $siebel,
            $dialog,
            $utilities,
            $filter
        ) {

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

            var nameSpace = $rootScope.account[$rootScope.routeApp['2']];
            $scope.lovs = lovs;
            // huella capturada
            $scope.biometricData = {};

            $scope.cliente = $rootScope.CLIENT.CLIENTE;

            $scope.datos = {
                emailCliente: ''
            };
            // captions
            $scope.caption = {
                firmaDigital: 'Envíe la condiciones pactadas en el producto al correo que el cliente determine: <br> <label gui="label-inline"> <gs col-push="x-2|md-6"><label gui="label-inline"><span>Correo electrónico:</span> <input gui="input-control" ng-model="" gui-validate="" rules="{&quot;required&quot;: true&quot;}" text-align="right" chars="email"></label></gs></label>'
            };

            $scope.casbData = $spaUtils.compareBiometric(2) ? $rootScope.autenticacion : undefined;

            $scope.llamadoConstitucion = 0;
            $scope.mensajeConstitucion = "";

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
                    if (data.base64 && $spaUtils.compareBiometric(2) ? data.autenticado : true) {

                        $scope.$api.costitucionCdat().then(function (resp) {

                            $scope.aperturaCdAT = resp.data;

                            $spaUtils.disableProduct('2');
                            // $spaUtils.setCounter($rootScope.routeApp['2']); // Incrementa el contador de productos abiertos (2 para CDAT)
                            // REGISTRAMOS EN OBSERVACIONES DE SIEBEL EL NUMERO DE PRODUCTO CREADO
                            $siebel.actualizaSiebel({
                                customComments: '\n- Venta en Linea:\n\t- Numero de Producto Originado: ' + $scope.aperturaCdAT.valNumeroCDT + ' - ' + $rootScope.lov.lov_productos_venta_en_linea_obj['2'].desc
                            });


                            $scope.llamadoConstitucion = 1;
                            $scope.aperturaCdAT.fecha = resp.data.confirmacionDebito.fecFechaAprobacionHomologado.split('T')[0];
                            $scope.aperturaCdAT.hora = resp.data.confirmacionDebito.fecFechaAprobacionHomologado.split('T')[1];
                            $scope.mensajeConstitucion = "La apertura del CDAT Virtual ha sido exitosa, el número de producto es: " + $scope.aperturaCdAT.valNumeroCDT;

                        }, function (resp) {

                            $scope.aperturaCdAT = resp.data;

                            if ($scope.aperturaCdAT.valNumeroCDT) {

                                $spaUtils.disableProduct('2');
                                // $spaUtils.setCounter($rootScope.routeApp['2']); // Incrementa el contador de productos abiertos (2 para CDAT)
                                // REGISTRAMOS EN OBSERVACIONES DE SIEBEL EL NUMERO DE PRODUCTO CREADO
                                $siebel.actualizaSiebel({
                                    customComments: '\n- Venta en Linea:\n\t- Numero de Producto Originado: ' + $scope.aperturaCdAT.valNumeroCDT + ' - ' + $rootScope.lov.lov_productos_venta_en_linea_obj['2'].desc
                                });


                                $scope.llamadoConstitucion = 1;

                                if (resp.data.confirmacionDebito && resp.data.confirmacionDebito.fecFechaAprobacionHomologado) {

                                    $scope.aperturaCdAT.fecha = resp.data.confirmacionDebito.fecFechaAprobacionHomologado.split('T')[0];
                                    $scope.aperturaCdAT.hora = resp.data.confirmacionDebito.fecFechaAprobacionHomologado.split('T')[1];

                                }

                                $scope.mensajeConstitucion = "La apertura del CDAT Virtual ha sido exitosa, el número de producto es: " + $scope.aperturaCdAT.valNumeroCDT;

                            } else {

                                $scope.llamadoConstitucion = 2;
                                $scope.mensajeConstitucion = resp.data;

                            }



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

                costitucionCdat: function () {

                    return $api.Cdat.costitucionCdat({
                        rowId: CONFIG.rowId,
                        oficinaTotal: '6322',
                        usuario: CONFIG.usuario,
                        contextoRequerimiento: {
                            idTransaccional: 'ConstitucionCDaT'
                            // valDireccionIpConsumidor: ''
                        },
                        informacionCDT: {
                            valProductoRPR: '0510',
                            valSubproductoRPR: nameSpace.simulacion.codSubproductoRPR, // tipo de CdAT
                            valNumeroCDT: nameSpace.proyeccion.valNumeroCDT,
                            valPuntosAdicionalesTasa: '',
                            valCapitalizacion: nameSpace.simulacion.interes == 'No' ? 'N' : 'S', // Si o no quiere capitalizar...
                            codOficinaSiebel: CONFIG.oficina.slice(-4),
                            codAgenteVendedor: CONFIG.employee.davIdentificationNumber2
                        },
                        beneficiarios: [{
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codRol: 'T',
                            codCondicion: 'O',
                            codTipo: 'T'
                        }],
                        movimientosMonetarios: [{
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codMoneda: nameSpace.simulacion.codMoneda, // cod moneda del cdat seleccionado
                            codProducto: nameSpace.constitucion.productoOrigen.tipo, // tipo cuenta Ahorros, corriente
                            valCuentaDebito: nameSpace.constitucion.productoOrigen.value, // num cuenta
                            valValorMovimiento: nameSpace.simulacion.valorInversion, // ingresado en simulacion
                            valSecuencialFormaPago: '1'
                        }],
                        detallesPagos: [{
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codFormaPago: $scope.simulacion.interes == 'Si' ? nameSpace.constitucion.productoOrigen.tipo : nameSpace.constitucion.productoDestino.tipo,
                            valCuentaCliente: $scope.simulacion.interes == 'Si' ? nameSpace.constitucion.productoOrigen.value : nameSpace.constitucion.productoDestino.value, // si el cliente quiere capitalizar intereses la cuenta destino es la misma de origen
                            codMonedaPago: '0',
                            valPorcentajePago: '100',
                            codPeriocidadPago: nameSpace.simulacion.frecuenciaCod // periocidad seleccionada
                        }]

                    });

                },

                generarDocumentos: function () {

                    return $api.compartida.generacionDoc({
                        rowId: CONFIG.rowId.split('-')[1],
                        oficinaTotal: CONFIG.oficinaTotal,
                        session: "0",
                        paqueteDocId: 'APERTURA_CDAT_360',
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
                                valor: $scope.aperturaCdAT.valNumeroCDT
                            },
                            {
                                id: "{Valor_Inversion}",
                                valor: '$' + $filter('number')(nameSpace.simulacion.valorInversion)
                            },
                            {
                                id: "{Plazo_Meses}",
                                valor: Number(nameSpace.proyeccion.valPlazoDias)
                            },
                            {
                                id: "{Tasa_EA}",
                                valor: nameSpace.proyeccion.valTasaEfectiva + '%'
                            },
                            {
                                id: "{Fecha_Vencimiento}",
                                valor: nameSpace.proyeccion.fecFechaVencimientoHomologado.toString().replace(/[/-]/g, '').replace(/(\d{4})(\d{2})(\d+)/, '$1-$2-$3')
                            },
                            {
                                id: "{Total_Rendimientos}",
                                valor: '$' + $filter('number')(nameSpace.proyeccion.valTotalInteresesNeto)
                            },
                            {
                                id: "{Nombres}",
                                valor: $scope.cliente.Nombres + ' ' + $scope.cliente.PrimerApellido + ' ' + $scope.cliente.SegundoApellido
                            },
                            {
                                id: "{Tipo_Identificacion}",
                                valor: tipoIdentificacion
                            },
                            {
                                id: "{Numero_Identificacion}",
                                valor: $filter('formatIDNumber')(CONFIG.idNumber)
                            },
                            {
                                id: "{Fecha}",
                                valor: $scope.fecha
                            },
                            {
                                id: "{Hora}",
                                valor: $scope.hora
                            }
                            ],
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

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.content = 'Content from biometricCDATCtrl';
            $scope.constitucion = nameSpace.constitucion;
            $scope.simulacion = nameSpace.simulacion;
            $scope.proyeccion = nameSpace.proyeccion;


        }
    ]);

});
