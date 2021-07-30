/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('endosoCDTCtrl', [
        '$scope',
        'servicioNumCDT',
        '$rootScope',
        'CONFIG',
        'lovs',
        '$slm-dialog',
        '$filter',
        '$api',
        '$timeout',
        '$utilities',
        function (
            $scope,
            servicioNumCDT,
            $rootScope,
            CONFIG,
            lovs,
            $dialog,
            $filter,
            $api,
            $timeout,
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
                tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';

            // Principal deshabilitado, sin embargo lo cargamos para mantener el cliente principal y no permitir su edoso
            $scope.$backUp = {
                Principal: {}
            };
            var principal = {
                tipoIdentificacion: '',
                numIdentificacion: ''
            };

            $scope.$backUp.Principal = {
                tipoIdentificacion: $filter('filter')($scope.lovs.lov_cdt_tipo_documento, {
                    codigo: CONFIG.idType + '-' + tipoCliente
                })[0] || '',
                numIdentificacion: CONFIG.idNumber
            };

            // principal = {
            //     tipoIdentificacion: $filter('filter')($scope.lovs.lov_cdt_tipo_documento, {
            //         codigo: CONFIG.idType + '-' + tipoCliente
            //     })[0] || '',
            //     numIdentificacion: CONFIG.idNumber
            // };

            $scope.numCDT = servicioNumCDT.cdt;

            $scope.cdtSeleccionado = nameSpace.cdtSeleccionado;

            $scope.titulares = [principal];
            nameSpace.titulares = [];
            $scope.apoderado = {};
            $scope.apoderados = [];
            nameSpace.apoderados = [];
            $scope.autorizado = {};
            nameSpace.autorizado = {};
            $scope.cheque = {};
            $scope.cheques = [{}];
            $scope.endoso = {};
            $scope.endoso.checks = {};
            nameSpace.endoso = {};
            $scope.form = {
                Endoso: {},
                cambioForma: {}
            };
            $scope.estado = {
                huellas: 'Verifique el registro de huellas',
                tipo: 'attention',
                capitaliza: 'Recuerde que si el cliente desea pago de intereses a Cuenta Davivienda, debe realizarlo por la novedad Forma de pago de intereses.'
            };
            $scope.habilitaBotonConfirmar = true;

            $scope.lovs = lovs;
            $scope.lovs.lov_productos = [];
            $scope.lovs.lov_email = PERSONA.EMAILS;
            $scope.lovs.lov_checks_CDT_filtrado = [];

            // VALIDATE CHECKS
            $scope.validateChecks = {
                'autoriza-huella-endoso': false
            };

            // huella capturada
            $scope.biometricData = {};

            $scope.caption = {
                confirmApertura: 'Una vez el sistema acepte la(s) huella(s) puede aplicar el endoso:',
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
                fechaMayor: 'Recuerde, ACTUALIZAR LOS DATOS DEL CLIENTE, al finalizar el endoso',
                sinFecha: 'Para continuar, VINCULE EL CLIENTE AL BANCO'
            };

            $scope.habilitaCaptura = false;
            $scope.habilitaApoderado = false;


            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.guardarInfo = function () {

                nameSpace.endoso = $scope.endoso;

                $scope.principal.tipoIdentificacionHomologado = $scope.principal.tipoIdentificacion;
                $scope.principal.tipoIdentificacion = CONFIG.idType + '-' + tipoCliente;

                if ($scope.titulares.length > 0) {

                    $scope.titulares = $scope.titulares.map(function (titular, idTitular) {

                        return {
                            tipoIdentificacion: titular.tipoIdentificacion.codigo,
                            tipoIdentificacionHomologado: titular.tipoIdentificacion.desc,
                            numIdentificacion: titular.numIdentificacion,
                            nombres: titular.nombres
                        };

                    });

                }

                // se añade el primer titular al arreglo de Titulares solo si el cliente es Natural
                if (tipoCliente == 'N') {

                    $scope.titulares.unshift($scope.principal);

                }

                nameSpace.principal = $scope.principal;
                nameSpace.titulares = $scope.titulares;

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
                    angular.forEach($scope.endoso.checks, function (value, i) {

                        cont += (value == true) ? value : 0;

                    });

                    $scope.contadorChecks = cont;

                    cheques = cheques.map(function (obj) {

                        obj.valorCheque = ($scope.endoso.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : '';

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
                        valorCheque: ($scope.endoso.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : ''
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
                            }).length
                        )) {

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

                        var numComparador = persona.numIdentificacion || '';
                        var tipComparador = persona.tipoIdentificacion ? persona.tipoIdentificacion.codigo.split("-")[0] : '';

                        var validadorExistencial = $scope.endoso.tipoManejo.codigo ? $scope.endoso.tipoManejo.codigo == "01" : false;

                        if (validadorExistencial) {

                            if (CONFIG.idNumber == numComparador && CONFIG.idType == tipComparador) {

                                valido = false;
                                persona.numIdentificacion = '';
                                persona.nombres = '';
                                if (persona.confirmacionNic) {

                                    persona.confirmacionNic.content = '';

                                }
                                if (persona.listas) {

                                    persona.listas.content = '';

                                }

                            } else {

                                valido = true;

                            }

                        } else {

                            valido = true;

                        }



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

                    $scope.titulares = $scope.endoso.tipoManejo.desc == 'ALTERNATIVO' || $scope.endoso.tipoManejo.desc == 'CONJUNTO' ? [arr, arr2] : [{}];
                    $scope.apoderados = [];
                    $scope.autorizado = {};
                    $scope.agregarAutorizado = false;
                    $scope.habilitaApoderado = false;

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
                        cliente = index == 'A' ? 'autorizado' : 'titular';

                    $scope.apoderados.push(apoderado);

                    switch (index) {

                        case 'A':

                            apoderado.numeroApoderado = 'Apoderado Primer ' + cliente;

                            break;

                        case 0:

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

                aplicarEndoso: function () {

                    $scope.$program.armarObjCreaActualiza();

                    $scope.$api.crearActualizarClienteCobis().then(function (resp) {

                        if (resp.data.caracterAceptacion == 'B' && resp.data.codMsgRespuesta == '0') {

                            // se llama el servicio de ENDOSO
                            $scope.$api.endosarCdtOficina().then(function (resp) {

                                if (resp.data) {

                                    if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

                                        $scope.habilitaBotonConfirmar = false;
                                        $scope.llamadoConstitucion = 1;
                                        $scope.mensajeConstitucion = "El endoso se ha aplicado CDT #" + (resp.data.valNumeroCDT || '##############');

                                        if ($scope.numCDT[0].codCapitalizaIntereses == 'N') {

                                            // se llama el servicio de mantenimientoCdt
                                            $scope.$api.mantenimientoCdt(resp.data.valNumeroCDT).then(function (resp) {

                                                if (resp.data) {

                                                    if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

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
                                                        title: 'MANTENIMIENTO CDT',
                                                        content: 'Ha ocurrido un error inesperado'
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

                                        if (resp.data.valNumeroCDT) {

                                            $scope.$program.filenet(resp.data.valNumeroCDT);

                                        } else {

                                            $dialog.open({
                                                status: 'error',
                                                content: 'Número de CDT erróneo'
                                            });

                                        }

                                    } else {

                                        $dialog.open({
                                            status: 'error',
                                            title: 'Endosar CDT',
                                            content: "No fue posible realizar el endoso del CDT, por favor intente nuevamente"
                                        }).then(function () {

                                            $scope.habilitaBotonConfirmar = false;

                                        });

                                    }

                                } else {

                                    $dialog.open({
                                        status: 'error',
                                        title: 'Endosar CDT',
                                        content: 'Error código: <b>200</b><br>Intente Nuevamente'
                                    });

                                }

                            }, function (resp) {

                                $scope.llamadoConstitucion = 2;
                                $scope.mensajeConstitucion = resp.headers("Respuesta") || "No fue posible aplicar la novedad, intente nuevamente";

                            });

                        } else {

                            $scope.llamadoConstitucion = 2;
                            $scope.mensajeConstitucion = "No fue posible realizar el endoso del CDT, por favor intente nuevamente";

                        }

                    }, function (resp) {

                        $scope.llamadoConstitucion = 2;
                        $scope.mensajeConstitucion = resp.headers("Respuesta") || "No fue posible realizar el endoso del CDT, por favor intente nuevamente";

                    });

                },

                aplicarCambio: function () {

                    $scope.llamadoCambio = 1;
                    $scope.mensajeCambio = "EL CAMBIO DE FORMA DE PAGO DE PRÓXIMOS INTERESES SE HA APLICADO";

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
                    var huellaAutorizado = $scope.autorizado.autenticado ? 1 : 0;
                    var total = $scope.titulares ? $scope.titulares.length : 0;
                    huellasTitulares = $filter('filter')($scope.titulares, {
                        autenticado: true
                    });
                    huellasApoderados = $filter('filter')($scope.apoderados, {
                        autenticado: true
                    });
                    if (total != 0) {

                        if ((huellasTitulares.length + huellasApoderados.length + huellaAutorizado) == total) {

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
                            content: response.headers("Respuesta") || 'No fue posible generar el PDF, por favor intente nuevamente'
                        });

                    });

                },

                lovCuentas: function () {

                    var arr = CONFIG.cuentas,
                        cuentas = [];

                    angular.forEach(arr, function (value, i) {

                        var rechazoDebito = $filter('filter')($scope.lovs.lov_cdt_rechazo_cuentas, {
                                codigo: value.davSubproductCode
                            }, true)[0],
                            tipManejo = $filter('filter')($scope.lovs.lov_cdt_rechazo_tipo_manejo, {
                                codigo: value.davManagementType
                            }, true)[0];

                        if (!rechazoDebito && !tipManejo && (value.davEffectiveProduct === 'VIGENTE' || value.davEffectiveProduct === '01')) {

                            if (value.davProductPartNumber == 'P006') {

                                cuentas.push({
                                    value: value.accountNumber3,
                                    label: 'Cuenta Davivienda - Ahorros ' + value.accountNumber3.slice(-4),
                                    tipo: 'AHO'
                                });

                            } else if (value.davProductPartNumber == 'P007') {

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

                        var valorCheque = ($scope.endoso.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : value.valorCheque;
                        sumaValCheques += Number(valorCheque);

                    });

                    valInversionEfectivo = valInversionEfectivo ? valInversionEfectivo : 0;
                    valDebito = valDebito ? valDebito : 0;
                    sumaValCheques = sumaValCheques ? sumaValCheques : 0;

                    // SUMA DE LOS CAMPOS DE MONTOS
                    sumatoria += Number(valInversionEfectivo) + Number(valDebito) + Number(sumaValCheques);

                    $scope.endoso.totalRecepcion = sumatoria;

                    return sumatoria;

                },

                armarObjCreaActualiza: function () {

                    $scope.requestObjRegistros = [];

                    angular.forEach($scope.titulares, function (titular, i) {

                        var natural = titular.tipoIdentificacion.codigo.split('-')[1] == 'N';

                        $scope.requestObjRegistros.push({
                            informacionPersona: {
                                codTipoDocumento: titular.tipoIdentificacion.codigo.split('-')[0],
                                valNumeroDocumento: titular.numIdentificacion,
                                valNombres: titular.nombre,
                                valPrimerApellido: titular.primerApellido,
                                valSegundoApellido: titular.segundoApellido,
                                valRazonSocial: natural ? undefined : titular.nombres,
                                valNombreLargo: titular.nombres || titular.razonsocial,
                                codSubtipo: natural ? 'P' : 'C',
                                codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                                fecCreacionCliente360: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                fecModificacion: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                codTipoCompania: natural ? undefined : (titular.codCompañia || '00'),
                                codAsociada: (function () {

                                    if (['00', '02', '04'].indexOf(titular.codAsociada) != -1) {

                                        return natural ? '0005' : '0021';

                                    }

                                    return natural ? '0003' : '0023 ';

                                }()),
                                codPais: titular.codPais ? titular.codPais : '169',
                                codPaisResidencia: titular.codPaisResidencia ? titular.codPaisResidencia : '169',
                                codActividad: titular.codActividad || '',
                                fecNacimientoOConstitucion: titular.fecNacimientoOConstitucion ? titular.fecNacimientoOConstitucion : '1900-01-01T19:00:00.000-05:00',
                                codSexo: titular.codSexo || undefined,
                                valPasaporte: titular.valPasaporte || undefined,
                                codIvc: titular.codIvc || '',
                                codSegmento: titular.codSegmento ? titular.codSegmento : '0'
                            },
                            telefonoFijo: titular.valNumTelefono ? {
                                codTipoTelefono: 'F',
                                valNumeroTelefono: titular.valNumTelefono
                            } : undefined,

                            telefonoCelular: titular.valNumeroTelefono ? {
                                codTipoTelefono: 'CE',
                                valNumeroTelefono: titular.valNumeroTelefono
                            } : undefined,

                            direccion: {
                                valDireccion: titular.valDireccion || '1',
                                codCiudad: titular.codCiudad.toString().slice(3) || '11001000',
                                codTipoDireccion: 'PR',
                                fecRegistro: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                codVerificado: 'S'
                            }

                        });


                    });

                },

                armarObjBeneficiarios: function () {

                    $scope.requestObjBeneficiarios = [];

                    $scope.requestObjBeneficiarios.push({
                        codTipoDocumento: PERSONA.CLIENTE.IdentificationTypeCode,
                        valDocumento: PERSONA.CLIENTE.IdentificationNumber.toString(),
                        codRol: 'X',
                        codCondicion: 'X',
                        codTipo: 'X'
                    });

                    angular.forEach($scope.titulares, function (titular, i) {

                        $scope.requestObjBeneficiarios.push({
                            codTipoDocumento: titular.tipoIdentificacion.codigo.split('-')[0],
                            valDocumento: titular.numIdentificacion,
                            codRol: i == 0 ? 'T' : 'A',
                            codCondicion: $filter('filter')(lovs.lov_cdt_tipo_manejo, {
                                desc: $scope.endoso.tipoManejo.desc
                            })[0].codigo,
                            codTipo: 'T' // i == 0 ? 'T' : 'F'
                        });

                    });

                }

            };

            $scope.$watch('endoso.tipoManejo', function (n, o) {

                n = n || {};

                if ((!n.desc || n.desc == 'INDIVIDUAL') && $scope.titulares.length > 1) {

                    $dialog.open({
                        type: 'confirm',
                        content: 'Se eliminarán los titulares secundarios<br>¿desea continuar?'
                    }).then(function () {

                        $scope.titulares = [$scope.titulares[0]];
                        nameSpace.titulares = $scope.titulares;

                    }, function () {

                        $scope.endoso.tipoManejo = o;

                    });

                }

                if ((n.desc && n.desc != 'INDIVIDUAL')) {

                    if ($scope.titulares.length < 2) {

                        $scope.titulares.push({});

                    }

                }

            });

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
                            valValor: numCDT + '_EndosoCDT_' + $filter('date')(date, 'yyyyMMddHHmmss') + '.pdf'
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
                            fechaConsulta: $filter('date')($filter('davDates')(date, 'yyyyMMdd'), 'yyyy-MM-dd'),
                            hora: date.toString().split(" ")[4].slice(0, 5),
                            titulares: titulares,
                            apoderadoAutorizado: apoderadoAutorizado
                        }
                    });

                },

                // CHECK LISTAS RESTRICTIVAS
                checkListas: function (titular) {

                    return $api.cautela.listasRestrictivas({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        tipoIdentificacionTitular: titular.tipoIdentificacionTitular,
                        nroIdentificacionTitular: titular.nroIdentificacionTitular,
                        codigoSolicitud: $filter('lov')('ENDOSAR-CDT', $rootScope.lov.lov_listas_restrictiva_operacion, 'desc', 'codigo'),
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

                consultaCliente: function (persona) {

                    return $api.autenticacion.consultaCliente({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        nroDocumento: persona.nroDocumento
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

                endosarCdtOficina: function () {

                    var adressTypeCode = '';

                    try {

                        adressTypeCode = tipoCliente == 'N' ? $filter('filter')(PERSONA.DIRECCIONES, {
                            DAV_Principal: 'Y'
                        })[0].DAV_AddressTypeCode : $filter('filter')(PERSONA.DIRECCIONES, {
                            Principal: 'Y'
                        })[0].AddressTypeCode;

                    } catch (err) {

                        adressTypeCode = '01';

                    }

                    $scope.$program.armarObjBeneficiarios();

                    return $api.consultaCdt.endosarCdtOficina({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficina,
                        valNumeroCDT: $scope.cdtSeleccionado[0].valNumeroCDT,
                        codAgenteVendedor: $rootScope.$data.codAgenteVendedor,
                        valOperacionCOBIS: 'E',
                        valCodigoProductoRPR: '0510',
                        valCodigoSubProductoRPR: '5150',
                        valTipoManejo: $scope.endoso.tipoManejo.codigo,
                        valClaseDireccionRPR: adressTypeCode,
                        valAlias: '0',
                        valOficina: CONFIG.hostOficina || CONFIG.oficina.toString().slice(-4),
                        beneficiarios: $scope.requestObjBeneficiarios

                    });

                },

                mantenimientoCdt: function (CDT) {

                    return $api.consultaCdt.mantenimientoCdt({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficina,
                        operacion: {
                            valNumeroCDT: CDT
                        },
                        detallePago: [{
                            codTipoDocumento: $scope.titulares[0].tipoIdentificacion.codigo.split('-')[0],
                            valNumeroDocumento: $scope.titulares[0].numIdentificacion,
                            codFormaPago: 'EFEC',
                            // codFormaPago: $scope.endoso.formaPagoIntereses.codigo == '1' ? $scope.endoso.cuentaFormaPagoIntereses.tipo : 'EFEC',
                            valCuentaPro: undefined,
                            // valCuentaPro: $scope.endoso.formaPagoIntereses.codigo == '1' ? $scope.endoso.cuentaFormaPagoIntereses.value : undefined,
                            codMonedaPago: 0,
                            valPorcentaje: 100,
                            codPeriocidadPago: $scope.numCDT[0].codFormaPago, // $scope.cdtSeleccionado.codFormaPago,
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                        }]

                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            // $scope.$gui.validarListasNIC($scope.titulares[0]);
            $scope.$program.lovCuentas();

            // se filtra para mostrar el check que pertenece a la pantalla de apertura
            $scope.lovs.lov_checks_CDT_filtrado = $filter('filter')(lovs.lov_checks_CDT, {
                codigo: checkCdt
            });

        }
    ]);

});
