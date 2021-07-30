define(['../../app'], function (app) {

    'use strict';
    app.controller('evaxpressCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        '$slm-dialog',
        'CONFIG',
        '$filter',
        '$state',
        '$utilities',
        'lovs',
        '$spaUtils',
        'actualizaSiebel',
        function ($scope, $rootScope, $api, $dialog, CONFIG, $filter, $state, $utilities, lovs, $spaUtils, $siebel) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            var nameSpace = $rootScope.account[$rootScope.routeApp['5']],
                CLIENTE = $rootScope.CLIENT.CLIENTE,
                CLIENTE_ALL = $rootScope.CLIENT,
                tiposIdentificacion = $filter('filter')($rootScope.lov.lov_tipo_id_venta_linea, {
                    codigo: 1
                })[0] || {};

            $scope.hoy = new Date();

            $scope.textos = nameSpace.textos;
            $scope.lovs = nameSpace.lovs;
            $scope.lov_msg = nameSpace.lovs.lov_msg_venta_xpress_obj;

            $scope.idDocumentoPagare = '';

            $scope.autorizaciones = false;

            $scope.lovs.lov_mensajes_Xpress = lovs.lov_mensajes_Xpress;

            // $scope.form = {};
            $scope.datosBasicos = $rootScope.datosBasicos;
            $scope.actividades = $rootScope.actividades;
            $scope.actividad = {};
            $scope.ubicacion = $rootScope.ubicacion;
            $scope.evaluacion = {
                estado: '',
                monto: ''
            };

            $scope.aceptado = false;

            $scope.caption = {
                exito: 'La solicitud ha sido aprobada',
                error: 'La solicitud ha sido negada',
                info: $scope.lov_msg['paso-uno-evaluacion'].desc,
                resultSimulacion: '<ul gui="list"><li> ' + $scope.lov_msg['si-acepta-oferta'].desc + '</li><li>' + $scope.lov_msg['si-no-invitelo'].desc + '</li><li>' + $scope.lov_msg['no-acepta'].desc + '</li></ul>',
                info1: $scope.lov_msg['solicite-huella'].desc,
                paso3: $scope.lov_msg['paso-3-evaluacion'].desc,
                listas: {
                    status: '',
                    content: ''
                },
                autoriza: $scope.lov_msg.autoriza.desc,
                negado: $filter('lov')('negado', $scope.lovs.lov_mensajes_Xpress)
            };

            $scope.continuar = true;

            $scope.tarjeta = $rootScope.tarjeta;

            $scope.fechaNacimiento = $filter('date')(new Date(CLIENTE.Fechadenacimiento), 'yyyy-MM-dd');

            // Direccion 02
            var direccion = [];

            if (!CLIENTE_ALL.DIRECCIONES) {

                CLIENTE_ALL.DIRECCIONES = [];

            }

            direccion = ($filter('filter')(CLIENTE_ALL.DIRECCIONES, {
                DAV_ClaseDireccionCode: '02'
            })[0] || {
                DAV_PersonaMunicipalityDesc: '',
                DAV_PersonaDepartmentDesc: '',
                StreetAdress: ''
            });

            $scope.Telefono02 = 0;

            angular.forEach(CLIENTE_ALL.TELEFONOS, function (obj, i) {

                if (obj.TelephoneType == '02') {

                    $scope.Telefono02 = obj.Number;

                }

            });

            if (!CLIENTE_ALL.INGRESOS) {

                CLIENTE_ALL.INGRESOS = [];

            }

            // ////////////////// Actividad Laboral
            var ingresos = ($filter('filter')(CLIENTE_ALL.INGRESOS, {
                Principal: 'Y'
            })[0] || CLIENTE_ALL.INGRESOS[0] || {
                ActividadEconomica: '',
                Valor: '',
                NITEmpresa: '',
                NombreEmpresa: '',
                ProfesionDesc: '',
                FechaInicio: '',
                FechaFin: '',
                Tipo: '',
                TipoActividadLaboral: ''
            });

            if (!CLIENTE_ALL.EGRESOS) {

                CLIENTE_ALL.EGRESOS = [];

            }

            $scope.actividad.egresos = (($filter('filter')(CLIENTE_ALL.EGRESOS, {
                Tipo: 'Arriendo'
            })[0] || {
                Monto: ''
            }));

            if (!CLIENTE_ALL.ACTIVOS_PROPIEDADES_VEHICULOS) {

                CLIENTE_ALL.ACTIVOS_PROPIEDADES_VEHICULOS = [];

            }
            $scope.actividad.activosPropiedades = (($filter('filter')(CLIENTE_ALL.ACTIVOS_PROPIEDADES_VEHICULOS, {
                CodigoTipo: '1'
            })[0] || {
                CiudaddelInmueble: '',
                ValorComercial: '',
                PlacaVehiculo: ''
            }));

            if (!CLIENTE_ALL.RELACIONES) {

                CLIENTE_ALL.RELACIONES = [];

            }
            $scope.actividad.relaciones = (($filter('filter')(CLIENTE_ALL.RELACIONES, {
                ClaseDeRelacion: '3'
            })[0] || {
                ClaseDeRelacionGlosa: '',
                IdentifTypeRelacionadoDesc: '',
                IdentifNumberRelacionado: '',
                NombreRelacionado: '',
                PrimerApellidoRelacionado: '',
                SegundoApellidoRelacionado: '',
                TipoRelacion: ''
            }));

            //  VALIDATE CHECKS
            $scope.checksValidate = {
                'pagare': true,
                'autoriza-huella': true
            };

            $scope.biometricData = {};
            $scope.habilitarEvaluacion = false;
            $scope.casbData = $spaUtils.compareBiometric(5) ? $rootScope.autenticacion : undefined;
            $scope.causalesNeg = '';

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            var destroyOn = $rootScope.$on('event:close', function (event, toState, toParams, fromState, fromParams) {

                if (!$scope.aceptado) {

                    $scope.$api.guardarTraza($rootScope.estado, $scope.causalesNeg, $rootScope.estado == 'NEG' ? '' : 'Declinado', '', "Existente", '', '');
                    $scope.aceptado = true;

                }

            });

            $rootScope.$on('$destroy', function () {

                destroyOn(); // remove listener.

            });

            $scope.mostrarAutorizaciones = function () {

                $scope.autorizaciones = true;
                $rootScope.autorizacion = true;

            };

            $scope.quitarAutorizaciones = function () {

                $scope.autorizaciones = false;
                $rootScope.autorizacion = false;

            };


            $scope.$gui = {

                assistant: false,
                pdf: {
                    huella: {},
                    huellaCapturada: false
                },


                bioCapture: function (data) {

                    $scope.biometricData = data;
                    // si la huella es correcta se consume el servicio de constitucionCDAT
                    if (data.base64 && $spaUtils.compareBiometric(5) ? data.autenticado : true) {

                        $scope.habilitarEvaluacion = true;
                        return;

                    }

                    $scope.habilitarEvaluacion = false;

                },

                continuar: function () {

                    $scope.evaluacion.estado = 'CON';

                },

                continuarBiometrico: function () {

                    $scope.evaluacion.estado = 'CON';

                },

                desistir: function () {

                    $scope.$api.guardarTraza($rootScope.estado, $scope.causalesNeg, $rootScope.estado == 'NEG' ? '' : 'Declinado', '', 'Existente', '', '');
                    $scope.aceptado = true;
                    $spaUtils.disableProduct('5');
                    $state.go('app');

                },

                evaluar: function () {

                    // $scope.evaluacion.causal = '<ul>';
                    // $scope.evaluacion.causal += '<li><bold>Causal 1:</bold> TN040 - Negado. No cumple el Ingreso Minimo</li>';
                    // $scope.evaluacion.causal += '<li>Causal 2: TN059 - Negado. Capacidad de Endeudamiento</li>';
                    // $scope.evaluacion.causal += '</ul>';

                    var evaluar = function () {

                        $scope.$api.evaluadorLight().then(function (resp) {

                            if (resp.estadoSolicitud != 'ERROR') {

                                if (resp.solicitud.decisionSolicitud.decisionCategory == 'APR') {

                                    $rootScope.estado = 'APR';
                                    $scope.evaluacion.estado = 'APR';

                                    $siebel.actualizaSiebel({
                                        customComments: 'APR - Venta en Linea: '
                                    });

                                    $scope.evaluacion.monto = resp.solicitud.productos[0].montoMaximo;

                                } else if (resp.solicitud.decisionSolicitud.decisionCategory == 'NEG') {

                                    $rootScope.estado = 'NEG';
                                    $scope.evaluacion.estado = 'NEG';
                                    $siebel.actualizaSiebel({
                                        customComments: '--- Resumen: NEG - Venta en Linea:'
                                    });
                                    $scope.evaluacion.causal = '<ul>';
                                    $scope.evaluacion.causal += resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I1 ? '<li>Causal 1: ' + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I1 + '</li>' : '';
                                    $scope.evaluacion.causal += resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I2 ? '<li>Causal 2: ' + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I2 + '</li>' : '';
                                    $scope.evaluacion.causal += resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I3 ? '<li>Causal 3: ' + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I3 + '</li>' : '';
                                    $scope.evaluacion.causal += resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I4 ? '<li>Causal 4: ' + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I4 + '</li>' : '';
                                    $scope.evaluacion.causal += resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I5 ? '<li>Causal 5: ' + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I5 + '</li>' : '';
                                    $scope.evaluacion.causal += '</ul>';

                                    $scope.causalesNeg = (resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I1 || '') + ((" " + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I2) || '') + ((" " + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I3) || '') + ((" " + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I4) || '') + ((" " + resp.solicitud.productos[0].politicasProd.sortedReasonCodeTable.I5) || '');

                                }

                            } else {

                                $dialog.open({
                                    status: 'error',
                                    title: 'EVALUACIÓN',
                                    content: 'Error: <b>' + resp.errores.error.descripcion + '</b><br>Error al evaluar'
                                }).then(function () {

                                    $dialog.open({
                                        type: 'confirm',
                                        content: '¿Desea intentar nuevamente?'
                                    }).then(function () {

                                        evaluar();

                                    }, function () {

                                        $scope.$api.guardarTraza('err', (resp.errores.error.descripcion || 'Ha ocurrido un error inesperado'), '', "Fallido", "Existente", '', '');
                                        $scope.aceptado = true;
                                        $spaUtils.disableProduct('5');
                                        $state.go('app');

                                    });

                                });

                            }

                        });

                    };

                    evaluar();

                },

                generacionDocDesembolso: function () {

                    $scope.$api.generacionDocumentosDesembolso().then(function (response) {

                        $scope.$api.guardarTraza('APR', $scope.causalesNeg, 'Aceptado', "Exitoso", "Existente", $scope.idDocumentoPagare, ('************' + $rootScope.numeroDeTarjeta.toString().slice(-4)));

                        $siebel.actualizaSiebel({
                            customComments: 'Numero de Producto Originado: ************' + $rootScope.numeroDeTarjeta.toString().slice(-4) + ' - ' + nameSpace.title.normalize('NFKD').replace(/[\u0300-\u036F]/g, "")
                        });
                        $scope.aceptado = true;

                        $state.go('app.tarjeta-movil.xpress.evaluacion.confirmacion');

                    }, function (response) {

                        $dialog.open({
                            type: 'confirm',
                            title: 'GENERACIÓN DOCUMENTOS',
                            content: (response.data || 'Ha ocurrido un error inesperado') + '<br> Error al generar documentos.<br>Intente Nuevamente',
                            accept: function () {

                                $scope.$gui.generacionDocDesembolso();

                            },
                            cancel: function () {

                                $scope.$api.guardarTraza($rootScope.estado, $scope.causalesNeg, 'Declinado', "Exitoso", "Existente", $scope.idDocumentoPagare, "");
                                $scope.aceptado = true;
                                $spaUtils.disableProduct('5');
                                $state.go('app');

                            }
                        });

                    });

                },

                asignarMedio: function () {

                    $scope.$api.asignarMedio().then(function (resp) {

                        $rootScope.numeroDeTarjeta = resp.data.numeroDeTarjeta;

                        $scope.$gui.generacionDocDesembolso();


                    }, function (resp) {

                        $dialog.open({
                            type: 'confirm',
                            title: 'ASIGNAR MEDIO',
                            content: (resp.data || 'Ha ocurrido un error inesperado') + '<br> Intente Nuevamente',
                            accept: function () {

                                $scope.$gui.asignarMedio();

                            },
                            cancel: function () {

                                $scope.$api.guardarTraza($rootScope.estado, $scope.causalesNeg, 'Declinado', "Exitoso", "Existente", $scope.idDocumentoPagare, "");
                                $scope.aceptado = true;
                                $spaUtils.disableProduct('5');
                                $state.go('app');

                            }
                        });

                    });

                },

                crearPagare: function () {

                    $scope.$api.crearPagare().then(function (resp) {

                        $scope.idDocumentoPagare = resp.data.idDocumentoPagare;
                        $scope.$gui.asignarMedio();

                    }, function (resp) {

                        $dialog.open({
                            type: 'confirm',
                            title: 'CREAR PAGARÉ',
                            content: (resp.data || 'Ha ocurrido un error inesperado') + '<br>¿Desea intentar Nuevamente?',
                            accept: function () {

                                $scope.$gui.crearPagare();

                            },
                            cancel: function () {

                                $scope.$api.guardarTraza($rootScope.estado, $scope.causalesNeg, 'Declinado', "Fallido", "Existente", '', '');
                                $scope.aceptado = true;
                                $spaUtils.disableProduct('5');
                                $state.go('app');

                            }
                        });

                    });

                }
            };



            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$program = {};

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                guardarTraza: function (resultado, causal, decisionCliente, generacionPagare, estadoCliente, numPagare, numTarjeta) {

                    return $api.pdf.guardarTraza({
                        rowId: CONFIG.rowId,
                        oficina: CONFIG.oficina,
                        asesor: CONFIG.usuario,
                        tipoId: CONFIG.idType,
                        numId: CONFIG.idNumber,
                        nombre: CONFIG.firstName,
                        apellido: CONFIG.lastName,
                        productoSolicitud: $scope.tarjeta,
                        resultado: resultado,
                        cupoAprobado: $scope.evaluacion.monto,
                        causalNeg: causal,
                        decisionCliente: decisionCliente,
                        puntoEntrega: $scope.ubicacion.DirRecidencia,
                        generacionPagare: generacionPagare,
                        estadoCliente: estadoCliente,
                        autorizacionCentrales: true,
                        numTarjeta: numTarjeta,
                        numPagare: numPagare
                    });

                },

                evaluadorLight: function () {

                    var ingesosEmpleado = 0,
                        encontroIE = false,
                        ingresosIndependiente = 0,
                        encontroInd = false,
                        ingresosPensionado = 0,
                        encontroP = false,
                        niveltasTarjetas = $filter('filter')(nameSpace.lovs.lov_niveles_tarjetas_express, {
                            codigo: 'OFVG'
                        }, true)[0].desc.split(';') || '',
                        actividadesLaborales = [];


                    if ($rootScope.estado == 1) {

                        angular.forEach(CLIENTE_ALL.INGRESOS, function (ingreso, i) {

                            if (ingreso.Principal == 'Y') {

                                actividadesLaborales.push({
                                    ActividadLaboral: {
                                        actividadLaboral: ingreso.TipoActividadLaboralCodigo,
                                        flagPrincipal: 'S',
                                        actividadEconomica: ingreso.ActividadEconomica,
                                        flagFraudeEmpresa: ingreso.valFlagFraudeEmpresaIN || 'N'
                                    }
                                });

                            }


                            var fechaValida = true;
                            if (ingreso.FechaFin) {

                                var fechaFin = new Date(ingreso.FechaFin),
                                    actual = new Date();
                                if (fechaFin <= actual) {

                                    fechaValida = false;

                                }

                            }

                            if (fechaValida) {

                                if (ingreso.TipoActividadLaboralCodigo == 'E' || ingreso.TipoActividadLaboralCodigo == 'R' || ingreso.TipoActividadLaboralCodigo == 'D') {

                                    encontroIE = true;
                                    ingesosEmpleado += ingreso.Valor;

                                } else if (ingreso.TipoActividadLaboralCodigo == 'I' || ingreso.TipoActividadLaboralCodigo == 'S') {

                                    encontroInd = true;
                                    ingresosIndependiente += ingreso.Valor;

                                } else if (ingreso.TipoActividadLaboralCodigo == 'P') {

                                    encontroP = true;
                                    ingresosPensionado += ingreso.Valor;

                                }

                            }

                        });

                    } else {

                        angular.forEach($scope.actividades, function (ingreso, i) {

                            actividadesLaborales.push({
                                ActividadLaboral: {
                                    actividadLaboral: ingreso.ActividadLaboral,
                                    flagPrincipal: 'S',
                                    actividadEconomica: ingreso.CodigoCIIUActividadEconomica,
                                    flagFraudeEmpresa: 'N'
                                }
                            });

                            if (ingreso.ActividadLaboral == 'E' || ingreso.ActividadLaboral == 'R' || ingreso.ActividadLaboral == 'D') {

                                encontroIE = true;
                                ingesosEmpleado += Number(ingreso.IngresoMensual);

                            } else if (ingreso.ActividadLaboral == 'I' || ingreso.ActividadLaboral == 'S') {

                                encontroInd = true;
                                ingresosIndependiente += Number(ingreso.IngresoMensual);

                            } else if (ingreso.ActividadLaboral == 'P') {

                                encontroP = true;
                                ingresosPensionado += Number(ingreso.IngresoMensual);

                            }

                        });

                    }

                    if (!encontroIE) {

                        ingesosEmpleado = $scope.actividad.IngresoMensual || ingesosEmpleado || 0;

                    }
                    if (!encontroInd) {

                        ingresosIndependiente = $scope.actividad.IngresoMensual || ingresosIndependiente || 0;

                    }
                    if (!encontroP) {

                        ingresosPensionado = $scope.actividad.IngresoMensual || ingresosPensionado || 0;

                    }


                    return $api.evaluador.evaluadorLight({
                        Solicitud: {
                            numeroSolicitud: CONFIG.rowId,
                            numeroSolicitantes: 1,
                            numeroProductosSolicitados: 1,
                            fechaSolicitud: $filter('date')(new Date(), 'yyyy-MM-dd'),
                            agente: CONFIG.employee.davIdentificationNumber2,
                            oficina: CONFIG.employee.listOfEmployeePosition.employeePosition[0].division,
                            canal: 'OFIC',
                            flagCampanaFirme: 'N',
                            estadoOportunidad: '03',
                            grupoProductoRPRBuro: '0120',
                            grupoSubproductoRPRBuro: '3150',
                            flagFraudeVendedor: CLIENTE.flagFraudeEjecutivo || 'N',
                            flagFraudeCentroNegocio: CLIENTE.flagFraudeOficinaVinculacion || 'N'
                        },
                        Solicitantes: [{
                            Solicitante: {
                                esFuncionarioBanco: CLIENTE.flagReIntoGrupoBolivar || 'N',
                                numeroIdentificacion: CLIENTE.IdentificationNumber,
                                primerApellido: CLIENTE.PrimerApellido,
                                tipoIdentificacion: CONFIG.idType,
                                tipoPersona: 'N',
                                tipoSolicitante: '1',
                                flagFraudeCliente: CLIENTE.FlagFraudeCliente,
                                fechaNacimiento: $scope.fechaNacimiento,
                                metodoDeclarado: {
                                    ingresosEmpleado: ingesosEmpleado || '0',
                                    ingesoIndependiente: ingresosIndependiente || '0',
                                    ingresosPensionado: ingresosPensionado || '0'
                                },
                                metodoCertificados: [{
                                    MetodoCertificado: {
                                        numeroDeMetodoCertificado: '3',
                                        ingreso: CLIENTE.IngresoEspecialista || '-1'
                                    }
                                }],
                                actividadesLaborales: actividadesLaborales
                            }
                        }],
                        Productos: [{
                            Producto: {
                                codIdProducto: CONFIG.rowId,
                                tipo: 'SC',
                                familia: niveltasTarjetas[0],
                                nivelesProducto: [{
                                    NivelProducto: {
                                        numeroNivel: '1',
                                        valorNivel: niveltasTarjetas ? niveltasTarjetas[1] : ''
                                    }
                                }, {
                                    NivelProducto: {
                                        numeroNivel: '2',
                                        valorNivel: niveltasTarjetas ? niveltasTarjetas[2] : ''
                                    }
                                }, {
                                    NivelProducto: {
                                        numeroNivel: '3',
                                        valorNivel: niveltasTarjetas ? niveltasTarjetas[3] : ''
                                    }
                                }, {
                                    NivelProducto: {
                                        numeroNivel: '4',
                                        valorNivel: niveltasTarjetas ? niveltasTarjetas[4] : ''
                                    }
                                }, {
                                    NivelProducto: {
                                        numeroNivel: '5',
                                        valorNivel: niveltasTarjetas ? niveltasTarjetas[5] : ''

                                    }
                                }],
                                amortizacion: '2',
                                moneda: '1',
                                tipoTasa: '1',
                                plazoSolicitado: '24',
                                montoSolicitado: '0',
                                seguros: [{
                                    Seguro: {
                                        tipoSeguro: 'A',
                                        tasaFinal: '-1',
                                        flagSeguro: 'N'
                                    }
                                }],
                                catalogo: {
                                    plazoMinimo: '24',
                                    plazoMaximo: '24',
                                    montoMinimo: '300000',
                                    montoMaximo: '999999999'

                                }
                            }
                        }]
                    });

                },

                crearPagare: function () {

                    return $api.compartida.crearPagare({
                        rowId: CONFIG.rowId.split('-')[1],
                        session: CONFIG.rowId.split('-')[1],
                        usuario: CONFIG.usuario,
                        listaCrearGirador: [{
                            identificacionEmisor: "8600343137",
                            fkIdTipoDocumento: CONFIG.idType,
                            numeroDocumento: CONFIG.idNumber,
                            correoElectronico: $scope.ubicacion.Correoelectronico,
                            direccion1PersonaGrupo_PGP: $scope.ubicacion.DirRecidencia,
                            telefono1PersonaGrupo_PGP: $scope.ubicacion.Telefono,
                            giradorNaturalTipo: {
                                fkIdPaisExpedicion_Nat: CLIENTE.LugardeExpedicion.toString().slice(0, 3) || '',
                                fkIdDepartamentoExpedicion_Nat: CLIENTE.LugardeExpedicion.toString().slice(3, 5) || '',
                                fkIdCiudadExpedicion_Nat: CLIENTE.LugardeExpedicion.toString().slice(3, 8) || '',
                                fkIdPaisDomicilio_Nat: $rootScope.direccion.DAV_PersonaCountry || $rootScope.direccion.DAV_PersonaDepartment.toString().slice(0, 3),
                                fkIdDepartamentoDomicilio_Nat: $rootScope.direccion.DAV_PersonaDepartment.toString().slice(-2),
                                fkIdCiudadDomicilio_Nat: $rootScope.direccion.DAV_PersonaCity.toString().slice(-5),
                                primerApellido_Nat: CLIENTE.PrimerApellido,
                                segundoApellido_Nat: CLIENTE.SegundoApellido,
                                nombresNat_Nat: CLIENTE.Nombres,
                                numeroCelular: $scope.ubicacion.Celular
                            }
                        }],
                        documentoPagareServiceTipo: [{
                            idDocumentoPagare: '0',
                            otorganteCuenta: 0,
                            otorganteNumId: CONFIG.idNumber,
                            otorganteTipoId: Number(CONFIG.idType)
                        }],
                        informacionFirmarPagareTipo: {
                            infoCertificadoFirmaTipo: {
                                clave: CONFIG.idNumber,
                                numeroDocumento: CONFIG.idNumber,
                                tipoDocumento: Number(CONFIG.idType)
                            },
                            archivosAdjuntos: {
                                contenido: $scope.biometricData ? $scope.biometricData.base64 : ''
                            }
                        },
                        valOrigenPeticion: CONFIG.employee.oficina
                    });

                },

                asignarMedio: function () {

                    return $api.compartida.asignarMedio({
                        rowId: CONFIG.rowId.split('-')[1],
                        usuario: CONFIG.usuario,
                        informacionCliente: {
                            valTipoCliente: 'C',
                            codTipoIdCliente: CONFIG.idType,
                            valIdCliente: CONFIG.idNumber,
                            valPrimerNombre: CLIENTE.Nombres.split(' ')[0],
                            valSegundoNombre: CLIENTE.Nombres.split(' ')[1] || '',
                            valPrimerApellido: CLIENTE.PrimerApellido,
                            valSegundoApellido: CLIENTE.SegundoApellido,
                            valDireccionCorreoElecronico: $scope.ubicacion.Correoelectronico,
                            valNumeroCelular: $scope.ubicacion.Celular
                        },
                        informacionTarjeta: {
                            codigoConvenio: $rootScope.tarjetaCod,
                            cupoTotalDecisor: $scope.evaluacion.monto,
                            numeroSolicitud: CONFIG.rowId.split('-')[1],
                            codigoOficina: CONFIG.oficina.slice(-4),
                            codigoAgenteVendedor: CONFIG.employee.davIdentificationNumber2,
                            direccionCorrespondencia: $scope.ubicacion.DirRecidencia,
                            ciudadCorrespondencia: $scope.ubicacion.ciudadCorrespondencia.toString().length > 5 ? $scope.ubicacion.ciudadCorrespondencia.toString().slice(-5) : ($scope.ubicacion.ciudadCorrespondencia || '')
                        }

                    });

                },

                generacionDocumentosDesembolso: function () {

                    var cliente = $rootScope.CLIENT.CLIENTE,
                        ingresosTotales = 0,
                        oficina = $filter('filter')(nameSpace.lovs.lov_oficinas, {
                            codigo: CONFIG.employee.listOfEmployeePosition.employeePosition[0].division.slice(-4)
                        }, true)[0] || {},
                        ciudad = $filter('filter')(nameSpace.lovs.lov_oficina_ciudad, {
                            codigo: CONFIG.oficina
                        })[0];

                    if ($rootScope.estado == 1) {

                        angular.forEach(CLIENTE_ALL.INGRESOS, function (ingreso, i) {

                            var fechaValida = true;
                            if (ingreso.FechaFin) {

                                var fechaFin = new Date(ingreso.FechaFin),
                                    actual = new Date();
                                if (fechaFin <= actual) {

                                    fechaValida = false;

                                }

                            }

                            if (fechaValida) {

                                if (ingreso.TipoActividadLaboralCodigo == 'E' || ingreso.TipoActividadLaboralCodigo == 'R' || ingreso.TipoActividadLaboralCodigo == 'D') {

                                    ingresosTotales += ingreso.Valor;

                                } else if (ingreso.TipoActividadLaboralCodigo == 'I' || ingreso.TipoActividadLaboralCodigo == 'S') {

                                    ingresosTotales += ingreso.Valor;

                                } else if (ingreso.TipoActividadLaboralCodigo == 'P') {

                                    ingresosTotales += ingreso.Valor;

                                }

                            }

                        });

                    } else {

                        angular.forEach($scope.actividades, function (ingreso, i) {

                            if (ingreso.ActividadLaboral == 'E' || ingreso.ActividadLaboral == 'R' || ingreso.ActividadLaboral == 'D') {

                                ingresosTotales += Number(ingreso.IngresoMensual);

                            } else if (ingreso.ActividadLaboral == 'I' || ingreso.ActividadLaboral == 'S') {

                                ingresosTotales += Number(ingreso.IngresoMensual);

                            } else if (ingreso.ActividadLaboral == 'P') {

                                ingresosTotales += Number(ingreso.IngresoMensual);

                            }

                        });

                    }

                    return $api.compartida.generacionDocDesembolso({
                        rowId: CONFIG.rowId.split('-')[1],
                        oficinaTotal: CONFIG.oficinaTotal,
                        session: "0",
                        paqueteDocId: 'CREDITOEXPRESS',
                        usuario: CONFIG.usuario,
                        consultaPagareService: {
                            codigoDeceval: $scope.idDocumentoPagare,
                            idTipoIdentificacionFirmante: CONFIG.idType,
                            numIdentificacionFirmante: CONFIG.idNumber
                        },
                        cliente: {
                            valTipoIdentificacion: CONFIG.idType,
                            valNumeroIdentificacion: CONFIG.idNumber,
                            valMail: ($filter('filter')($rootScope.CLIENT.EMAILS, {
                                DAV_PrincipalEmail: 'Y'
                            })[0] || {
                                Email: ''
                            }).Email
                        },
                        parametros: {
                            parametro: [{
                                id: "{tipo_id_firma}",
                                valor: CONFIG.idType
                            }, {
                                id: "{numero_id_firma}",
                                valor: CONFIG.idNumber
                            }, {
                                id: "{fecha_firma}",
                                valor: $filter('date')($scope.hoy, 'dd/MM/yyyy')
                            }, {
                                id: "{hora_firma}",
                                valor: $scope.hoy.getHours() + ':' + $scope.hoy.getMinutes() + ':' + $scope.hoy.getSeconds()
                            }, {
                                id: "{fecha_solicitud}",
                                valor: $filter('date')($scope.hoy, 'dd/MM/yyyy')
                            }, {
                                id: "{ciudad_solicitud}",
                                valor: ciudad.codigo || ''
                            }, {
                                id: "{canal_venta}",
                                valor: "OFICINAS"
                            }, {
                                id: "{codigo_sucursal}",
                                valor: CONFIG.oficina || ''
                            }, {
                                id: "{codigo_oficina_radicacion}",
                                valor: CONFIG.oficina || ''
                            }, {
                                id: "{nombre_oficina_radicacion}",
                                valor: oficina.desc || ''
                            }, {
                                id: "{codigo_agente}",
                                valor: CONFIG.employee.davIdentificationNumber2 || ''
                            }, {
                                id: "{numero_solicitud}",
                                valor: CONFIG.rowId
                            }, {
                                id: "{tipo_solicitante}",
                                valor: "TITULAR"
                            }, {
                                id: "{identificacion_solicitante}",
                                valor: CLIENTE.IdentificationType + "-" + CONFIG.idNumber
                            }, {
                                id: "{nombre}",
                                valor: CLIENTE.Nombres || ''
                            }, {
                                id: "{primer_apellido}",
                                valor: CLIENTE.PrimerApellido || ''
                            }, {
                                id: "{segundo_apellido}",
                                valor: CLIENTE.SegundoApellido || ''
                            }, {
                                id: "{actividad_laboral}",
                                valor: ingresos.TipoActividadLaboral || ''
                            }, {
                                id: "{ingresos_totales}",
                                valor: ingresosTotales
                            }, {
                                id: "{destino}",
                                valor: 'NUEVA'
                            }, {
                                id: "{monto_solicitado}",
                                valor: $scope.evaluacion.monto || ''
                            }, {
                                id: "{tipo}",
                                valor: 'PERSONAL'
                            }, {
                                id: "{clase}",
                                valor: 'GENERICA'
                            }, {
                                id: "{autoriza_pago_automatico}",
                                valor: 'NO'
                            }, {
                                id: "{medio_entrega_extracto}",
                                valor: 'PUBLICADO'
                            }, {
                                id: "{franquicia}",
                                valor: 'VISA'
                            }, {
                                id: "{genero_solicitud}",
                                valor: CLIENTE.Sexo || ''
                            }, {
                                id: "{ciudad_nacimiento}",
                                valor: CLIENTE.CiudaddeNacimientoDesc || ''
                            }, {
                                id: "{fecha_nacimiento}",
                                valor: CLIENTE.Fechadenacimiento || ''
                            }, {
                                id: "{estado_civil}",
                                valor: CLIENTE.EstadocivilDesc || ''
                            }, {
                                id: "{tipo_identificacion}",
                                valor: CONFIG.idType || ''
                            }, {
                                id: "{numero_identificacion}",
                                valor: CONFIG.idNumber || ''
                            }, {
                                id: "{fecha_expedicion}",
                                valor: CLIENTE.FechadeExpedicion || ''
                            }, {
                                id: "{ciudad_expedicion}",
                                valor: CLIENTE.CiudadExpedicionDesc || ''
                            }, {
                                id: "{personas_cargo}",
                                valor: CLIENTE.Numerodepersonascargo || ''
                            }, {
                                id: "{tipo_vivienda}",
                                valor: CLIENTE.ViviendaDesc || ''
                            }, {
                                id: "{profesion}",
                                valor: CLIENTE.ProfesionDesc || ''
                            }, {
                                id: "{direccion_principal}",
                                valor: $scope.ubicacion.DirRecidencia || ''
                            }, {
                                id: "{ciudad_principal}",
                                valor: $scope.ubicacion.ciudad || ''
                            }, {
                                id: "{departamento_principal}",
                                valor: $scope.ubicacion.Departamento || ''
                            }, {
                                id: "{telefono_principal}",
                                valor: $scope.ubicacion.Telefono || ''
                            }, {
                                id: "{email_principal}",
                                valor: $scope.ubicacion.Correoelectronico || ''
                            }, {
                                id: "{celular_principal}",
                                valor: $scope.ubicacion.Celular || ''
                            }, {
                                id: "{direccion_oficina}",
                                valor: direccion.StreetAdress || ''
                            }, {
                                id: "{ciudad_oficina}",
                                valor: direccion.DAV_PersonaMunicipalityDesc || ''
                            }, {
                                id: "{departamento_oficina}",
                                valor: direccion.DAV_PersonaDepartmentDesc || ''
                            }, {
                                id: "{telefono_fas_oficina}",
                                valor: $scope.Telefono02.Number || ''
                            }, {
                                id: "{exte_oficina}",
                                valor: $scope.Telefono02.Extension || ''
                            }, {
                                id: "{nit}",
                                valor: ingresos.NITEmpresa || ''
                            }, {
                                id: "{empresa}",
                                valor: ingresos.NombreEmpresa || ''
                            }, {
                                id: "{actividad_economica}",
                                valor: ingresos.ActividadLaboral || ''
                            }, {
                                id: "{cargo}",
                                valor: ingresos.ProfesionDesc || ''
                            }, {
                                id: "{fecha_inicio}",
                                valor: ingresos.FechaInicio || ''
                            }, {
                                id: "{fecha_fin}",
                                valor: ingresos.FechaFin || ''
                            }, {
                                id: "{tipo_ingreso}",
                                valor: ingresos.Tipo || ''
                            }, {
                                id: "{ingresos}",
                                valor: ingresos.Valor || ''
                            }, {
                                id: "{codigo_libranza}",
                                valor: ''
                            }, {
                                id: "{nombre_convenio}",
                                valor: ''
                            }, {
                                id: "{tipo_contrato}",
                                valor: ingresos.TipoActividadLaboral || ''
                            }, {
                                id: "{total_ingresos}",
                                valor: ingresosTotales
                            }, {
                                id: "{arriendo}",
                                valor: $scope.actividad.egresos.Monto || ''
                            }, {
                                id: "{total_egresos}",
                                valor: CLIENTE.TotalEgresos || ''
                            }, {
                                id: "{direccion_finca_raiz}",
                                valor: $scope.actividad.activosPropiedades.DirecciondeInmueble || ''
                            }, {
                                id: "{ciudad_finca_raiz}",
                                valor: $scope.actividad.activosPropiedades.CiudaddelInmueble || ''
                            }, {
                                id: "{valor_comercial_finca_raiz}",
                                valor: $scope.actividad.activosPropiedades.ValorComercial || ''
                            }, {
                                id: "{placa}",
                                valor: $scope.actividad.activosPropiedades.PlacaVehiculo || ''
                            }, {
                                id: "{valor_comercial_vehiculo}",
                                valor: $scope.actividad.activosPropiedades.ValorComercial || ''
                            }, {
                                id: "{tipo_referencia}",
                                valor: $scope.actividad.relaciones.ClaseDeRelacionGlosa || ''
                            }, {
                                id: "{tipo_identificacion_ref}",
                                valor: $scope.actividad.relaciones.IdentifTypeRelacionadoDesc || ''
                            }, {
                                id: "{numero_identificacion_ref}",
                                valor: $scope.actividad.relaciones.IdentifNumberRelacionado || ''
                            }, {
                                id: "{nombres_apellidos_ref}",
                                valor: $scope.actividad.relaciones.NombreRelacionado + ' ' + $scope.actividad.relaciones.NombreRelacionado + ' ' + $scope.actividad.relaciones.NombreRelacionado
                            }, {
                                id: "{parentesco}",
                                valor: $scope.actividad.relaciones.TipoRelacion || ''
                            }, {
                                id: "{telefono_ref}",
                                valor: $scope.ubicacion.Telefono || ''
                            }, {
                                id: "{direccion_ref}",
                                valor: $scope.ubicacion.DirRecidencia || ''
                            }, {
                                id: "{ciudad_ref}",
                                valor: $scope.ubicacion.ciudad || ''
                            }, {
                                id: "{total_activos}",
                                valor: CLIENTE.TotalActivos || ''
                            }, {
                                id: "{total_pasivos}",
                                valor: CLIENTE.TotalPasivos || ''
                            }, {
                                id: "{producto_garantia}",
                                valor: ''
                            }, {
                                id: "{garantia}",
                                valor: ''
                            }, {
                                id: "{valor_comercial_garantia}",
                                valor: ''
                            }, {
                                id: "{ciudad_garantia}",
                                valor: ''
                            }, {
                                id: "{marca_garantia}",
                                valor: ''
                            }, {
                                id: "{modelo_garantia}",
                                valor: ''
                            }, {
                                id: "{clase_garantia}",
                                valor: ''
                            }, {
                                id: "{tipo_servicio_garantia}",
                                valor: ''
                            }, {
                                id: "{producto_obligacion}",
                                valor: ''
                            }, {
                                id: "{obligacion}",
                                valor: ''
                            }, {
                                id: "{valor_monto_comprar}",
                                valor: ''
                            }, {
                                id: "{nombre_razon_social}",
                                valor: ''
                            }, {
                                id: "{hora_entrevista}",
                                valor: $scope.hoy.toLocaleTimeString()
                            }, {
                                id: "{dia_entrevista}",
                                valor: $scope.hoy.getDate()
                            }, {
                                id: "{mes_entrevista}",
                                valor: $scope.hoy.getMonth() + 1
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

            /* ------------------------------------------------------------------------------------------
 		     | INIT
 		     -------------------------------------------------------------------------------------------- */

            $scope.$gui.evaluar();


        }
    ]);

});
