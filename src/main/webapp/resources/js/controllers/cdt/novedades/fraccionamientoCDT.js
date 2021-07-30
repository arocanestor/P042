/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('fraccionamientoCDTCtrl', [
        '$scope',
        'servicioNumCDT',
        '$rootScope',
        'CONFIG',
        '$slm-dialog',
        '$filter',
        '$api',
        '$timeout',
        '$utilities',
        '$state',
        function (
            $scope,
            servicioNumCDT,
            $rootScope,
            CONFIG,
            $dialog,
            $filter,
            $api,
            $timeout,
            $utilities,
            $state
        ) {


            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,
                checkCdt = 'autoriza-huella-fraccionamiento',
                nameSpace = $rootScope.account[$rootScope.routeApp['3']],
                // N si es natural o J si es juridica para hacer validaciones en el hotmail
                tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';

            $scope.numCDT = servicioNumCDT.cdt;

            $scope.valorTotal = 0;

            $scope.cdtSeleccionado = nameSpace.cdtSeleccionado;
            $scope.fraccionamientos = [];
            $scope.infoCDTFrac = {};

            $scope.sumaTotal = '';
            nameSpace.titulares = [];
            nameSpace.apoderados = [];
            nameSpace.autorizado = {};
            $scope.verFracciones = false;
            $scope.aplicadoFraccionamiento = false;
            $scope.valCDT = $scope.cdtSeleccionado[0].valMontoActualOperacion;
            nameSpace.fraccionamiento = {};
            $scope.form = {
                fraccion: {},
                cambioForma: {}
            };
            $scope.estado = {
                huellas: 'Verifique el registro de huellas',
                tipo: 'attention',
                capitaliza: 'Recuerde que si el cliente desea pago de intereses a Cuenta Davivienda, debe realizarlo por la novedad Forma de pago de intereses.'
            };
            $scope.lovs = nameSpace.lovs;
            $scope.lovs.lov_productos = [];
            $scope.lovs.lov_email = PERSONA.EMAILS;
            $scope.lovs.lov_checks_CDT_filtrado = [];
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

            $scope.nuevosCDTsFraccionados = [];
            $scope.verValidador = false;

            // VALIDATE CHECKS
            $scope.validateChecks = {
                'autoriza-huella-fraccionamiento': false
            };

            // huella capturada
            $scope.biometricData = {};
            $scope.valorTotalSuma = {};
            $scope.valContinuar = '0';

            $scope.caption = {
                // info: 'Una vez el sistema acepte la(s) huella(s) y se seleccione la forma de pago de intereses se puede aplicar el fraccionamiento:',
                info: 'Una vez el sistema acepte la(s) huella(s) se puede aplicar el fraccionamiento:',
                listas: {
                    status: '',
                    content: ''
                },
                confirmacionNic: {
                    status: '',
                    content: ''
                },
                success: '<ul><li><h3>El fraccionamiento se ha aplicado</h3><li>Imprima los nuevos títulos y haga entrega al cliente. </li><li> Al título físico actual debe escribirle “FRACCIONADO”​ y lo debe enviar en el movimiento de la oficina.</li><li>6322AF0000004644 - $500.000,00</li><li>6322AF0000004655  - $500.000,00</li><li>6322AF0000004666  - $500.000,00</li></ul>',
                aceptFraccion: 'Imprima los nuevos titulos fisicos y haga entrega al cliente. Al titulo fisico actual debe escribirle FRACCIONADO y lo debe enviar en el movimiento de la oficina.',
                infoCuenta: 'Recuerde que sólo se habilitarán las Cuentas Davivienda del primer titular del CDT, sólo se puede seleccionar una Cuenta.',
                formaPago: 'Si se selecciona Cuenta Davivienda, los intereses se consignarán automáticamente sin necesidad que el cliente vuelva a la oficina.',
                cdtIncompleto: 'Para aplicar el fraccionamiento debe ingresar todos los datos de los CDT listados y realizar el control biométrico.'
            };

            $scope.dialogs = {
                checkListas: 'Error al verificar al cliente en listas restrictivas. Intente mas tarde',
                fechaMenor: 'EL CLIENTE TIENE SUS DATOS ACTUALIZADOS, puede continuar',
                fechaMayor: 'Recuerde, ACTUALIZAR LOS DATOS DEL CLIENTE, al finalizar el fraccionamiento',
                sinFecha: 'Para continuar, VINCULE EL CLIENTE AL BANCO'
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                // se llama la segunda pantalla donde aparecen los CDT fraccionados.
                aplicarFraccionamiento: function () {

                    $scope.verFracciones = true;
                    $scope.panel = '';
                    $scope.valContinuar = '1';


                },

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

                removeTitular: function (index, array) {

                    $dialog.open({
                        type: 'confirm',
                        content: '¿Desea quitar este elemento?',
                        accept: function () {

                            array.splice(index, 1);

                        }
                    });

                },

                // Por defecto aparece para fraccionar en dos CDT
                fraccionarCDT: function () {

                    var arr = {
                            numero: '1',
                            tipoManejo: '',
                            valorInversion: '',
                            remover: false // para que no aparezca el boton de eliminar en los 2 primeros fraccionamientos
                        },
                        arr2 = {
                            numero: '2',
                            tipoManejo: '',
                            valorInversion: '',
                            remover: false // para que no aparezca el boton de eliminar en los 2 primeros fraccionamientos
                        };

                    $scope.fraccionamientos = [arr, arr2];

                },
                // Agregamos N cantidad de CDT
                agregarFraccionamiento: function (fraccionamientos) {

                    $scope.fraccionamientos.push({
                        numero: fraccionamientos.length + 1,
                        tipoManejo: '',
                        valorInversion: ''
                    });

                },
                // se aggregan maximo 5 titulares.
                agregarTitular: function (titulares) {

                    if (titulares.length <= '4') {

                        titulares.push({
                            tipoIdentificacion: '',
                            numIdentificacion: '',
                            nombres: '',
                            razonsocial: ''
                        });

                    }

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

                resetCamp: function (persona, index) {

                    if (!(
                            $filter('filter')($scope.fraccionamientos[index].titulares, {
                                tipoIdentificacion: {
                                    desc: 'NIT'
                                }
                            }).length
                        )) {

                        $scope.fraccionamientos[index].autorizado = {};

                    }

                    var valido = true;
                    var contadorTitulares = 0;
                    angular.forEach($scope.fraccionamientos[index].titulares, function (value) {

                        if (value.numIdentificacion == persona.numIdentificacion && value.tipoIdentificacion.desc == persona.tipoIdentificacion.desc) {

                            contadorTitulares++;

                        }

                    });

                    var contadorAutorizado = 0;
                    if ($scope.fraccionamientos[index].autorizado.numIdentificacion != undefined) {

                        if ($scope.fraccionamientos[index].autorizado.numIdentificacion == persona.numIdentificacion && $scope.fraccionamientos[index].autorizado.tipoIdentificacion.desc == persona.tipoIdentificacion.desc) {

                            contadorAutorizado++;

                        }

                    }


                    var contadorApoderados = 0;
                    angular.forEach($scope.fraccionamientos[index].apoderados, function (value) {

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

                llenarTabla: function (fraccionamiento) {

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
                    fraccionamiento.apoderados = [];
                    fraccionamiento.titulares = fraccionamiento.tipoManejo.desc == 'ALTERNATIVO' || fraccionamiento.tipoManejo.desc == 'CONJUNTO' ? [arr, arr2] : [{}];
                    fraccionamiento.autorizado = {};
                    fraccionamiento.habilitaApoderado = false;

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

                },

                crearCliente: function () {

                    var contRespBien = 0,
                        contador = 0,
                        verificar = function () {

                            // si el servicio de crearActualizarClienteCobis  responde bien para todos los fraccionaminetos se llama el servicio de fraccionar
                            if (contRespBien == $scope.fraccionamientos.length) {

                                $scope.$program.armarObjlistaCDTsFraccionar();

                                // se llama el servicio de fraccionarCDT
                                $scope.$api.fraccionarCdtOficina().then(function (resp) {

                                    if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

                                        var cdtsFraccionados = '';

                                        $scope.lovs.lov_cdtsFraccionados = [];

                                        for (var i = 0; i < resp.data.cdTsFraccionadosRespuesta.length; i++) {

                                            $scope.nuevosCDTsFraccionados.push(resp.data.cdTsFraccionadosRespuesta[i]);
                                            cdtsFraccionados = cdtsFraccionados + '<li>' + resp.data.cdTsFraccionadosRespuesta[i] + ' - ' + $filter('currency')($scope.fraccionamientos[i].valorInversion) + '</li>';
                                            $scope.lovs.lov_cdtsFraccionados.push(resp.data.cdTsFraccionadosRespuesta[i]);

                                        }
                                        $scope.llamadoConstitucion = 1;
                                        $scope.mensajeConstitucion = '<ul><li><b>El fraccionamiento se ha aplicado</b></li><li> Al título físico actual debe escribirle “FRACCIONADO” y lo debe enviar en el movimiento de la oficina</li><li> Imprima los nuevos títulos y haga entrega al cliente: </li>' + cdtsFraccionados + '</ul>';


                                        // se llama el servicio de mantenimientoCdt para cada cdt fraccionado
                                        angular.forEach($scope.nuevosCDTsFraccionados, function (fraccionamientos, i) {

                                            if ($scope.numCDT[0].codCapitalizaIntereses == 'N') {

                                                $scope.$api.mantenimientoCdt(fraccionamientos, i, $scope.fraccionamientos).then(function (resp) {

                                                    if (resp.data) {

                                                        if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

                                                            $scope.$program.filenet(resp.data.codCDT, i, $scope.fraccionamientos);

                                                        } else {

                                                            $dialog.open({
                                                                status: 'error',
                                                                title: 'MANTENIMIENTO CDT',
                                                                content: 'Ha ocurrido un error inesperado'
                                                            });

                                                        }

                                                    } else {

                                                        $dialog.open({
                                                            status: 'error',
                                                            title: 'MANTENIMIENTO CDT',
                                                            content: resp.headers("Respuesta") || 'Ha ocurrido un error inesperado'
                                                        });

                                                    }



                                                }, function (resp) {

                                                    $dialog.open({
                                                        status: 'error',
                                                        title: 'MANTENIMIENTO CDT',
                                                        content: resp.headers("Respuesta") || 'Ha ocurrido un error inesperado'
                                                    });

                                                });

                                            } else {

                                                $scope.$program.filenet(resp.data.cdTsFraccionadosRespuesta[i], i, $scope.fraccionamientos);

                                            }

                                        });

                                    } else {

                                        $dialog.open({
                                            status: 'error',
                                            title: 'FRACCIONAMIENTO CDT',
                                            content: 'No fue posible aplicar la novedad, intente nuevamente'
                                        });

                                    }



                                }, function (resp) {

                                    $scope.llamadoConstitucion = 2;
                                    $scope.mensajeConstitucion = resp.headers("Respuesta") || "No fue posible aplicar la novedad, intente nuevamente";

                                });


                            }

                        };

                    // se llama el servicio de crearActualizarClienteCobis por cada fraccionamiento
                    angular.forEach($scope.fraccionamientos, function (fraccionamiento, i) {

                        $scope.$program.armarObjCreaActualiza(fraccionamiento);

                        $scope.$api.crearActualizarClienteCobis().then(function (resp) {

                            // contador para saber si respondio bien el servicio para todos los fraccionamientos
                            contRespBien++;
                            contador++;

                        }, function (resp) {

                            $scope.llamadoConstitucion = 2;
                            $scope.mensajeConstitucion = resp.headers("Respuesta") || "No fue posible realizar la creación del CDT " + fraccionamiento.numero + ", por favor intente nuevamente";
                            contador++;

                        }).finally(function () {

                            if (contador == $scope.fraccionamientos.length) {

                                verificar();

                            }

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

                    if ($scope.$program.validarHuellasCapturadas()) {

                        $scope.estado.huellas = "Tarjeta de firmas digitales creada correctamente";
                        $scope.estado.tipo = "success";

                    } else {

                        $scope.estado.huellas = "Verifique el registro de huellas";
                        $scope.estado.tipo = "attention";

                    }

                },

                filenet: function (codCDT, i, fraccionamientos) {

                    $scope.$api.guardaPdfFilenet(i, fraccionamientos).then(function (response) {

                        if (response.data) {

                            if (response.data.caracterAceptacion === 'B' && response.data.codMsgRespuesta === '0') {

                                if (response.data.idPdf) {

                                    $scope.$api.fileNet(response.data.idPdf, codCDT, i).then(function (response) {

                                        if (response.data.caracterAceptacion === "B" && response.data.valIdDocumento) {

                                            $dialog.open({
                                                status: 'success',
                                                content: 'El documento se ha envíado a Filenet correctamente para el CDT: ' + codCDT
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

                validarFormularios: function (fraccionamiento) {

                    var valid = true,
                        validar = function (fraccionamiento) {

                            if (!fraccionamiento.form) {

                                return;

                            }
                            // eliminado regla (|| (fraccionamiento.form.intereses && !fraccionamiento.form.intereses.$valid))
                            if ((fraccionamiento.form.cabecera && !fraccionamiento.form.cabecera.$valid) || (fraccionamiento.form.nit && !fraccionamiento.form.nit.$valid) || (fraccionamiento.form.apoderado && !fraccionamiento.form.apoderado.$valid)) {

                                return false;

                            }

                            return true;

                        };

                    if (fraccionamiento) {

                        valid = validar(fraccionamiento);

                    } else {

                        angular.forEach($scope.fraccionamientos, function (fraccionamiento) {

                            valid = validar(fraccionamiento);

                        });

                    }

                    return !valid;

                },

                armarObjCreaActualiza: function (fraccionamiento) {

                    $scope.requestObjRegistros = [];

                    angular.forEach(fraccionamiento.titulares, function (titular, i) {

                        if (titular.tipoIdentificacion.codigo.split('-')[1] == 'N' && titular.codSexo) {

                            $scope.requestObjRegistros.push({
                                informacionPersona: {
                                    codTipoDocumento: titular.tipoIdentificacion.codigo.split('-')[0],
                                    valNumeroDocumento: titular.numIdentificacion,
                                    valNombres: titular.nombre,
                                    valPrimerApellido: titular.primerApellido,
                                    valSegundoApellido: titular.segundoApellido,
                                    valRazonSocial: titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? undefined : titular.razonsocial,
                                    valNombreLargo: titular.nombres || titular.razonsocial,
                                    codSubtipo: titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? 'P' : 'C',
                                    codOficina: CONFIG.hostOficina || (CONFIG.oficina.toString().slice(-4)),
                                    fecCreacionCliente360: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                    fecModificacion: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                    codTipoCompania: titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? undefined : titular.codCompañia || '00',
                                    codAsociada: (function () {

                                        var code = '';

                                        if (['00', '02', '04'].indexOf(titular.codAsociada) != -1) {

                                            code = titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? '0005' : '0021';

                                        } else {

                                            code = titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? '0003' : '0023';

                                        }

                                        return code;

                                    }()),
                                    codPais: titular.codPais ? titular.codPais : '169',
                                    codPaisResidencia: titular.codPaisResidencia ? titular.codPaisResidencia : '169',
                                    codActividad: titular.codActividad || '',
                                    fecNacimientoOConstitucion: titular.fecNacimientoOConstitucion ? titular.fecNacimientoOConstitucion : '1900-01-01T19:00:00.000-05:00',
                                    codSexo: titular.codSexo,
                                    valPasaporte: titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? (titular.valPasaporte || undefined) : undefined,
                                    codIvc: titular.codIvc || '0',
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

                        } else {

                            $scope.requestObjRegistros.push({
                                informacionPersona: {
                                    codTipoDocumento: titular.tipoIdentificacion.codigo.split('-')[0],
                                    valNumeroDocumento: titular.numIdentificacion,
                                    valNombres: titular.nombre,
                                    valPrimerApellido: titular.primerApellido,
                                    valSegundoApellido: titular.segundoApellido,
                                    valRazonSocial: titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? undefined : titular.razonsocial,
                                    valNombreLargo: titular.nombres || titular.razonsocial,
                                    codSubtipo: titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? 'P' : 'C',
                                    codOficina: CONFIG.hostOficina || CONFIG.oficina.toString().slice(-4),
                                    fecCreacionCliente360: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                    fecModificacion: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                    codTipoCompania: titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? undefined : titular.codCompañia || '00',
                                    codAsociada: (function () {

                                        var code = '';

                                        if (['00', '02', '04'].indexOf(titular.codAsociada) != -1) {

                                            code = titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? '0005' : '0023';

                                        } else {

                                            code = titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? '0003' : '0021';

                                        }

                                        return code;

                                    }()),
                                    codPais: titular.codPais ? titular.codPais : '169',
                                    codPaisResidencia: titular.codPaisResidencia ? titular.codPaisResidencia : '169',
                                    codActividad: titular.codActividad || '',
                                    fecNacimientoOConstitucion: titular.fecNacimientoOConstitucion ? titular.fecNacimientoOConstitucion : '1900-01-01T19:00:00.000-05:00',
                                    valPasaporte: titular.tipoIdentificacion.codigo.split('-')[1] == 'N' ? (titular.valPasaporte || undefined) : undefined,
                                    codIvc: titular.codIvc || '0',
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

                        }



                    });

                },

                armarObjlistaCDTsFraccionar: function () {

                    $scope.requestObjlistaCDTsFraccionar = [];

                    angular.forEach($scope.fraccionamientos, function (fraccionamiento, i) {

                        $scope.$program.armarObjBeneficiarios(fraccionamiento);

                        $scope.requestObjlistaCDTsFraccionar.push({
                            infoTipoManejo: {
                                valTipoManejo: fraccionamiento.tipoManejo.codigo
                            },
                            beneficiarios: $scope.requestObjBeneficiarios, // aqui
                            movimientosMonetarios: [{
                                codTipoDocumento: $scope.requestObjBeneficiarios[0].codTipoDocumento, // CONFIG.idType,
                                valDocumento: $scope.requestObjBeneficiarios[0].valDocumento, // CONFIG.idNumber,
                                codMoneda: $scope.cdtSeleccionado.codMoneda,
                                codProducto: 'EFEC',
                                valMovimiento: fraccionamiento.valorInversion,
                                fechaMovimiento: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00'),
                                codOficina: CONFIG.hostOficina || CONFIG.oficina.toString().slice(-4)
                            }]

                        });

                    });

                },

                armarObjBeneficiarios: function (fraccionamiento) {

                    $scope.requestObjBeneficiarios = [];

                    angular.forEach(fraccionamiento.titulares, function (titular, i) {

                        $scope.requestObjBeneficiarios.push({
                            codTipoDocumento: titular.tipoIdentificacion.codigo.split('-')[0],
                            valDocumento: titular.numIdentificacion,
                            codRol: i == 0 ? 'T' : 'A',
                            codCondicion: $filter('filter')($scope.lovs.lov_cdt_tipo_manejo, {
                                desc: fraccionamiento.tipoManejo.desc
                            })[0].codigo,
                            codTipo: 'T' // i == 0 ? 'T' : 'F'
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

                // se suma el valor de la inversion en los nuevos tipos de manejo
                sumarValor: function (fraccionamientos) {

                    var valorTotal = 0;
                    angular.forEach(fraccionamientos, function (value) {

                        valorTotal += Number(value.valorInversion);

                    });

                    $scope.valorTotalSuma = valorTotal;

                    return valorTotal;

                },

                // valida si quedo alguna persona sin capturar huella para deshabilitar el boton de aplicar fraccionamiento
                validarHuellasCapturadas: function () {

                    var huellasCapturadasTitulares = true,
                        huellasCapturadasApoderados = true,
                        huellasCapturadasAutorizado = true;

                    angular.forEach($scope.fraccionamientos, function (fraccionamiento, i) {

                        var tamaño = fraccionamiento.apoderados ? fraccionamiento.apoderados.length : 0;
                        var fraccionamientoAutorizado = fraccionamiento.autorizado ? (Boolean(fraccionamiento.autorizado.tipoIdentificacion)) : false;

                        if (tamaño != 0) {

                            angular.forEach(fraccionamiento.apoderados, function (apoderado, i) {

                                if (apoderado.huellaCapturada === null || apoderado.huellaCapturada === false) {

                                    huellasCapturadasApoderados = false;
                                    return;

                                }

                            });

                        } else if (fraccionamientoAutorizado) {

                            if (fraccionamiento.autorizado.tipoIdentificacion && (fraccionamiento.autorizado.huellaCapturada === null || fraccionamiento.autorizado.huellaCapturada === false)) {

                                huellasCapturadasAutorizado = false;

                            }

                        } else if (fraccionamiento.titulares) {

                            angular.forEach(fraccionamiento.titulares, function (titular, i) {

                                if (titular.huellaCapturada === null || titular.huellaCapturada === false) {

                                    huellasCapturadasTitulares = false;
                                    return;

                                }

                            });

                        } else {

                            huellasCapturadasTitulares = false;
                            return;

                        }

                    });
                    return huellasCapturadasTitulares && huellasCapturadasApoderados && huellasCapturadasAutorizado;

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

                consultaTipoDepositoProductoSolicitud: function (numeroCDT, codTDepo) {

                    return $api.Cdat.consultaTipoDepositoProductoSolicitud({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        // solo se envia para cuando se hace llamado desde cdt porque se necesita enviar otro codOficina diferente al de cdat
                        producto: 'cdt',
                        contextoRequerimiento: {
                            idTransaccional: 'ConsultaTipoDepositoProductoSolicitud'
                            // valDireccionIpConsumidor: "90.4.3.5"
                        },
                        consultarTipoDeposito: {
                            codTipoDeposito: $scope.cdtSeleccionado[0].codTipoOperacion,
                            valNumeroCDT: $scope.cdtSeleccionado[0].valNumeroCDT,
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                            codMoneda: '0'
                        }
                    });

                },

                fileNet: function (idPdf, numCDT, numFraccionamiento) {

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
                            valValor: Number($scope.fraccionamientos[numFraccionamiento].titulares[0].tipoIdentificacion.codigo.split('-')[0])
                        }, {
                            valLlave: 'numeroIdentificacion',
                            valValor: $scope.fraccionamientos[numFraccionamiento].titulares[0].numIdentificacion
                        }, {
                            valLlave: 'tipoDocumento',
                            valValor: 'AprobacionCDT'
                        }, {
                            valLlave: 'DocumentTitle',
                            valValor: numCDT + '_FraccionarCDT_' + $filter('date')(date, 'yyyyMMddHHmmss') + '.pdf'
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

                guardaPdfFilenet: function (index, fraccionamiento) {

                    var date = new Date();
                    var titulares = [];
                    var apoderadoAutorizado = [];
                    var grados = ["Primer", "Segundo", "Tercer", "Cuarto", "Quinto"];

                    if (fraccionamiento[index].titulares && fraccionamiento[index].titulares.length != 0) {

                        angular.forEach(fraccionamiento[index].titulares, function (value, index) {

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

                // CHECK LISTAS RESTRICTIVAS
                checkListas: function (titular) {

                    return $api.cautela.listasRestrictivas({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        tipoIdentificacionTitular: titular.tipoIdentificacionTitular,
                        nroIdentificacionTitular: titular.nroIdentificacionTitular,
                        codigoSolicitud: $filter('lov')('FRACCIONAR-CDT', $rootScope.lov.lov_listas_restrictiva_operacion, 'desc', 'codigo'),
                        fechaNacimiento: titular.fechaNacimientoConstitucion || undefined,
                        genero: titular.genero || undefined,
                        nombre: titular.nombre,
                        valPaisNacimiento: titular.paisNacimientoConstitucion || undefined,
                        codTipo: titular.natural ? 'N' : 'J'
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

                mantenimientoCdt: function (fraccionamientoNum, index, fraccionamiento) {

                    return $api.consultaCdt.mantenimientoCdt({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficinaTotal,
                        operacion: {
                            valNumeroCDT: fraccionamientoNum
                            // codAgenteVendedor: CONFIG.employee.davIdentificationNumber2,
                            // codOficinaSiebel: CONFIG.oficina.toString().slice(-4)
                        },
                        detallePago: [{
                            codTipoDocumento: fraccionamiento[index].titulares[0].tipoIdentificacion.codigo.split('-')[0],
                            valNumeroDocumento: fraccionamiento[index].titulares[0].numIdentificacion,
                            codFormaPago: 'EFEC', // falta
                            valCuentaPro: undefined, // falta
                            codMonedaPago: 0,
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                            valPorcentaje: 100,
                            codPeriocidadPago: $scope.numCDT[0].codFormaPago
                        }]

                    });

                },

                fraccionarCdtOficina: function () {

                    var adressTypeCode = tipoCliente == 'N' ? $filter('filter')(PERSONA.DIRECCIONES, {
                        DAV_Principal: 'Y'
                    })[0].DAV_AddressTypeCode : $filter('filter')(PERSONA.DIRECCIONES, {
                        Principal: 'Y'
                    })[0].AddressTypeCode;

                    return $api.consultaCdt.fraccionarCdtOficina({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficinaTotal,
                        contextoRequerimiento: {
                            idTransaccional: $filter('date')(new Date(), 'yyyyMMddHHmmss')
                        },
                        informacionCDTOriginal: {
                            codAgenteVendedor: $rootScope.$data.codAgenteVendedor,
                            codOficinaSiebel: CONFIG.hostOficina || CONFIG.oficina.toString().slice(-4),
                            valNumeroCDT: $scope.cdtSeleccionado[0].valNumeroCDT
                        },
                        informacionRPR: {
                            valCodigoProductoRPR: '0510',
                            valCodigoSubProductoRPR: '5150',
                            valClaseDireccionRPR: adressTypeCode,
                            valAlias: '0',
                            valOficina: CONFIG.oficina.toString().slice(-4)
                        },
                        listaCDTsFraccionar: $scope.requestObjlistaCDTsFraccionar

                    });

                }
            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */
            $scope.$program.lovCuentas();
            $scope.$gui.fraccionarCDT();

            // se filtra para mostrar el check que pertenece a la pantalla de apertura
            $scope.lovs.lov_checks_CDT_filtrado = $filter('filter')($scope.lovs.lov_checks_CDT, {
                codigo: checkCdt
            });

            $scope.$api.consultaTipoDepositoProductoSolicitud().then(function (resp) {

                var depositos = resp.data.depositos;

                if (depositos.length > 0) {

                    $scope.infoCDTFrac = depositos[0];
                    $scope.infoCDTFrac.montoMin = Number(depositos[0].rangoMontos[0].valMontoMin) - 1;
                    $scope.infoCDTFrac.montoMax = Number(depositos[0].rangoMontos[0].valMontoMax) + 1;

                }

            }, function (resp) {

                $dialog.open({
                    status: 'error',
                    content: resp.data || 'Ha ocurrido un error inesperado'
                });

            });


        }
    ]);

});
