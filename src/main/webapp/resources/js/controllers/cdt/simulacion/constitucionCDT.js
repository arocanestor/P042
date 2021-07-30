/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('constitucionCDTCtrl', [
        '$scope',
        '$rootScope',
        'CONFIG',
        '$slm-dialog',
        '$filter',
        '$api',
        '$timeout',
        '$utilities',
        function (
            $scope,
            $rootScope,
            CONFIG,
            $dialog,
            $filter,
            $api,
            $timeout,
            $utilities
        ) {

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                actualizarValorCheque: function (cheques) {

                    var cont = 0;

                    // contador para saber cuantos chekbox estan seleccionados
                    angular.forEach($scope.apertura.checks, function (value, i) {

                        cont += (value == true) ? value : 0;

                    });

                    $scope.contadorChecks = cont;

                    cheques = cheques.map(function (obj) {

                        obj.valorCheque = ($scope.apertura.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : '';

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

                    $scope.titulares.push({});

                },

                agregarCheque: function (cheques) {

                    if (cheques.length <= '4') {

                        $scope.cheques.push({
                            numCheque: '',
                            numCuenta: '',
                            codBanco: '',
                            valorCheque: ($scope.apertura.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : ''
                        });

                    }

                },

                validarThrowAC: function (option) {

                    $scope.$gui.validarListasNIC(option, true);

                },

                validarListasNIC: function (persona, autorizado) {

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
                                persona.confirmacion = dias > 365 ? false : '';

                                return;

                            }

                            persona.confirmacionNic.status = 'error';
                            persona.confirmacionNic.content = $scope.dialogs.sinFecha || '';
                            persona.confirmacion = false;

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
                            paisNacimientoConstitucion: natural ? cliente.PaisdeNacimiento : (cliente.ConstitutionCity + "").slice(0, 3)
                        }).then(function (response) {

                            var data = response.data,
                                codigosVinculables = $scope.lovs.lov_listas_restrictiva_permitir_codigo.map(function (obj) {

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

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$watch('apertura.valorInversion', function (newValue, oldValue) {

                if ($scope.apertura.valorInversion) {

                    var validador = Boolean($scope.apertura.valorInversion.toString().split('.')[1]);
                    if (validador) {

                        var decimales = $scope.apertura.valorInversion.toString().split('.')[1] || '';

                        if (decimales.length > 2) {

                            $timeout(function () {

                                $scope.apertura.valorInversion = Number($scope.apertura.valorInversion).toFixed(2);

                            });


                        }

                    }

                }

            });

            $scope.$watch('apertura.valorDebito', function (newValue, oldValue) {

                if ($scope.apertura.valorDebito) {

                    var validador = Boolean($scope.apertura.valorDebito.toString().split('.')[1]);
                    if (validador) {

                        var decimales = $scope.apertura.valorDebito.toString().split('.')[1] || '';

                        if (decimales.length > 2) {

                            $timeout(function () {

                                $scope.apertura.valorDebito = Number($scope.apertura.valorDebito).toFixed(2);

                            });


                        }

                    }

                }

            });

            $scope.$program = {

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

                noMoreDigits: function () {

                    angular.forEach($scope.cheques, function (value, key) {

                        if (value.valorCheque) {

                            var validador = Boolean($scope.cheques[key].valorCheque.toString().split('.')[1]);
                            if (validador) {

                                var decimales = $scope.cheques[key].valorCheque.toString().split('.')[1] || '';

                                if (decimales.length > 2) {

                                    $timeout(function () {

                                        $scope.cheques[key].valorCheque = Number($scope.cheques[key].valorCheque).toFixed(2);

                                    });


                                }

                            }

                        }

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

                        // var valorCheque = ($scope.apertura.checks.chequeCheck && $scope.contadorChecks == '1') ? nameSpace.simulacion.valorInversion : value.valorCheque;
                        // var valorCheque = $scope.apertura.checks.chequeCheck ? value.valorCheque : nameSpace.simulacion.valorInversion;
                        var valorCheque = value.valorCheque;
                        sumaValCheques += Number(valorCheque);

                    });

                    /**
                     * Controla si el Check seleccionado es Unico y pertenece al efectivoCheck
                     * por ende cargara el valor total asignado para cubrir el capital
                     * {else} si no se cumple el valor sera por defecto el ingresado en el input
                     */
                    if ($scope.apertura.checks.efectivoCheck && $scope.contadorChecks == '1') {

                        valInversionEfectivo = $scope.simulacion.valorInversion;

                    } else {

                        valInversionEfectivo = valInversionEfectivo ? valInversionEfectivo : 0;

                    }

                    /**
                     * Controla si el Check seleccionado es Unico y pertenece al valDebito
                     * por ende cargara el valor total asignado para cubrir el capital
                     * {else} si no se cumple el valor sera por defecto el ingresado en el input
                     */
                    if ($scope.apertura.checks.cuentaCheck && $scope.contadorChecks == '1') {

                        valDebito = $scope.simulacion.valorInversion;

                    } else {

                        valDebito = valDebito ? valDebito : 0;

                    }

                    sumaValCheques = sumaValCheques ? sumaValCheques : 0;

                    // SUMA DE LOS CAMPOS DE MONTOS
                    sumatoria += Number(valInversionEfectivo) + Number(valDebito) + Number(sumaValCheques);

                    $scope.apertura.totalRecepcion = sumatoria;

                    return sumatoria;

                }

            };

            $scope.$watch('apertura.tipoManejo', function (n, o) {

                n = n || {};

                if ((!n.desc || n.desc == 'INDIVIDUAL') && $scope.titulares.length > 1) {

                    $dialog.open({
                        type: 'confirm',
                        content: 'Se eliminarán los titulares secundarios<br>¿desea continuar?'
                    }).then(function () {

                        $scope.titulares = [$scope.titulares[0]];
                        nameSpace.titulares = $scope.titulares;

                    }, function () {

                        $scope.apertura.tipoManejo = o;

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

                checkListas: function (titular) {

                    return $api.cautela.listasRestrictivas({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        tipoIdentificacionTitular: titular.tipoIdentificacionTitular,
                        nroIdentificacionTitular: titular.nroIdentificacionTitular,
                        codigoSolicitud: $filter('lov')('ABRIR-CDT', $rootScope.lov.lovs.lov_listas_restrictiva_operacion, 'desc', 'codigo'),
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

                }

            };

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,
                checkCdt = 'autoriza-huella-apertura',
                // N si es natural o J si es juridica para hacer validaciones en el hotmail
                tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J',
                fechadenacimientoOConstitucionFormateada = CLIENTE.Fechadenacimiento || CLIENTE.DateFormed,
                arrCheque = {
                    numCheque: '',
                    numCuenta: '',
                    codBanco: '',
                    valorCheque: '',
                    remover: false // para que no aparezca el boton de eliminar en el primer cheque
                },
                nameSpace = $rootScope.account[$rootScope.routeApp['3']],
                principal = {
                    tipoIdentificacion: $filter('filter')($scope.lovs.lov_cdt_tipo_documento, {
                        codigo: CONFIG.idType + '-' + tipoCliente
                    })[0] || '',
                    numIdentificacion: CONFIG.idNumber
                };

            $scope.titulares = [principal];
            nameSpace.titulares = $scope.titulares;

            $scope.simulacion = nameSpace.simulacion;
            $scope.autorizado = {};
            $scope.cheque = {};
            $scope.cheques = [arrCheque];
            nameSpace.cheques = $scope.cheques;
            $scope.apertura = {};
            nameSpace.apertura = $scope.apertura;
            $scope.apertura.checks = {};

            // LISTAS DE VALORES
            $scope.lovs = nameSpace.lovs;
            $scope.lovs.lov_checks_CDT_filtrado = [];
            $scope.lovs.lov_productos = [];
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

            // huella capturada
            $scope.biometricData = {};

            // se precarga la opcion Cuenta Davivienda en el campo Forma de pago
            $scope.apertura.formaPago = $filter('filter')($scope.lovs.lov_cdt_forma_pago_intereses, {
                codigo: '1'
            })[0] || '';

            // VALIDATE CHECKS
            $scope.validateChecks = {
                'autoriza-huella-apertura': true
            };

            $scope.caption = {
                confirmApertura: '<ul gui="list">' +
                    '   <li> Para pasar a la confirmación de la apertura, continúe </li>' +
                    '   <li> Haga click en Regresar para volver al paso anterior</li>' +
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
                fechaMayor: 'Recuerde, ACTUALIZAR LOS DATOS DEL CLIENTE, al finalizar la apertura',
                sinFecha: 'Para continuar, VINCULE EL CLIENTE AL BANCO'
            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.$gui.validarListasNIC($scope.titulares[0]);
            $scope.$program.lovCuentas();

            // se filtra para mostrar el check que pertenece a la pantalla de apertura
            $scope.lovs.lov_checks_CDT_filtrado = $filter('filter')($scope.lovs.lov_checks_CDT, {
                codigo: checkCdt
            });


        }
    ]);

});
