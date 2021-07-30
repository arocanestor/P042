/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('fusionCDTCtrl', [
        '$scope',
        '$rootScope',
        'CONFIG',
        '$slm-dialog',
        '$filter',
        '$api',
        '$timeout',
        '$utilities',
        '$state',
        'servicioNumCDT',
        function (
            $scope,
            $rootScope,
            CONFIG,
            $dialog,
            $filter,
            $api,
            $timeout,
            $utilities,
            $state,
            servicioNumCDT
        ) {


            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,

                nameSpace = $rootScope.account[$rootScope.routeApp['3']],
                checkCdt = 'autoriza-huella-fusion',
                // N si es natural o J si es juridica para hacer validaciones en el hotmail
                tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J',
                lovs = nameSpace.lovs;

            $scope.lovs = nameSpace.lovs;

            $scope.numCDT = servicioNumCDT.cdt;
            $scope.cdtS = "";
            $scope.valoresFusion = {
                valorInversion: 0
            };
            $scope.simulacion = nameSpace.simulacion;
            $scope.titular = {};
            nameSpace.titulares = [];
            $scope.apoderado = {};
            $scope.apoderados = [];
            nameSpace.apoderados = [];
            $scope.autorizado = {};
            nameSpace.autorizado = {};
            $scope.cheque = {};
            $scope.cheques = [{}];
            $scope.fusion = {};
            $scope.fusion.checks = {};
            nameSpace.fusion = {};
            $scope.form = {
                Fusion: {},
                cambioForma: {},
                checkFusion: {}
            };
            $scope.estado = {
                huellas: 'Verifique el registro de huellas',
                tipo: 'attention',
                capitaliza: 'Recuerde que si el cliente desea pago de intereses a Cuenta Davivienda, debe realizarlo por la novedad Forma de pago de intereses.'
            };
            $scope.habilitaBotonConfirmar = true;
            $scope.lovs = lovs;
            $scope.lovs.lov_productos = [];
            $scope.lovs.lov_checks_CDT_filtrado = [];
            $scope.lovs.lov_email = PERSONA.EMAILS;
            $scope.lovs.lov_cdt_tipo_documento_autorizado = [{
                codigo: "01-N",
                desc: "CÉDULA DE CIUDADANÍA"
            }, {
                codigo: "02-N",
                desc: "CÉDULA DE EXTRANJERÍA"
            }, {
                codigo: "04-N",
                desc: "TARJETA DE IDENTIDAD"
            }, {
                codigo: "05-N",
                desc: "PASAPORTE"
            }];

            // VALIDATE CHECKS
            $scope.validateChecks = {
                'autoriza-huella-fusion': true
            };

            $scope.personaBiometric = {};

            $scope.caption = {
                confirmApertura: 'Una vez el sistema acepte la(s) huella(s) se puede aplicar la fusión:',
                confirmFusion: '<ul>' +
                    '   <li><h3>LA FUSIÓN SE HA APLICADO</h3></li>' +
                    '   <li>A todos los títulos físicos actuales debe escribirle <strong>"FUSIONADO"</strong> y los debe enviar en el movimiento de la oficina.</li>' +
                    '   <li>Imprima el nuevo título físico y haga entrega al cliente:</li>' +
                    '   <li> 6322AF0000004755 - $1.500.000,00</li>' +
                    '</ul>',
                listas: {
                    status: '',
                    content: ''
                },
                confirmacionNic: {
                    status: '',
                    content: ''
                }
            };

            $scope.dialogs = {
                checkListas: 'Error al verificar al cliente en listas restrictivas. Intente mas tarde',
                fechaMenor: 'EL CLIENTE TIENE SUS DATOS ACTUALIZADOS, puede continuar',
                fechaMayor: 'Recuerde, ACTUALIZAR LOS DATOS DEL CLIENTE, al finalizar la fusion',
                sinFecha: 'Para continuar, VINCULE EL CLIENTE AL BANCO',
                noCliente: 'El documento consultado no existe como cliente del banco'
            };

            $scope.habilitaApoderado = false;


            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.guardarInfo = function () {

                nameSpace.fusion = $scope.fusion;

            };

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

                        // $scope.$api.consultaCliente({
                        //     nroDocumento: persona.numIdentificacion || persona.IdentificationNumberRel
                        // }).then(function (resp) {
                        //
                        //     $scope.$program.modalHuella.active = true;
                        //     $scope.autenticacion = resp.data;
                        //
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

                        $scope.$program.modalHuella.active = true;

                        return;

                    }

                    $timeout(function () {

                        $scope.$program.modalHuella.active = true;

                    });

                },

                actualizarValorCheque: function (cheques) {

                    var cont = 0;

                    // contador para saber cuantos chekbox estan seleccionados
                    angular.forEach($scope.fusion.checks, function (value, i) {

                        cont += (value == true) ? value : 0;

                    });

                    $scope.contadorChecks = cont;

                    cheques = cheques.map(function (obj) {

                        obj.valorCheque = ($scope.fusion.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : '';

                        return obj;

                    });

                },

                removeTitular: function (index, array) {

                    $dialog.open({
                        type: 'confirm',
                        content: '¿Desea quitar este elemento?',
                        accept: function () {

                            array.splice(index, 1);

                        }
                    });

                },

                agregarTitular: function (titulares) {

                    if (titulares.length <= '4') {

                        $scope.titulares.push({
                            tipoIdentificacion: '',
                            numIdentificacion: '',
                            nombres: '',
                            razonsocial: ''
                        });

                    }

                },

                agregarCheque: function () {

                    $scope.cheques.push({
                        numCheque: '',
                        numCuenta: '',
                        codBanco: '',
                        valorCheque: ($scope.fusion.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : ''
                    });

                },

                validarThrowAC: function (option) {

                    $scope.$gui.validarListasNIC(option, true);

                },

                validarListasNIC: function (persona, autorizado, reset) {

                    if (reset) {

                        $scope.$program.resetPersona(persona);
                        return;

                    }

                    if (!persona) {

                        return;

                    }

                    if (autorizado && !persona.codigo) {

                        return;

                    }

                    var tipoIdentificacion = autorizado ? persona.IdentificationTypeCodeRel : (persona.tipoIdentificacion.codigo || '').split('-')[0],
                        numIdentificacion = autorizado ? persona.IdentificationNumberRel : persona.numIdentificacion,
                        tipoClienteTitular = autorizado ? 'N' : (persona.tipoIdentificacion.codigo || '').split('-')[1],
                        fechaSistema = $filter('date')(new Date(), 'yyyy/MM/dd'),
                        fechaSistemaFormato = new Date(fechaSistema).getTime(),
                        natural = tipoClienteTitular == 'N',
                        armPersona = function (response) {

                            persona.SP = response.data[natural ? 'DATOS_PN' : 'DATOS_PJ'];
                            persona.SP.relaciones = persona.SP.RELACIONES.map(function (obj) {

                                if (obj.IdentifTypeRelacionado != '03' && obj.IdentificationTypeCodeRel != '03') {

                                    obj.desc = natural ? (obj.NombreRelacionado + ' ' + obj.PrimerApellidoRelacionado + ' ' + obj.SegundoApellidoRelacionado) : obj.NombreRelacionado + ' ' + obj.ApellidoRelacionado + ' ' + obj.SegundoApellidoRelacionado;
                                    obj.codigo = natural ? obj.IdentifNumberRelacionado : obj.IdentificationNumberRel;

                                }

                                return obj;

                            }).filter(function (obj) {

                                return obj.IdentifTypeRelacionado != '03' && obj.IdentificationTypeCodeRel != '03';

                            });

                            var cliente = persona.SP.CLIENTE,
                                fechadenacimientoOConstitucionFormateada = (function () {

                                    if (natural) {

                                        return cliente.Fechadenacimiento ? cliente.Fechadenacimiento.split(' ')[0] : '';

                                    }

                                    return cliente.DateFormed ? cliente.DateFormed.split(' ')[0] : '';

                                }()),
                                segmentoObj = $filter('filter')($scope.lovs.lov_cdt_segmento_cliente, {
                                    codigo: natural ? cliente.SegmentoComercialCode : cliente.AccountSegmentCode
                                })[0] || '',
                                direccionObj = persona.SP.DIRECCIONES.filter(function (obj) {

                                    return natural ? obj.DAV_Principal == 'Y' : obj.Principal == 'Y';

                                })[0] || {},
                                actividadObj = (natural ? persona.SP.INGRESOS : persona.SP.ACTIVIDADES_LABORALES).filter(function (obj) {

                                    return natural ? obj.Principal == 'Y' : obj.PrimaryIndustry;

                                })[0] || {},
                                telefonoObj = (function () {

                                    return persona.SP.TELEFONOS[0] || {};

                                }()),
                                celularObj = persona.SP.CELULARES.filter(function (obj) {

                                    return natural ? obj.DAV_PrincipalCellphone == 'Y' : obj.PrimaryCellphoneNumber == 'Y';

                                })[0] || {};

                            persona.huellaCapturada = natural ? null : false;
                            persona.razonsocial = cliente.Name || undefined;
                            persona.codCompañia = cliente.Type || undefined;
                            persona.nombre = cliente.Nombres || undefined;
                            persona.primerApellido = cliente.PrimerApellido || undefined;
                            persona.segundoApellido = cliente.SegundoApellido || undefined;
                            persona.nombres = natural ? (cliente.Nombres + ' ' + cliente.PrimerApellido + ' ' + cliente.SegundoApellido) : cliente.Name;
                            persona.codAsociada = (natural ? cliente.RetencionenlafuenteCode : cliente.RetencionEnLaFuenteCode) || '';
                            persona.codPais = cliente.Citizenship || undefined;

                            persona.codPaisResidencia = (natural ? direccionObj.DAV_PersonaCountry : direccionObj.EmpresaCountry) || '';

                            persona.codActividad = (natural ? actividadObj.ActividadEconomica : actividadObj.SICCode) || '';

                            persona.fecNacimientoOConstitucion = fechadenacimientoOConstitucionFormateada ? $filter('date')(new Date(fechadenacimientoOConstitucionFormateada), 'yyyy-MM-ddT00:00:00') : '';
                            persona.codSexo = cliente.Sexo || undefined;
                            persona.valPasaporte = cliente.NumeroPasaporteAmericano || undefined;
                            persona.codIvc = (natural ? cliente.SegmentoColorCode : cliente.SegmentoCode) || '0';
                            persona.codSegmento = segmentoObj ? segmentoObj.desc : '0';
                            persona.valNumTelefono = telefonoObj.Number || '';

                            persona.valNumeroTelefono = celularObj.Number || '';

                            persona.valDireccion = direccionObj.StreetAdress || '';

                            persona.codCiudad = (natural ? direccionObj.DAV_PersonaMunicipality : direccionObj.EmpresaMunicipality) || '';

                            if (cliente.ClientDataUpdateDate || cliente.CustomerUpdateData) {

                                var fechaActualizacionFormato = new Date(cliente[natural ? 'ClientDataUpdateDate' : 'CustomerUpdateData'].split(' ')[0]).getTime(),
                                    difFechas = fechaSistemaFormato - fechaActualizacionFormato,
                                    dias = Math.floor(difFechas / (1000 * 60 * 60 * 24));

                                persona.confirmacionNic.status = dias > 365 ? 'error' : 'success';
                                persona.confirmacionNic.content = dias > 365 ? $scope.dialogs.fechaMayor : $scope.dialogs.fechaMenor;
                                persona.confirmacion = dias <= 365;
                                persona.vinculableNIC = true;

                                return;

                            }

                            persona.confirmacionNic.status = 'error';
                            persona.confirmacionNic.content = $scope.dialogs.sinFecha || '';
                            persona.confirmacion = false;
                            persona.vinculableNIC = false;

                        };

                    if (!tipoIdentificacion || !numIdentificacion) {

                        return;

                    }

                    persona.relacionadoFilter = '';
                    persona.listas = {};
                    persona.confirmacionNic = {};

                    $api.siebel[natural ? 'getCliente' : 'getCompany']({
                        rowId: CONFIG.rowId,
                        inNumID: numIdentificacion,
                        inTipoID: tipoIdentificacion
                    }).then(function (response) {

                        $scope.$program.resetPersona(persona, true);

                        armPersona(response);

                        var cliente = persona.SP.CLIENTE;
                        // Se valida si el titular se encuentra en listas restrictivas
                        $scope.$api.checkListas({
                            tipoIdentificacionTitular: tipoIdentificacion,
                            nroIdentificacionTitular: numIdentificacion,
                            fechaNacimientoConstitucion: persona.fecNacimientoOConstitucion,
                            natural: natural,
                            genero: cliente.Sexo,
                            nombre: natural ? persona.nombre + ' ' + persona.primerApellido + ' ' + persona.segundoApellido : persona.razonsocial,
                            paisNacimientoConstitucion: natural ? cliente.PaisdeNacimiento : cliente.ConstitutionCity.slice(0, 3)
                        }).then(function (response) {

                            var data = response.data,
                                codigosVinculables = $rootScope.lov.lov_listas_restrictiva_permitir_codigo.map(function (obj) {

                                    return obj.codigo;

                                });

                            persona.listas.status = codigosVinculables.indexOf(data.codigoRespuesta) != -1 ? 'success' : 'error';
                            persona.listas.content = data.mensajeRespuesta;
                            persona.vinculable = codigosVinculables.indexOf(data.codigoRespuesta) != -1;

                        }, function (response) {

                            $dialog.open({
                                status: 'error',
                                title: 'CONSULTA LISTAS RESTRICTIVAS',
                                content: 'Error código: <b>' + response.status + '</b><br>Intente Nuevamente',
                                accept: function () {

                                    // $state.go('^'); // volvemos al dashboard

                                }
                            });

                        });

                    }, function (response) {

                        $scope.$program.resetPersona(persona, true);

                        $dialog.open({
                            status: 'error',
                            content: response.headers('respuesta') || '</b><br> Ocurrió un Error Cargando los Datos'
                        });

                    }).finally(function () {


                    });

                },

                resetCamp: function (persona) {

                    if (!(
                            $filter('filter')($scope.titulares, {
                                tipoIdentificacion: {
                                    desc: 'NIT'
                                }
                            }).length)) {

                        $scope.autorizado = {};

                    }

                    var valido = true;
                    var contadorTitulares = 0;
                    angular.forEach($scope.titulares, function (value) {

                        if (value.numIdentificacion == persona.numIdentificacion && value.tipoIdentificacion.desc == persona.tipoIdentificacion.desc) {

                            contadorTitulares++;

                        }

                    });

                    var contadorAutorizado = 0;
                    if ($scope.autorizado.numIdentificacion != undefined) {

                        if ($scope.autorizado.numIdentificacion == persona.numIdentificacion && $scope.autorizado.tipoIdentificacion.desc == persona.tipoIdentificacion.desc) {

                            contadorAutorizado++;

                        }

                    }


                    var contadorApoderados = 0;
                    angular.forEach($scope.apoderados, function (value) {

                        if (value.numIdentificacion == persona.numIdentificacion && value.tipoIdentificacion.desc == persona.tipoIdentificacion.desc) {

                            contadorApoderados++;

                        }

                    });

                    if (((contadorTitulares == 0 || contadorTitulares == 1) && contadorAutorizado == 0 && contadorApoderados == 0) || ((contadorAutorizado == 0 || contadorAutorizado == 1) && contadorTitulares == 0 && contadorApoderados == 0) || ((contadorApoderados == 0 || contadorApoderados == 1) && contadorAutorizado == 0 && contadorTitulares == 0)) {

                        valido = true;

                    } else {

                        valido = false;
                        persona.numIdentificacion = '';
                        persona.nombres = '';
                        if (persona.confirmacionNic) {

                            persona.confirmacionNic.content = '';

                        }
                        if (persona.listas) {

                            persona.listas.content = '';

                        }

                    }
                    return valido;

                },

                llenarTabla: function () {

                    $scope.$program.modalHuella.active = false;

                    var arr = {
                            tipoIdentificacion: '',
                            numIdentificacion: '',
                            nombres: '',
                            razonsocial: '',
                            remover: false // para que no aparezca el boton de eliminar en los 2 primeros titulares
                        },
                        arr2 = {
                            tipoIdentificacion: '',
                            numIdentificacion: '',
                            nombres: '',
                            razonsocial: '',
                            remover: false // para que no aparezca el boton de eliminar en los 2 primeros titulares
                        };

                    $scope.titulares = $scope.fusion.tipoManejo.codigo == 'O' || $scope.fusion.tipoManejo.desc == 'CONJUNTO' ? [arr, arr2] : [{}];
                    $scope.apoderados = [];
                    $scope.autorizado = {};
                    $scope.agregarAutorizado = false;
                    $scope.habilitaApoderado = false;

                },

                agregarApoderado: function (index, titular) {

                    $scope.$program.modalHuella.active = false;
                    titular.deshabilitarCaptura = true;
                    titular.deshabilitarApertura = true;
                    $scope.habilitaApoderado = true;

                    var apoderado = {
                            tipoIdentificacion: '',
                            numIdentificacion: '',
                            nombres: '',
                            indexTitular: index
                        },
                        cliente = index == 'A' ? 'autorizado' : 'titular';

                    $scope.apoderados.push(apoderado);

                    apoderado.huellaCapturada = null;

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

                },

                aplicarFusion: function () {


                    $scope.$program.armarObjCreaActualiza();
                    $scope.$api.crearActualizarClienteCobis().then(function (resp) {

                        if (resp.data.caracterAceptacion == 'B' && resp.data.codMsgRespuesta == '0') {

                            $scope.$api.fusionarCdtOficina().then(function (resp) {


                                if (!resp.data) {

                                    $dialog.open({
                                        status: 'error',
                                        content: 'Error código: <b>200</b><br>Intente Nuevamente'
                                    });
                                    return;

                                }

                                if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

                                    $scope.habilitaBotonConfirmar = false;
                                    $scope.numeroNuevoCDT = resp.data.valNumeroCDT;

                                    $dialog.open({
                                        status: 'success',
                                        content: resp.data.msgRespuesta || 'Operación Exitosa'
                                    }).then(function () {

                                        $scope.llamadoConstitucion = 1;
                                        $scope.caption.confirmFusion = '<ul><li><h3>LA FUSIÓN SE HA APLICADO</h3></li><li>A todos los títulos físicos actuales debe escribirle <strong>"FUSIONADO"</strong> y los debe enviar en el movimiento de la oficina.</li></ul> <br> Nuevo Número CDT: <Strong>' + $scope.numeroNuevoCDT + '</Strong>';

                                        if (($filter('filter')($scope.numCDT, {

                                                codCapitalizaIntereses: 'N'

                                            }).length) > 0) {

                                            // Todo bien, todo correcto, entonces hacemos mantenimiento del Cdt
                                            $scope.$api.mantenimientoCdt().then(function (resp) {

                                                if (resp.data) {

                                                    if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

                                                        /**
                                                         * Envíar Huellas a Plantilla con Filenet
                                                         */
                                                        $scope.$program.filenet(resp.data.codCDT);

                                                    } else {

                                                        $dialog.open({
                                                            status: 'error',
                                                            title: 'MANTENIMIENTO CDT',
                                                            content: "Ha ocurrido un error inesperado"
                                                        });

                                                    }



                                                } else {

                                                    $dialog.open({
                                                        status: 'error',
                                                        content: 'Ha ocurrido un error inesperado',
                                                        accept: function () {}
                                                    });

                                                }

                                            }, function (resp) {

                                                $dialog.open({
                                                    status: 'error',
                                                    title: 'MANTENIMIENTO CDT',
                                                    content: resp.headers("Respuesta") || "Ha ocurrido un error inesperado"
                                                });

                                            });

                                            return;

                                        }

                                        /**
                                         * Envíar Huellas a Plantilla con Filenet
                                         */
                                        if (resp.data.valNumeroCDT) {

                                            $scope.$program.filenet(resp.data.valNumeroCDT);

                                        } else {

                                            $dialog.open({
                                                status: 'error',
                                                content: 'Número de CDT erróneo'
                                            });

                                        }



                                    });


                                } else {

                                    $dialog.open({
                                        status: 'error',
                                        content: "No fue posible realizar la fusión de los CDT, por favor intente nuevamente"
                                    }).then(function () {

                                        $scope.habilitaBotonConfirmar = true;

                                    });

                                }

                            }, function (resp) {

                                $dialog.open({
                                    status: 'error',
                                    content: resp.headers("Respuesta") || "No fue posible realizar la fusión de los CDT, por favor intente nuevamente"
                                });

                            });


                        }

                    }, function (resp) {

                        $dialog.open({
                            status: 'error',
                            content: resp.headers("Respuesta") || 'No fue posible realizar la fusión de los CDT, por favor intente nuevamente'
                        });

                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$program = {

                modalHuella: {
                    active: false,
                    nombrePersona: ''
                },

                resetPersona: function (persona, keepNum) {

                    persona.numIdentificacion = keepNum ? persona.numIdentificacion : '';
                    persona.SP = {};
                    persona.nombres = '';
                    persona.razonsocial = '';
                    persona.listas = {};
                    persona.confirmacionNic = {};
                    persona.confirmacion = '';
                    persona.autenticado = null;
                    persona.autorizado = {};
                    persona.apoderado = {};
                    persona.hasApoderado = false;
                    persona.huellaCapturada = false;
                    persona.errorCasb = false;
                    persona.noEnrolada = false;

                },

                validadorCapturasHuellas: function () {

                    var huellasTitulares;
                    var huellasApoderados;
                    var total = $scope.titulares ? $scope.titulares.length : 0;

                    huellasTitulares = $filter('filter')($scope.titulares, {
                        huellaCapturada: true
                    });

                    huellasApoderados = $filter('filter')($scope.apoderados, {
                        huellaCapturada: true
                    });

                    if (total != 0) {

                        if ((huellasTitulares.length + huellasApoderados.length) == total) {

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
                                    type: 'error',
                                    content: 'Error al generar PDF, intente nuevamente',
                                    accept: function () {}
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
                            content: response.headers("Respuesta") || 'No fue posible generar el PDF, por favor intente nuevamente',
                            accept: function () {}
                        });

                    });

                },

                lovCuentas: function () {

                    var arr = CONFIG.objPersona.listOfDavFincorpaccountBc ? CONFIG.objPersona.listOfDavFincorpaccountBc.davFincorpaccountBc : CONFIG.objPersona.listOfFincorpAccount.fincorpAccount,
                        cuentas = [];

                    angular.forEach(arr, function (value, i) {

                        if ((value.davEffectiveProduct === 'VIGENTE' || value.davEffectiveProduct === '01')) {

                            var codigoSubProducto = value.davSubproductCode.slice(-4);

                            cuentas.push({
                                value: value.accountNumber3,
                                label: 'Cuenta Davivienda - Ahorros ' + value.accountNumber3.slice(-4),
                                tipo: 'AHO'
                            });

                            if ((['2000', '2001', '2080', '2081', '2090']).indexOf(codigoSubProducto) != -1) {

                                cuentas.push({
                                    value: value.accountNumber3,
                                    label: 'Cuenta Davivienda - Corriente ' + value.accountNumber3.slice(-4),
                                    tipo: 'CTE'
                                });

                            }

                        }

                    });


                    $scope.lovs.lov_productos = cuentas;

                },

                calcularSumatoria: function (valInversionEfectivo, valDebito, cheques) {

                    var sumatoria = 0,
                        sumaValCheques = 0;

                    angular.forEach(cheques, function (value, i) {

                        var valorCheque = ($scope.fusion.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : value.valorCheque;
                        sumaValCheques += Number(valorCheque);

                    });

                    valInversionEfectivo = valInversionEfectivo ? valInversionEfectivo : 0;
                    valDebito = valDebito ? valDebito : 0;
                    sumaValCheques = sumaValCheques ? sumaValCheques : 0;

                    // SUMA DE LOS CAMPOS DE MONTOS
                    sumatoria += Number(valInversionEfectivo) + Number(valDebito) + Number(sumaValCheques);

                    $scope.fusion.totalRecepcion = sumatoria;

                    return sumatoria;

                },

                calcularInversion: function () {

                    // Calcula valor de inversion
                    angular.forEach($scope.cdtS, function (value) {

                        $scope.valoresFusion.valorInversion += value.valMontoActualOperacion;

                    });

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
                            valDocumento: titular.numIdentificacion,
                            codRol: i == 0 ? 'T' : 'A',
                            codCondicion: $filter('filter')(lovs.lov_cdt_tipo_manejo, {
                                desc: $scope.fusion.tipoManejo.desc
                            })[0].codigo,
                            codTipo: i == 0 ? 'T' : 'F'
                        });

                    });

                },
                cargarListaCdt: function () {

                    $scope.listaCdts = [];
                    angular.forEach($scope.cdtS, function (value) {

                        $scope.listaCdts.push(value.valNumeroCDT);

                    });

                },
                cargarTitulares: function () {

                    $scope.listaTitulares = [];
                    $scope.listaTitulares.push({
                        codTipoDocumento: $scope.titulares[0].tipoIdentificacion.codigo.split('-')[0],
                        valDocumento: $scope.titulares[0].numIdentificacion,
                        codRol: "T",
                        codCondicion: $scope.fusion.tipoManejo.codigo,
                        codTipo: "T"
                    });
                    for (var i = 1; i < $scope.titulares.length; i++) {

                        $scope.listaTitulares.push({
                            codTipoDocumento: $scope.titulares[i].tipoIdentificacion.codigo.split('-')[0],
                            valDocumento: $scope.titulares[i].numIdentificacion,
                            codRol: "A",
                            codCondicion: $scope.fusion.tipoManejo.codigo,
                            codTipo: "T" // "F"
                        });

                    }

                }

            };

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

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
                            valValor: numCDT + '_FusionarCDT_' + $filter('date')(date, 'yyyyMMddHHmmss') + '.pdf'
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
                        flagFilenet: true,
                        data: {
                            fechaConsulta: $filter('date')($filter('davDates')(date, 'yyyyMMdd'), 'yyyy-MM-dd'),
                            hora: date.toString().split(" ")[4].slice(0, 5),
                            titulares: titulares,
                            apoderadoAutorizado: apoderadoAutorizado
                        }
                    });

                },

                checkListas: function (titular) {

                    return $api.cautela.listasRestrictivas({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        tipoIdentificacionTitular: titular.tipoIdentificacionTitular,
                        nroIdentificacionTitular: titular.nroIdentificacionTitular,
                        codigoSolicitud: $filter('lov')('FUSIONAR-CDT', $rootScope.lov.lov_listas_restrictiva_operacion, 'desc', 'codigo'),
                        fechaNacimiento: titular.fechaNacimientoConstitucion || undefined,
                        genero: titular.genero || undefined,
                        nombre: titular.nombre,
                        valPaisNacimiento: titular.paisNacimientoConstitucion || undefined,
                        codTipo: titular.natural ? 'N' : 'J'
                    });

                },

                getCliente: function (params) {

                    return $api.siebel.getCliente({
                        rowId: CONFIG.rowId,
                        inNumID: params.idNumber,
                        inTipoID: params.idType
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

                fusionarCdtOficina: function () {

                    $scope.guardarInfo();

                    var adressTypeCode = tipoCliente == 'N' ? $filter('filter')(PERSONA.DIRECCIONES, {
                        DAV_Principal: 'Y'
                    })[0].DAV_AddressTypeCode : $filter('filter')(PERSONA.DIRECCIONES, {
                        Principal: 'Y'
                    })[0].AddressTypeCode;

                    $scope.$program.armarObjBeneficiarios();
                    $scope.$program.cargarListaCdt();
                    $scope.$program.cargarTitulares();
                    var opcionSeleccionada = '0';
                    if ($scope.fusion.tipoManejo.desc == 'INDIVIDUAL') {

                        opcionSeleccionada = '01';

                    } else if ($scope.fusion.tipoManejo.desc == 'ALTERNATIVO') {

                        opcionSeleccionada = '03';

                    } else if ($scope.fusion.tipoManejo.desc == 'CONJUNTO') {

                        opcionSeleccionada = '02';

                    } else {

                        opcionSeleccionada = '00';

                    }

                    return $api.consultaCdt.fusionarCdtOficina({
                        rowId: CONFIG.rowId, // Listo
                        usuario: CONFIG.usuario, // Listo
                        oficinaTotal: CONFIG.oficina, // Listo
                        codAgenteVendedor: $rootScope.$data.codAgenteVendedor, // Listo
                        codOficinaSiebel: CONFIG.hostOficina || CONFIG.oficina, // Listo (CONFIG.employee.listOfEmployeePosition.employeePosition[0].division.slice(CONFIG.employee.listOfEmployeePosition.employeePosition[0].division.length - 4, CONFIG.employee.listOfEmployeePosition.employeePosition[0].division.length))
                        valCodigoProductoRPR: "0510", // Listo
                        valCodigoSubProductoRPR: "5150", // Listo
                        valTipoManejo: opcionSeleccionada, // Listo
                        valClaseDireccionRPR: CONFIG.addressList[0].addressType, // listo
                        valAlias: "0", // Listo
                        valOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4), // Listo
                        listaCDTs: $scope.listaCdts, // Listo
                        beneficiarios: $scope.listaTitulares // Listo
                    });

                },

                mantenimientoCdt: function () {

                    return $api.consultaCdt.mantenimientoCdt({
                        rowId: CONFIG.rowId, // LISTO
                        usuario: CONFIG.usuario, // LISTO
                        oficinaTotal: CONFIG.oficinaTotal, // LISTO
                        operacion: {
                            valNumeroCDT: $scope.numeroNuevoCDT // Nuevo numero CDT PENDIENTE
                        },
                        detallePago: [{
                            codTipoDocumento: $scope.titulares[0].tipoIdentificacion.codigo.split('-')[0],
                            valNumeroDocumento: $scope.titulares[0].numIdentificacion,
                            // codFormaPago: $scope.fusion.formaPagoIntereses.codigo == '1' ? $scope.fusion.cuentaFormaPagoIntereses.tipo : 'EFEC',
                            codFormaPago: 'EFEC',
                            codMonedaPago: 0,
                            valPorcentaje: 100,
                            codOficina: CONFIG.hostName || CONFIG.oficina.slice(-4),
                            codPeriocidadPago: $scope.numCDT[0].codFormaPago
                        }]
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
            if (nameSpace.cdtSeleccionado.length == 0) {

                $state.go('^');

            } else {

                $scope.cdtS = nameSpace.cdtSeleccionado;
                $scope.$program.calcularInversion();
                $scope.$program.lovCuentas();
                $scope.lovs.lov_checks_CDT_filtrado = $filter('filter')(lovs.lov_checks_CDT, {
                    codigo: checkCdt
                });

            }


        }
    ]);

});
