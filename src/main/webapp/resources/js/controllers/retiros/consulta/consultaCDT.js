/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('consultaCDTCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        'CONFIG',
        '$timeout',
        '$slm-dialog',
        '$filter',
        '$state',
        'textos',
        '$utilities',
        function (
            $scope,
            $rootScope,
            $api,
            CONFIG,
            $timeout,
            $dialog,
            $filter,
            $state,
            textos,
            $utilities
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,
                nameSpace = $rootScope.account[$rootScope.routeApp['3']],
                checkCdt = 'autoriza-huella-endoso',
                // N si es natural o J si es juridica para hacer validaciones en el hotmail
                tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J',
                fechaSistema = $filter('date')(new Date(), 'dd/MM/yyyy');


            $scope.title = 'Novedades';
            if (CONFIG.persona == 'natural' || CONFIG.naturalConNegocio) {

                $scope.icon = 'fa-user-circle';
                $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            } else {

                $scope.icon = 'fa-building';
                $scope.extract = CLIENTE.Name;

            }
            $scope.lovs = nameSpace.lovs;
            $scope.listas = $scope.lovs;
            $scope.lovs.lov_email = {};
            $scope.lovs.lov_email = angular.copy(PERSONA.EMAILS);
            $scope.lovs.lov_email.push({
                Email: "Otro"
            });
            nameSpace.textos = textos;
            $scope.textos = nameSpace.textos;
            $scope.user = {
                mail: ''
            };
            $scope.novedad = {};
            $scope.historial = [];
            $scope.cdt = {};
            $scope.detalle = {};
            $scope.beneficiarios = [];
            $scope.cdts = [];
            $scope.detalleCDT = false;
            $scope.firmas = false;
            $scope.extractos = {
                data: false,
                registros: [],
                fechaMayor: '00/0000'
            };
            nameSpace.cdtSeleccionado = [];
            $scope.checks = {
                tabla: '',
                registros: {}
            };
            $scope.indicadorCarga = false;

            $scope.captionService = {
                tipoCaption: 'attention',
                mensaje: 'No fue posible realizar la consulta, por favor intente nuevamente',
                estado: false
            };

            // captions
            $scope.caption = {
                intereses: 'Si el CDT tiene intereses pendientes, acompañe al cliente a Caja para realizar el pago.',
                attention: 'Certificación Comercial No Disponible'
            };
            $scope.listaDocumentosXCDT = [];

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {
                obtenerCdt: function (cdt) {

                    $scope.cdtSeleccionado = cdt;

                },

                guardarInfo: function () {

                    angular.forEach($scope.cdts, function (val) {

                        nameSpace.cdtSeleccionado.push(val);

                    });

                },

                consultarDetalle: function (index, cdts, cdt) {

                    $scope.beneficiarios = [];
                    $scope.$gui.guardarInfo();
                    $scope.detalle = cdt;
                    $scope.$program.consultaDetalleXcdt();

                    $scope.detalleCDT = true;

                    angular.forEach(cdts, function (cdt) {

                        if (cdt.on) {

                            cdt.on = false;

                        }

                    });


                    cdt.on = true;

                },

                historialPagos: function () {

                    $scope.firmas = true;
                    $scope.$api.consultaCdtXEstado().then(function (response) {

                        $scope.historial = response.data.registros;
                        angular.forEach(response.data.registros, function (registro, i) {

                            // si es ACT y fecVencimientoOperacion diferente de la actual no se muestra
                            if ((registro.valEstado == 'ACT' && registro.fecVencimientoOperacionHomologado == fechaSistema) || registro.valEstado == 'VEN') {

                                // validaciones para definir el Subestado
                                if (registro.valBloqueoLegal && registro.valBloqueoLegal == 'S') {

                                    registro.subEstado = 'EMBARGADO';

                                } else if (registro.valBloqueoNovedades && registro.valBloqueoNovedades == 'S') {

                                    registro.subEstado = 'BLOQUEADO ' + (registro.valDescCausalBloqueo ? registro.valDescCausalBloqueo : '');

                                } else if (registro.valDescAccionSiguiente && registro.valDescAccionSiguiente == 'POR CANCELAR') {

                                    registro.subEstado = 'INSTRUCCIÓN DE CANCELACIÓN';

                                } else if (registro.valProductoEnGarantia && registro.valProductoEnGarantia == 'S') {

                                    registro.subEstado = 'EN GARANTÍA';

                                }

                            }

                        });

                    });


                }

            };


            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$program = {

                consultaFileNet: function (valIdDocumento) {

                    $scope.$api.consultarDocumentoFileNet(valIdDocumento).then(function (response) {

                        if (response.data) {

                            if (response.data.caracterAceptacion === "B" && response.data.valContenido) {

                                var validador = false;

                                if (response.data) {

                                    if (response.data.contextoRespuesta) {

                                        if (response.data.contextoRespuesta.resultadoTransaccion) {

                                            validador = response.data.contextoRespuesta.resultadoTransaccion.valCaracterAceptacion || false;

                                        }

                                    }

                                }

                                if (validador == 'B') {

                                    let ventana = window.open("", "_blank", "");

                                    ventana.document.write('<object width="100%" height="100%" data="data:application/pdf;base64,' + response.data.valContenido + '" type="application/pdf" download></object>');

                                } else {

                                    $dialog.open({
                                        status: 'error',
                                        content: response.headers("Respuesta") || 'No fue posible realizar la transaccion del documento, por favor intente nuevamente'
                                    });

                                }

                            } else {

                                $dialog.open({
                                    status: 'error',
                                    content: 'No fue posible realizar la consulta del documento, por favor intente nuevamente'
                                });

                            }

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>200</b><br>Intente Nuevamente'
                            });

                        }

                    }, function (response) {

                        $dialog.open({
                            status: 'error',
                            content: response.headers("Respuesta") || 'No fue posible realizar la consulta del documento, por favor intente nuevamente'
                        });

                    });

                },

                buscarDocActual: function () {

                    var valIdDocumento = 0;
                    var validador = $scope.listaDocumentosXCDT ? ($scope.listaDocumentosXCDT.length != 0) : false;

                    if (validador) {

                        angular.forEach($scope.listaDocumentosXCDT, function (value) {

                            angular.forEach(value, function (value2) {

                                if (value2.valLlave == "documentTitle") {

                                    if (value2.valValor) {

                                        if (Number(value2.valValor.split("_")[2].split(".")[0]) > valIdDocumento) {

                                            valIdDocumento = Number(value2.valValor.split("_")[2].split(".")[0]);

                                        }

                                    }

                                }

                            });

                        });
                        var tokenEncontrado = -1;
                        angular.forEach($scope.listaDocumentosXCDT, function (valor, key) {

                            angular.forEach(valor, function (valor2) {

                                if (valor2.valLlave == "documentTitle" && Number(valor2.valValor.split("_")[2].split(".")[0]) == valIdDocumento) {

                                    tokenEncontrado = key;

                                }

                            });

                        });

                        if (valIdDocumento != 0 && tokenEncontrado != -1) {

                            var idHomologo = '0';

                            angular.forEach($scope.listaDocumentosXCDT[tokenEncontrado], function (cdtDoc) {

                                if (cdtDoc.valLlave == "Id") {

                                    idHomologo = cdtDoc.valValor ? cdtDoc.valValor : 0;

                                }



                            });

                            if (idHomologo == '0') {

                                $dialog.open({
                                    status: 'attention',
                                    content: 'Ha ocurrido un error obteniendo el ID del documentos'
                                });

                            } else {

                                $scope.$program.consultaFileNet(idHomologo);

                            }



                        } else {

                            $dialog.open({
                                status: 'attention',
                                content: 'CDT sin documentos'
                            });

                        }


                    } else {

                        $dialog.open({
                            status: 'attention',
                            content: 'CDT sin documentos'
                        });

                    }

                },

                consultarDoc: function (cdt) {

                    $scope.listaDocumentosXCDT = [];

                    $scope.$api.consultarDocumento().then(function (response) {


                        if (response.data) {

                            if (response.data.caracterAceptacion === "B" && response.data.codMsgRespuesta == "0") {

                                var validador = false;

                                if (response.data) {

                                    if (response.data.contextoRespuesta) {

                                        if (response.data.contextoRespuesta.resultadoTransaccion) {

                                            validador = response.data.contextoRespuesta.resultadoTransaccion.valCaracterAceptacion || false;

                                        }

                                    }

                                }


                                if (validador == 'B') {

                                    var listaDocumentos = [];

                                    if (response.data) {

                                        listaDocumentos = response.data.listaDocumentos ? response.data.listaDocumentos : [];

                                    }

                                    if (listaDocumentos.length != 0) {

                                        var documentoFinal = "";
                                        angular.forEach(listaDocumentos, function (documentos) {

                                            var validador2 = documentos.documentos ? (documentos.documentos.length != 0) : false;
                                            if (validador2) {

                                                angular.forEach(documentos.documentos, function (documento) {

                                                    var dataDoc = documento.propiedads ? (documento.propiedads.length != 0) : false;
                                                    if (dataDoc) {

                                                        angular.forEach(documento.propiedads, function (documentoBuscador) {

                                                            if (documentoBuscador.valLlave == "documentTitle") {

                                                                var token = documentoBuscador.valValor ? (documentoBuscador.valValor.split("_")[0]) : "";
                                                                if (token == cdt.valNumeroCDT) {

                                                                    $scope.listaDocumentosXCDT.push(documento.propiedads);

                                                                }

                                                            }

                                                        });

                                                    }

                                                });

                                            }

                                        });
                                        $scope.$program.buscarDocActual(); // aqui

                                    } else {

                                        $dialog.open({
                                            status: 'attention',
                                            content: 'CDT sin documentos'
                                        });

                                    }



                                } else {

                                    $dialog.open({
                                        status: 'error',
                                        content: response.headers("Respuesta") || 'No fue posible realizar la transaccion del documento, por favor intente nuevamente'
                                    });

                                }



                            } else {

                                $dialog.open({
                                    status: 'error',
                                    content: 'No fue posible realizar la consulta del documento, por favor intente nuevamente'
                                });

                            }

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>200</b><br>Intente Nuevamente'
                            });

                        }


                    }, function (response) {

                        $dialog.open({
                            status: 'error',
                            content: response.headers("Respuesta") || 'No fue posible realizar la consulta del documento, por favor intente nuevamente'
                        });

                    });

                },

                consultaCdtXEstado: function () {

                    $scope.cdts = [];
                    $scope.indicadorCarga = true;

                    $scope.$api.consultaCdtXEstado().then(function (response) {


                        if (response.data) {

                            if (response.data.caracterAceptacion === "B" && response.data.codMsgRespuesta == "0") {

                                var validadorCarga = response.data.registros ? (response.data.registros.length != 0) : false;

                                if (validadorCarga) {

                                    $scope.captionService.estado = false;
                                    $scope.captionService.tipoCaption = 'attention';
                                    $scope.captionService.mensaje = '';

                                    angular.forEach(response.data.registros, function (registro, i) {

                                        // si es ACT y fecVencimientoOperacion diferente de la actual no se muestra
                                        if ((registro.valEstado == 'ACT' && registro.fecVencimientoOperacionHomologado == fechaSistema) || registro.valEstado == 'VEN') {

                                            // validaciones para definir el Subestado
                                            if (registro.valBloqueoLegal && registro.valBloqueoLegal == 'S') {

                                                registro.subEstado = 'EMBARGADO';

                                            } else if (registro.valBloqueoNovedades && registro.valBloqueoNovedades == 'S') {

                                                registro.subEstado = 'BLOQUEADO ' + (registro.valDescCausalBloqueo ? registro.valDescCausalBloqueo : '');

                                            } else if (registro.valDescAccionSiguiente && registro.valDescAccionSiguiente == 'POR CANCELAR') {

                                                registro.subEstado = 'INSTRUCCIÓN DE CANCELACIÓN';

                                            } else if (registro.valProductoEnGarantia && registro.valProductoEnGarantia == 'S') {

                                                registro.subEstado = 'EN GARANTÍA';

                                            }

                                        }

                                        $scope.cdts.push(registro);

                                    });
                                    $scope.indicadorCarga = false;

                                } else {

                                    $dialog.open({
                                        status: 'error',
                                        content: 'Consulta sin registros'
                                    });
                                    $scope.cdts = [];
                                    $scope.indicadorCarga = false;
                                    $scope.captionService.estado = true;
                                    $scope.captionService.tipoCaption = 'error';
                                    $scope.captionService.mensaje = 'No fue posible realizar la consulta, por favor intente nuevamente';

                                }

                            } else {

                                $dialog.open({
                                    status: 'error',
                                    content: 'Ha ocurrido un error inesperado'
                                });
                                $scope.cdts = [];
                                $scope.indicadorCarga = false;
                                $scope.captionService.estado = true;
                                $scope.captionService.tipoCaption = 'error';
                                $scope.captionService.mensaje = 'No fue posible realizar la consulta, por favor intente nuevamente';

                            }



                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>200</b><br>Intente Nuevamente'
                            });
                            $scope.cdts = [];
                            $scope.indicadorCarga = false;
                            $scope.captionService.estado = true;
                            $scope.captionService.tipoCaption = 'error';
                            $scope.captionService.mensaje = 'No fue posible realizar la consulta, por favor intente nuevamente';

                        }

                    }, function (response) {

                        $dialog.open({
                            status: 'error',
                            content: response.headers("Respuesta") || 'No fue posible realizar la consulta, por favor intente nuevamente'

                        });
                        $scope.cdts = [];
                        $scope.indicadorCarga = false;
                        $scope.captionService.estado = true;
                        $scope.captionService.tipoCaption = 'error';
                        $scope.captionService.mensaje = 'No fue posible realizar la consulta, por favor intente nuevamente';

                    });

                },
                consultaDetalleXcdt: function () {

                    $scope.$api.consultaDetalleXcdt().then(function (response) {

                        var validadorCodCapitalizaIntereses = false;
                        if ($scope.detalle.codCapitalizaIntereses) {

                            if ($scope.detalle.codCapitalizaIntereses == 'S') {

                                validadorCodCapitalizaIntereses = true;

                            }

                        }

                        if (validadorCodCapitalizaIntereses) {

                            $scope.detalle.valDescPagoHomologo = 'CAPITALIZABLE';

                        } else {

                            var validador = false;

                            if (response.data) {

                                if (response.data.detallePagos) {

                                    validador = response.data.detallePagos.length != 0;

                                }

                            }

                            $scope.valFormaPagoHomologo = '';
                            $scope.valCuentaClienteStratus = '';

                            if (validador) {

                                $scope.valFormaPagoHomologo = response.data.detallePagos[0].valFormaPago ? response.data.detallePagos[0].valFormaPago : '';

                                if (response.data.detallePagos[0].valCuentaClienteStratus) {

                                    var toStringValCuentaClienteStratus = response.data.detallePagos[0].valCuentaClienteStratus.toString();
                                    $scope.valCuentaClienteStratus = toStringValCuentaClienteStratus ? response.data.detallePagos[0].valCuentaClienteStratus : '';

                                }

                                if ($scope.valFormaPagoHomologo) {

                                    if ($scope.valFormaPagoHomologo && $scope.valFormaPagoHomologo == 'EFEC') {

                                        $scope.detalle.valDescPagoHomologo = 'EFECTIVO';

                                    } else {

                                        var validadorValFormaPagoHomologo = Boolean($scope.valFormaPagoHomologo == 'AHO' || $scope.valFormaPagoHomologo == 'CTE');

                                        $scope.detalle.valDescPagoHomologo = validadorValFormaPagoHomologo ? ('CUENTA DAVIVIENDA ' + $scope.valCuentaClienteStratus.slice(-4)) : '';

                                    }

                                }

                            }

                        }





                        angular.forEach(response.data.beneficiarios, function (registro) {

                            $scope.beneficiarios.push(registro);

                        });
                        $scope.titularFilter = {
                            titular: $filter('filter')($scope.beneficiarios, {
                                codTipoCliente: 'T',
                                codRolCliente: 'T'

                            })[0]
                        };

                        $scope.beneficiarioFilter = [];


                        $scope.beneficiarioFilter = {
                            beneficiario: $filter('filter')($scope.beneficiarios, {
                                codTipoCliente: '!T',
                                codRolCliente: '!T'
                            })
                        };


                    }, function (response) {

                        if (response.status !== 417) {

                            $dialog.open({
                                status: 'error',
                                content: 'Ha ocurrido un error inesperado'
                            });

                        }

                    });

                },
                consultaExtracto: function () {

                    $scope.extractos.registros = [];
                    $scope.$api.extractosDisponibles().then(function (response) {

                        if (response.data) {

                            if (response.data.regtros.length) {

                                if (response.data.caracterAceptacion === 'B' && response.data.codMsgRespuesta == '0') {

                                    $scope.extractos.registros = response.data.regtros;
                                    $scope.extractos.data = $scope.extractos.registros.length;
                                    var maxDateAge = [];
                                    var primerValorFecha = $scope.extractos.registros[0].ano; // 2018

                                    // Mayor age
                                    angular.forEach($scope.extractos.registros, function (value) {

                                        if (primerValorFecha < value.ano) {

                                            primerValorFecha = value.ano;

                                        }

                                    });

                                    angular.forEach($scope.extractos.registros, function (value) {

                                        if (value.ano == primerValorFecha) {

                                            maxDateAge.push(value);

                                        }

                                    });

                                    // Ya he ordenado por fecha, ahora busco el mayor mes
                                    angular.forEach($scope.extractos.registros, function (value) {

                                        if (value.ano == primerValorFecha) {

                                            maxDateAge.push(value);

                                        }

                                    });

                                    /**
                                     * Buscar mayor mes
                                     */
                                    var primerValorFechaMes = maxDateAge[0].mes; // $scope.extractos.fechaMayor
                                    angular.forEach(maxDateAge, function (value) {

                                        if (primerValorFechaMes < value.mes) {

                                            primerValorFechaMes = value.mes;

                                        }

                                    });

                                    angular.forEach($scope.extractos.registros, function (value) {

                                        if (value.ano == primerValorFecha && value.mes == primerValorFechaMes) {

                                            $scope.extractos.fechaMayor = value;

                                        }

                                    });

                                } else {

                                    $dialog.open({
                                        status: 'error',
                                        content: response.data.msgRespuesta
                                    }).then(function () {

                                        $scope.extractos.registros = [];

                                    });

                                }

                            } else {

                                $scope.extractos.data = false;

                            }

                        }

                    }, function (response) {

                        if (response.status == 417) {

                            $dialog.open({
                                status: 'error',
                                content: response.headers("Respuesta") || 'No fue posible realizar la consulta, por favor intente nuevamente'
                            });

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>' + response.status + '</b><br>Intente Nuevamente'
                            });

                        }

                    });

                },
                enviarExtractosMail: function () {

                    var periodo = $scope.extractos.fechaMayor.ano + $scope.extractos.fechaMayor.mes;

                    var email = $scope.user.mail.Email == "Otro" ? $scope.user.mail.otro : $scope.user.mail.Email;

                    $scope.$api.enviarExtractosMail(email, periodo).then(function (response) {

                        if (response.data) {

                            if (response.data.caracterAceptacion === 'B' && response.data.codMsgRespuesta == '0') {

                                $dialog.open({
                                    status: 'success',
                                    content: 'Se envío correctamente el Email.'
                                });

                            } else {

                                $dialog.open({
                                    status: 'error',
                                    content: response.data.msgRespuesta
                                });

                            }


                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>200</b><br>Intente Nuevamente'
                            });

                        }



                    }, function (response) {

                        if (response.status == 417) {

                            $dialog.open({
                                status: 'error',
                                content: response.headers("Respuesta") || 'No fue posible realizar el envío, por favor intente nuevamente'
                            });

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>' + response.status + '</b><br>Intente Nuevamente'
                            });

                        }

                    });

                },
                ejecutarExtracto: function (tipo) {

                    if (tipo == 'email') {

                        $scope.$program.enviarExtractosMail();

                    } else if (tipo == 'pdf') {

                        var periodo = $scope.extractos.fechaMayor.ano + '-' + $scope.extractos.fechaMayor.mes + '-01T00:00:00';
                        var numCDT = $scope.detalle.valNumeroCDT;
                        $scope.$api.obtenerExtractosPdf(numCDT, periodo);

                    }

                }

            };


            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {
                consultarDocumentoFileNet: function (valIdDocumento) {

                    return $api.reportes.consultaDocsFileNet({
                        rowId: CONFIG.rowId.split("-")[1],
                        usuario: CONFIG.usuario,
                        idConsumidor: "PRTTRN_CACHE",
                        idAplicacion: "SRVEMP_CACHE",
                        valIdDocumento: valIdDocumento,
                        valOrigenPeticion: "90.5.23.67",
                        idHost: "0",
                        oficinaTotal: CONFIG.oficina
                    });

                },
                consultarDocumento: function () {

                    return $api.reportes.linkQueryFileNet({
                        rowId: CONFIG.rowId.split("-")[1],
                        usuario: CONFIG.usuario,
                        idConsumidor: "PRTTRN_CACHE",
                        idAplicacion: "SRVEMP_CACHE",
                        select: "This:This;Id:ID;tipoDocumento:STRING;DateCreated:DATE;fechaExpedicion:DATE;numeroIdentificacion:STRING;tipoIdentificacion:STRING;documentTitle:STRING",
                        from: "[Acuerdo]",
                        where: "[numeroIdentificacion] = '" + CONFIG.idNumber + "' AND [tipoDocumento] = 'AprobacionCDT'",
                        valOrigenPeticion: "90.5.23.67",
                        idHost: "90.5.23.67",
                        listaParametros: [{
                            valValor: "",
                            valLlave: ""
                        }],
                        oficinaTotal: CONFIG.oficina
                    });

                },

                consultaCdtXEstado: function () {

                    return $api.consultaCdt.consultaCdtXEstado({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficina,
                        codEstado: 'ACT,VEN',
                        codTipoDocumento: CONFIG.idType,
                        valNumeroDocumento: CONFIG.idNumber
                    });

                },
                consultaDetalleXcdt: function () {

                    return $api.consultaCdt.consultaDetalleXcdt({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficina,
                        codNumBanco: $scope.detalle.valNumeroCDT
                    });

                },
                extractosDisponibles: function (numeroProducto, codigoProducto) {

                    return $api.extractos.extractosDisponibles({
                        rowId: CONFIG.rowId,
                        tipoConsulta: CONFIG.tipoConsulta,
                        subTipoConsulta: CONFIG.subTipoConsulta,
                        clasificacion: '0',
                        motivoConsulta: CONFIG.motivoConsulta,
                        usuario: CONFIG.usuario,
                        perfil: CONFIG.perfil,
                        numeroProducto: $scope.detalle.valNumeroCDT.slice(-12),
                        codigoProducto: '5160', // 5160 o 5260??
                        oficinaTotal: CONFIG.oficinaTotal
                    });

                },
                enviarExtractosMail: function (email, periodo) {

                    return $api.extractos.enviarExtractosMail({
                        rowId: CONFIG.rowId,
                        tipoConsulta: CONFIG.tipoConsulta,
                        subTipoConsulta: CONFIG.subTipoConsulta,
                        clasificacion: '0',
                        motivoConsulta: CONFIG.motivoConsulta,
                        usuario: CONFIG.usuario,
                        perfil: CONFIG.perfil,
                        numeroProducto: $scope.detalle.valNumeroCDT.slice(-12),
                        codigoProducto: '5160', // 5160 o 5260??
                        periodo: periodo,
                        correoElect: email,
                        indicador: CONFIG.idNumber,
                        oficinaTotal: CONFIG.oficinaTotal
                    });

                },
                obtenerExtractosPdf: function (numCDT, periodo) {

                    window.open('api/extractos/generaPdf?fechaInicio=' + periodo +
                        '&fechaOperacion=0&idServicio=DocumentosCliente&idSession=0&idTransaccion=' + CONFIG.rowId +
                        '&valJornada=0&codMoneda=COP&codPais=CO&codIdioma=ES&idConsumidor=PRTTRN_EMPRESARIAL_BANCO&idAplicacion=SRVDOCUMENTOS_CLIENTE&idCanal=1&idHost=DocumentosCliente&idTerminal=997024&valOrigenPeticion=0&codUsuario=' + CONFIG.usuario +
                        '&valPerfil=0&valLlave=5160' +
                        '&valValor=' + numCDT.slice(-12) +
                        '&valFormatoSalida=0001' +
                        '&valTipoRespuesta=ARCHIVO');

                }

            };


            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            // hace el llamado al servicio que llena la tabla de cdts
            $scope.$program.consultaCdtXEstado();

        }
    ]);

});
