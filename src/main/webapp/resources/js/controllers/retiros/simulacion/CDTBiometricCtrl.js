/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('cdtCtrlBiometric', [
        '$scope',
        '$rootScope',
        'CONFIG',
        '$spaUtils',
        '$api',
        'actualizaSiebel',
        '$slm-dialog',
        '$utilities',
        '$filter',
        '$timeout',
        function (
            $scope,
            $rootScope,
            CONFIG,
            $spaUtils,
            $api,
            $siebel,
            $dialog,
            $utilities,
            $filter,
            $timeout
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            var nameSpace = $rootScope.account[$rootScope.routeApp['3']];

            // N si es natural o J si es juridica para hacer validaciones en el hotmail
            $scope.tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';

            $scope.titulares = nameSpace.titulares;
            $scope.principal = nameSpace.principal;
            $scope.autorizado = nameSpace.autorizado;
            $scope.apertura = nameSpace.apertura;
            $scope.simulacion = nameSpace.simulacion;
            $scope.proyeccion = nameSpace.proyeccion;
            $scope.cheques = nameSpace.cheques;
            $scope.estado = {
                huellas: 'Verifique el registro de huellas',
                tipo: 'attention'
            };

            $scope.apoderado = {};
            $scope.apoderados = [];
            nameSpace.apoderados = [];
            $scope.personaBiometric = {};

            $scope.lovs = nameSpace.lovs;
            // huella capturada
            $scope.biometricData = {};
            $scope.autenticacion = {};

            // captions
            $scope.caption = {
                firmaDigital: 'Finalice la apertura en Caja, donde se activará el CDT y se hará entrega del título físico. Si no termina el proceso en Caja, el CDT se anulará de manera automática al finalizar el día.',
                confirmApertura: 'Una vez el sistema acepte la(s) huella(s) puede confirmar la apertura:'
            };

            $scope.llamadoConstitucion = 0;
            $scope.mensajeConstitucion = "";
            $scope.habilitaApoderado = false;
            $scope.habilitaBotonConfirmar = true;

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                bioCapture: function (data) {

                    $scope.biometricData = data;

                    var persona = $scope.personaBiometric,
                        tipoIdentificacion = persona.tipoIdentificacion.codigo.slice(0, 2);

                    persona.base64 = data.base64;
                    persona.huellaCapturada = data.base64 != '';

                    // SI ES APODERADO, SOLO SE VERIFICA QUE SE HAYA CAPTURADO UNA HUELLA
                    if (persona.hasApoderado) {

                        persona.autenticado = data.base64 != '';
                        persona.apoderado.huellaCapturada = data.base64 != '';

                        return;

                    }

                    // SI ES NIT, SIN APODERADO, CON AUTORIZADO CON CC
                    if (!persona.hasApoderado && tipoIdentificacion == '03' && persona.autorizado.IdentificationTypeCodeRel == '01') {

                        // SI NO ESTA ENROLADO O EL SERVICIO DE BYTTE FALLO
                        if (persona.autorizado.noEnrolada || persona.autorizado.errorCasb) {

                            persona.autenticado = data.base64 != '';

                        } else {

                            // persona.autenticado = data.autenticado;
                            persona.autenticado = data.base64 != '';

                        }

                        return;

                    }

                    if (tipoIdentificacion == '01' && !persona.noEnrolada && !persona.errorCasb) {

                        // persona.autenticado = data.autenticado;
                        persona.autenticado = data.base64 != '';

                        return;

                    }

                    persona.autenticado = data.base64 != '';

                },

                capturarHuella: function (persona, titular) {

                    $scope.$program.modalHuella.nombrePersona = persona.nombres || persona.razonsocial;
                    $scope.$program.modalHuella.active = false;
                    $scope.autenticacion = {};

                    $scope.personaBiometric = titular;

                    var tipoIdentificacion = persona.IdentificationTypeCodeRel || persona.tipoIdentificacion.codigo.slice(0, 2);

                    // llamar el servicio de autenticacion
                    if (tipoIdentificacion == '01' && !titular.hasApoderado) {

                        $scope.$program.modalHuella.active = true;

                        // $scope.$api.consultaCliente({
                        //     nroDocumento: persona.numIdentificacion || persona.IdentificationNumberRel
                        // }).then(function (resp) {
                        //
                        //     $scope.autenticacion = resp.data;
                        //     // cuando no esta enrolado
                        //     if (!resp.data.cLETEMPLATE) {
                        //
                        //         $dialog.open({
                        //             status: 'attention',
                        //             content: 'Cliente NO enrolado. Realice proceso de autenticación biométrica después de finalizar el proceso de apertura.'
                        //         }).then(function () {
                        //
                        //             persona.noEnrolada = true;
                        //
                        //         });
                        //
                        //     }
                        //
                        // }, function (resp) {
                        //
                        //     $dialog.open({
                        //         status: 'attention',
                        //         content: 'No se han podido consultar los datos enrolados del cliente. Verifique o realice proceso de autenticación biométrica después de finalizar el proceso de apertura.'
                        //     }).then(function () {
                        //
                        //         // si huellaCapturada viene null es porque no se le ha capturado huella y si viene en false es porque es una Empresa o si se capturo huella pero fallo la captura o la autenticacion
                        //         persona.errorCasb = true;
                        //
                        //     });
                        //
                        // }).finally(function () {
                        //
                        //     $scope.$program.modalHuella.active = true;
                        //
                        // });

                        return;

                    }

                    $timeout(function () {

                        $scope.$program.modalHuella.active = true;

                    });

                },

                crearCliente: function () {

                    $scope.$program.armarObjCreaActualiza();

                    $scope.$api.crearActualizarClienteCobis().then(function (resp) {

                        if (resp.data.caracterAceptacion == 'B' && resp.data.codMsgRespuesta == '0') {

                            $scope.$program.armarObjBeneficiarios();
                            $scope.$program.armarObjMovimientos();
                            $scope.$program.armarObjDetalleCheques();

                            // se llama el servicio de constitucion del CDT
                            $scope.$api.constitucionCdtSolicitud().then(function (resp) {

                                $scope.aperturaCDT = resp.data;

                                $spaUtils.disableProduct('3');

                                var traza = '';
                                var domiciliarioEncontrado = false;

                                angular.forEach($scope.titulares, function (titular, i) {

                                    var idHomologado = $filter('filter')($scope.lovs.lov_tipo_doc_bol, {
                                        codigo: titular.tipoIdentificacion.codigo.split('-')[0]
                                    })[0].desc;

                                    traza += '+' + idHomologado + ' ' + titular.numIdentificacion;

                                    if (!titular.apoderado.tipoIdentificacion) {

                                        if (titular.domiciliario) {

                                            domiciliarioEncontrado = true;
                                            traza += ':4';

                                        } else {

                                            traza += ':1';

                                        }

                                    } else if (titular.tipoIdentificacion.desc == 'NIT') {

                                        traza += ':5 - ' + titular.apoderado.numIdentificacion;

                                    } else if (titular.apoderado.tipo == 'A') {

                                        traza += ':2 - ' + titular.apoderado.numIdentificacion;

                                    } else {

                                        traza += ':3 - ' + titular.apoderado.numIdentificacion;

                                    }

                                });

                                // REGISTRAMOS EN OBSERVACIONES DE SIEBEL EL NUMERO DE PRODUCTO CREADO
                                $siebel.actualizaSiebel({
                                    customComments: '\n- Venta en Linea:\n\t- Numero de Producto Originado: ' + $scope.aperturaCDT.valNumeroCDT + ' - ' + $rootScope.lov.lov_productos_venta_en_linea_obj['3'].desc + ' - ' + traza
                                });

                                $scope.llamadoConstitucion = 1;
                                $scope.mensajeConstitucion = "LA APERTURA DEL CDT HA SIDO EXITOSA, EL NÚMERO DEL PRODUCTO ES: " + $scope.aperturaCDT.valNumeroCDT;
                                $scope.habilitaBotonConfirmar = false;

                                $scope.$program.filenet($scope.aperturaCDT.valNumeroCDT);

                                if (domiciliarioEncontrado) {

                                    $scope.$program.firmaDomiciliado($scope.aperturaCDT.valNumeroCDT);

                                }

                            }, function (resp) {

                                $scope.llamadoConstitucion = 2;
                                $scope.mensajeConstitucion = resp.data ? resp.data : "No fue posible realizar la creación del CDT, por favor intente nuevamente";

                            });

                        } else {

                            $scope.llamadoConstitucion = 2;
                            $scope.mensajeConstitucion = "No fue posible realizar la creación del CDT, por favor intente nuevamente";

                        }

                    }, function (resp) {

                        $scope.llamadoConstitucion = 2;
                        $scope.mensajeConstitucion = resp.headers("Respuesta") || "No fue posible realizar la creación del CDT, por favor intente nuevamente";

                    });


                },

                agregarApoderado: function (index, titular) {

                    titular.deshabilitarCaptura = true;
                    titular.deshabilitarApertura = true;
                    titular.huellaCapturada = false;
                    $scope.habilitaApoderado = true;

                    var apoderado = {
                            tipoIdentificacion: '',
                            numIdentificacion: '',
                            nombres: '',
                            indexTitular: index,
                            huellaCapturada: null
                        },
                        cliente = $scope.tipoCliente == 'N' && index != 'A' ? 'titular' : 'autorizado';

                    $scope.apoderados.push(apoderado);

                    switch (index) {

                        case 0 || 'A':

                            apoderado.numeroApoderado = 'Apoderado Primer ' + cliente;

                            break;

                        case 1:

                            apoderado.numeroApoderado = 'Apoderado Segundo ' + cliente;

                            break;

                        case 2:

                            apoderado.numeroApoderado = 'Apoderado Tercer ' + cliente;

                            break;

                        case 3:

                            apoderado.numeroApoderado = 'Apoderado Cuarto ' + cliente;

                            break;

                        case 4:

                            apoderado.numeroApoderado = 'Apoderado Quinto ' + cliente;

                            break;

                        default:

                            break;

                    }

                },

                removerApoderado: function (titular) {

                    $dialog.open({
                        type: 'confirm',
                        content: '¿Desea quitar este apoderado?',
                        accept: function () {

                            if (titular.apoderado.huellaCapturada) {

                                titular.autenticado = null;
                                titular.huellaCapturada = false;
                                titular.base64 = '';

                            }

                            titular.hasApoderado = false;
                            titular.apoderado = {};

                        }
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$program = {

                modalHuella: {
                    active: false,
                    title: ''
                },

                validadorCapturasHuellas: function () {

                    var huellasTitulares;
                    var huellasApoderados;
                    var total = $scope.titulares.length;
                    huellasTitulares = $filter('filter')($scope.titulares, {
                        autenticado: true
                    });
                    huellasApoderados = $filter('filter')($scope.apoderados, {
                        autenticado: true
                    });
                    if (total != 0) {

                        if (huellasTitulares.length + huellasApoderados.length == total) {

                            $scope.estado.huellas = "Tarjeta de firmas digitales creada correctamente";
                            $scope.estado.tipo = "success";

                        } else {

                            $scope.estado.huellas = "Verifique el registro de huellas";
                            $scope.estado.tipo = "attention";

                        }

                    } else {

                        $scope.estado.huellas = "Verifique el registro de huellas";
                        $scope.estado.tipo = "attention";

                    }


                },

                filenet: function (codCDT) {

                    $scope.$api.guardaPdfFilenet().then(function (response) {

                        if (response.data) {

                            if (response.data.caracterAceptacion === 'B' && response.data.codMsgRespuesta === '0') {

                                if (response.data.idPdf) {

                                    $scope.$api.fileNet(response.data.idPdf, codCDT).then(function (response) {

                                        if (response.data.caracterAceptacion === "B" && response.data.valIdDocumento) {

                                            $dialog.open({
                                                status: 'success',
                                                content: 'El documento se ha envíado a Filenet correctamente'
                                            });

                                        } else {

                                            $dialog.open({
                                                status: 'error',
                                                content: 'No fue posible generar el documento en Filenet, por favor intente nuevamente'
                                            });

                                        }

                                    }, function (response) {

                                        $dialog.open({
                                            type: 'error',
                                            content: response.headers("Respuesta") || 'No fue posible generar el documento en Filenet, por favor intente nuevamente'
                                        });

                                    });

                                } else {

                                    $dialog.open({
                                        status: 'error',
                                        content: 'No fue posible generar el PDF, por favor intente nuevamente'
                                    });

                                }

                            } else {

                                $dialog.open({
                                    type: 'confirm',
                                    content: 'Error al generar PDF, intente nuevamente'
                                });

                            }

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>200</b><br>Intente Nuevamente'
                            });

                        }

                    }, function (resposne) {

                        $dialog.open({
                            status: 'error',
                            content: 'Ha ocurrido un error inesperado',
                            accept: function () {}
                        });

                    });

                },

                firmaDomiciliado: function (codCDT) {

                    var titulares = [];

                    angular.forEach($scope.titulares, function (titular, i) {

                        var tipoTitular = '';

                        switch (i) {

                            case 0:
                                tipoTitular = 'Primer Titular:';
                                break;

                            case 1:
                                tipoTitular = 'Segundo Titular:';
                                break;

                            case 2:
                                tipoTitular = 'Tercer Titular:';
                                break;

                            case 3:
                                tipoTitular = 'Cuarto Titular:';
                                break;

                            case 4:
                                tipoTitular = 'Quinto Titular:';
                                break;

                            default:
                                break;

                        }



                        if (!titular.apoderado.tipoIdentificacion) {

                            if (titular.tipoIdentificacion.desc == 'NIT') {

                                tipoTitular += 'Autorizado ' + titular.tipoIdentificacion.desc + ' ' + titular.numIdentificacion;

                            }

                        } else if (titular.apoderado.tipo == 'A') {

                            tipoTitular += 'Apoderado ' + titular.tipoIdentificacion.desc + ' ' + titular.numIdentificacion;

                        } else {

                            tipoTitular += 'Mandato ' + titular.tipoIdentificacion.desc + ' ' + titular.numIdentificacion;

                        }

                        titulares.push({
                            tipoTitular: tipoTitular,
                            nombre: titular.nombres.replace('undefined', ''),
                            tipoId: titular.tipoIdentificacion.desc,
                            numId: titular.numIdentificacion,
                            firma: titular.huellaCapturada ? titular.base64 : ''
                        });

                    });

                    var request = {

                        numCDT: codCDT,
                        valInversion: $filter('currency')($scope.simulacion.valorInversion),
                        plazoDias: $scope.proyeccion.valPlazoDias,
                        tasaEA: $scope.simulacion.tipoCDT.valTieneTasaVariable != 'S' ? ($scope.proyeccion.valTasaEfectiva + '%') : $scope.proyeccion.valTasaEfectiva,
                        fechaExpedicion: $filter('date')(new Date(), 'dd/MM/yyyy'),
                        fechaVencimiento: $filter('date')($filter('davDates')($scope.proyeccion.fecFechaVencimiento, 'yyyyMMdd'), 'dd/MM/yyyy'),
                        tipoManejo: $scope.apertura.tipoManejo.desc,
                        capitalizaIntereses: $scope.simulacion.interes,
                        periodicidadPago: $scope.simulacion.frecuenciaDesc,
                        titulares: titulares

                    };

                    $scope.$api.guardaPdf(request).then(function (response) {

                        $scope.$api.obtienePdf(response.data.idPdf);

                    }, function (resp) {});

                },

                armarObjCreaActualiza: function () {

                    $scope.requestObjRegistros = [];

                    angular.forEach($scope.titulares, function (titular, i) {

                        var natural = titular.tipoIdentificacion.codigo.split('-')[1] == 'N';

                        $scope.requestObjRegistros.push({
                            informacionPersona: {
                                codTipoDocumento: titular.tipoIdentificacion.codigo.split('-')[0] || '',
                                valNumeroDocumento: titular.numIdentificacion || '',
                                valNombres: natural ? titular.nombre || '' : undefined,
                                valPrimerApellido: natural ? titular.primerApellido || '' : undefined,
                                valSegundoApellido: natural ? titular.segundoApellido || '' : undefined,
                                valRazonSocial: natural ? undefined : titular.razonsocial,
                                valNombreLargo: titular.nombres || '',
                                codSubtipo: natural ? 'P' : 'C',
                                codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4) || '',
                                fecCreacionCliente360: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00') || '',
                                fecModificacion: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00') || '',
                                codTipoCompania: natural ? undefined : (titular.codCompañia || '00'),
                                codAsociada: (function () {

                                    var code = '';

                                    if (titular.codAsociada == '00' || titular.codAsociada == '02' || titular.codAsociada == '04') {

                                        code = natural ? '0005' : '0021';

                                    } else {

                                        code = natural ? '0003' : '0023';

                                    }

                                    return code;


                                }()),
                                codPais: titular.codPais ? titular.codPais : '169',
                                codPaisResidencia: titular.codPaisResidencia ? titular.codPaisResidencia : '169',
                                codActividad: natural ? titular.codActividad || '' : undefined,
                                fecNacimientoOConstitucion: titular.fecNacimientoOConstitucion ? titular.fecNacimientoOConstitucion : '1900-01-01T19:00:00.000-05:00',
                                codSexo: titular.codSexo || undefined,
                                valPasaporte: natural ? (titular.valPasaporte || undefined) : undefined,
                                codIvc: titular.codIvc || '0',
                                codSegmento: titular.codSegmento ? titular.codSegmento : '0'
                            },
                            telefonoFijo: titular.valNumTelefono ? {
                                codTipoTelefono: 'F',
                                valNumeroTelefono: titular.valNumTelefono || ''
                            } : undefined,
                            telefonoCelular: titular.valNumeroTelefono ? {
                                codTipoTelefono: 'CE',
                                valNumeroTelefono: titular.valNumeroTelefono || ''
                            } : undefined,
                            direccion: {
                                valDireccion: titular.valDireccion || '1',
                                codCiudad: titular.codCiudad.toString().slice(3) || '11001000',
                                codTipoDireccion: 'PR',
                                fecRegistro: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00') || '',
                                codVerificado: 'S'
                            }

                        });



                    });



                },

                armarObjBeneficiarios: function () {

                    $scope.requestObjBeneficiarios = [];

                    angular.forEach($scope.titulares, function (titular, i) {

                        $scope.requestObjBeneficiarios.push({
                            codTipoDocumento: titular.tipoIdentificacion.codigo.split('-')[0],
                            idDocumento: titular.numIdentificacion,
                            codRol: i == 0 ? 'T' : 'A',
                            codCondicion: $scope.apertura.tipoManejo.codigo,
                            codTipo: 'T' // i == 0 ? 'T' : 'F'
                        });

                    });

                },

                armarObjMovimientos: function () {

                    $scope.requesObjMovimientos = [];

                    if ($scope.apertura.checks.efectivoCheck) {

                        $scope.requesObjMovimientos.push({
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codMoneda: $scope.simulacion.tipoCDT.codMoneda,
                            codProducto: 'EFEC',
                            valCuentaDebito: '',
                            valValorMovimiento: $scope.apertura.valorInversion ? $scope.apertura.valorInversion : $scope.simulacion.valorInversion,
                            fecFechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                            valSecuencialFormaPago: '0',
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                        });

                    }

                    if ($scope.apertura.checks.cuentaCheck) {

                        $scope.requesObjMovimientos.push({
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codMoneda: $scope.simulacion.tipoCDT.codMoneda,
                            codProducto: $scope.apertura.cuenta.tipo, // tipo cuenta Ahorros, corriente
                            valCuentaDebito: $scope.apertura.cuenta.value, // num cuenta
                            valValorMovimiento: $scope.apertura.valorDebito ? $scope.apertura.valorDebito : $scope.simulacion.valorInversion,
                            fecFechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                            valSecuencialFormaPago: 0,
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                        });

                    }

                    if ($scope.apertura.checks.chequeCheck) {

                        var sumaValCheques = 0;

                        angular.forEach($scope.cheques, function (value, i) {

                            sumaValCheques += Number(value.valorCheque);

                        });

                        $scope.requesObjMovimientos.push({
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codMoneda: $scope.simulacion.tipoCDT.codMoneda,
                            codProducto: 'CHQL',
                            valCuentaDebito: '',
                            valValorMovimiento: sumaValCheques,
                            fecFechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                            valSecuencialFormaPago: 0,
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                        });

                    }

                },

                armarObjDetalleCheques: function () {

                    $scope.requesObjDetalleCheques = [];

                    if ($scope.apertura.checks.chequeCheck) {

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

                /**
                 * Realiza el Guardado PDF con Token true Filenet
                 * @return Method
                 */

                fileNet: function (idPdf, numCDT) {

                    var date = new Date();
                    var dateMoreOneYear = new Date();
                    dateMoreOneYear.setFullYear(date.getFullYear() + 1);

                    return $api.reportes.fileNet({
                        rowId: CONFIG.rowId.replace('-', ''),
                        idSesion: CONFIG.usuario,
                        idTransaccion: CONFIG.rowId.replace('-', ''),
                        codPdf: idPdf,
                        valClaseDocumento: 'Acuerdo',
                        valMimeType: 'application/pdf',
                        valContenido: '',
                        otrasPropiedades: [{
                            valLlave: 'tipoIdentificacion',
                            valValor: Number($scope.titulares[0].tipoIdentificacion.codigo.split('-')[0])
                        }, {
                            valLlave: 'numeroIdentificacion',
                            valValor: $scope.titulares[0].numIdentificacion
                        }, {
                            valLlave: 'tipoDocumento',
                            valValor: 'AprobacionCDT'
                        }, {
                            valLlave: 'DocumentTitle',
                            valValor: numCDT + '_AperturaCDT_' + $filter('date')(date, 'yyyyMMddHHmmss') + '.pdf'
                        }, {
                            valLlave: 'productoAsociado',
                            valValor: numCDT
                        }, {
                            valLlave: 'fechaExpedicion',
                            valValor: $filter('date')(date, 'yyyy-MM-ddTHH:mm:ss')
                        }, {
                            valLlave: 'fechaExpiracion',
                            valValor: $filter('date')(dateMoreOneYear, 'yyyy-MM-ddTHH:mm:ss')
                        }],
                        oficinaTotal: CONFIG.oficina
                    });

                },


                guardaPdf: function (req) {

                    return $api.reportes.guardaPdf({
                        rowId: CONFIG.rowId,
                        idReporte: 'R_FIRMA_FISICA',
                        idPlantilla: 'P_FIRMA_FISICA',
                        flagFilenet: false,
                        data: req
                    });

                },

                obtienePdf: function (idPdf) {

                    window.open('/ReportesPDF-api/reportes/obtienePdf/' + idPdf);
                    // return $api.reportes.obtienePdf(idPdf);

                },

                /**
                 * Realiza el Guardado PDF con Token true Filenet
                 * @return Method
                 */

                guardaPdfFilenet: function () {

                    var date = new Date();
                    var titulares = [];
                    var apoderadoAutorizado = [];
                    var grados = ["Primer", "Segundo", "Tercer", "Cuarto", "Quinto"];

                    if ($scope.titulares && $scope.titulares.length != 0) {

                        angular.forEach($scope.titulares, function (value, index) {

                            let tipo = 'titular';

                            if (!angular.equals(value.autorizado, {})) {

                                tipo = 'autorizado';

                            }


                            if (!angular.equals(value.apoderado, {})) {

                                tipo = 'apoderado';

                            }

                            if (tipo == 'apoderado') {

                                titulares.push({
                                    tipoTi: 'Apoderado ' + grados[index] + ' Titular',
                                    nombres: value.apoderado.nombres,
                                    tipoId: value.apoderado.tipoIdentificacion.desc,
                                    numeroID: value.apoderado.numIdentificacion,
                                    huella: value.base64
                                });

                            } else if (tipo == 'autorizado') {

                                titulares.push({
                                    tipoTi: 'Autorizado ' + grados[index] + ' Titular',
                                    nombres: value.autorizado.nombres || '',
                                    tipoId: value.autorizado.IdentificationTypeRel || '',
                                    numeroID: value.autorizado.IdentificationNumberRel || '',
                                    huella: value.base64
                                });

                            } else {

                                titulares.push({
                                    tipoTi: grados[index] + ' Titular',
                                    nombres: value.nombres,
                                    tipoId: value.tipoIdentificacion.desc,
                                    numeroID: value.numIdentificacion,
                                    huella: value.base64
                                });

                            }

                        });

                    }

                    return $api.reportes.guardaPdf({
                        rowId: CONFIG.rowId,
                        idReporte: 'R_CDT_FIRMAS',
                        idPlantilla: 'P_CDT_FIRMAS',
                        flagFilenet: false,
                        data: {
                            usuario: CONFIG.usuario,
                            fechaConsulta: $filter('date')($filter('davDates')(date, 'yyyyMMdd'), 'yyyy-MM-dd'),
                            hora: date.toString().split(" ")[4].slice(0, 5),
                            titulares: titulares,
                            apoderadoAutorizado: apoderadoAutorizado
                        }
                    });

                },

                crearActualizarClienteCobis: function () {

                    return $api.consultaCdt.crearActualizarClienteCobis({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        registros: $scope.requestObjRegistros

                    });

                },

                constitucionCdtSolicitud: function () {

                    var codForma = 'EFEC';

                    if ($scope.simulacion.interes == 'Si') {

                        codForma = 'CTRL';

                    } else if ($scope.apertura.formaPago.codigo == '1') {

                        codForma = $scope.apertura.cuentaFormaPago.tipo;

                    } else {

                        codForma = 'EFEC';

                    }

                    return $api.consultaCdt.constitucionCdtSolicitud({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        contextoRequerimiento: {
                            idTransaccional: 'ConstitucionCDTSolicitud'
                        },
                        informacionCDT: {
                            valNumeroCDT: $scope.proyeccion.valNumeroCDT,
                            valPuntosAdicionalesTasa: $scope.simulacion.tasaAtribucion ? Number($scope.simulacion.tasaAtribucion) - Number($scope.simulacion.tasaCartelera) : '0.00',
                            valCapitalizacion: $scope.simulacion.interes == 'Si' ? 'S' : 'N',
                            codAgenteVendedor: $rootScope.$data.codAgenteVendedor,
                            codOficinaSiebel: CONFIG.oficina.slice(-4)
                        },
                        beneficiarios: $scope.requestObjBeneficiarios,
                        movimientosMonetarios: $scope.requesObjMovimientos,
                        detallesPagos: [{
                            codTipoDocumento: CONFIG.idType,
                            idDocumento: CONFIG.idNumber,
                            codFormaPago: codForma,
                            valCuentaCliente: $scope.simulacion.interes == 'Si' || $scope.apertura.formaPago.codigo != '1' ? '' : $scope.apertura.cuentaFormaPago.value,
                            codMonedaPago: '0',
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                            valPorcentajePago: '100',
                            codPeriocidadPago: $scope.simulacion.frecuenciaCod // periocidad seleccionada
                        }],
                        detalleCheques: $scope.requesObjDetalleCheques.length > 0 ? $scope.requesObjDetalleCheques : undefined

                    });

                },

                consultaCliente: function (persona) {

                    return $api.autenticacion.consultaCliente({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        nroDocumento: persona.nroDocumento
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */



        }
    ]);

});
