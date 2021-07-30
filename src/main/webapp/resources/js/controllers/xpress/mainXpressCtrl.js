
define(['../../app'], function (app) {

    'use strict';
    app.controller('xpressCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        '$slm-dialog',
        'CONFIG',
        '$filter',
        '$state',
        '$utilities',
        '$spaUtils',
        'actualizaSiebel',
        function ($scope, $rootScope, $api, $dialog, CONFIG, $filter, $state, $utilities, $spaUtils, $siebel) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            $rootScope.autorizacion = false;

            $scope.hoy = new Date();

            var nameSpace = $rootScope.account[$rootScope.routeApp['5']],
                CLIENTE = $rootScope.CLIENT.CLIENTE,
                CLIENTE_ALL = $rootScope.CLIENT,
                tiposIdentificacion = $filter('filter')($rootScope.lov.lov_tipo_id_venta_linea, {
                    codigo: 1
                })[0] || {};

            $scope.lovs = nameSpace.lovs;

            $scope.lovs.lov_state_abbrev = nameSpace.lovs.lov_state_abbrev.filter(function (lov) {

                if (lov.codigo.toString().slice(0, 3) == '169') {

                    return true;

                }
                return false;

            });

            $scope.lovs.lov_ciud_col = nameSpace.lovs.lov_ciud_col.filter(function (lov) {

                if (lov.codigo.toString().slice(0, 3) == '169') {

                    return true;

                }

                return false;

            });

            $scope.lovs.lov_ciud_col_filtrada = $scope.lovs.lov_ciud_col;

            $scope.config = CONFIG;
            $scope.CLIENTE = CLIENTE;

            $scope.textos = nameSpace.textos;

            $scope.listaactividad = nameSpace.lovs.lov_actividad_laboral_express;
            $scope.listaTarjetas = nameSpace.lovs.lov_tarjetas_express;
            $scope.listaCiiu = nameSpace.lovs.lov_siebel_codigo_ciiu;
            $scope.lov_msg = nameSpace.lovs.lov_msg_venta_xpress_obj;

            $scope.title = 'Tarjeta de Crédito Móvil';
            $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            $scope.form = {};
            $scope.datosBasicos = {};
            // $scope.actividad = {};
            $scope.ubicacion = {};
            $scope.producto = {
                centrales: ''
            };

            // ////////////////////////////// CAPTIONS
            $scope.caption = {
                listas: {
                    status: '',
                    content: ''
                },
                informacion: $scope.lov_msg['paso-preanalisis'].desc
            };

            $scope.producto.ProductoSolicitado = '01';
            // $scope.producto.centrales = '';

            // ////////////////// DATOS datosBasicos

            $scope.estado = CLIENTE.Estado;

            $scope.datosBasicos.fechaNacimiento = $filter('date')(new Date(CLIENTE.Fechadenacimiento), 'dd/MM/yyyy');
            $scope.datosBasicos.tipoId = (CLIENTE.IdentificationTypeCode);
            $scope.datosBasicos.numeroId = (CLIENTE.IdentificationNumber);
            $scope.datosBasicos.nombres = (CLIENTE.Nombres);
            $scope.datosBasicos.primerApellido = (CLIENTE.PrimerApellido);
            $scope.datosBasicos.segundoApellido = (CLIENTE.SegundoApellido);
            // ////////////////// Actividad Laboral
            var ingresos = ($filter('filter')(CLIENTE_ALL.INGRESOS, {
                Principal: 'Y'
            }) || [{
                ActividadEconomica: '',
                TipoActividadLaboralCodigo: '',
                ActividadEconomicaDescripcion: '',
                Valor: ''
            }]);
            $scope.actividades = [];
            if (ingresos.length > 0) {

                angular.forEach(ingresos, function (ingreso, i) {

                    ingreso.ActividadLaboral = ingreso.TipoActividadLaboralCodigo;
                    ingreso.ActividadLaboralDef = ingreso.TipoActividadLaboralCodigo;
                    ingreso.DescrpicionActividadCIIU = ingreso.ActividadEconomicaDescripcion;
                    ingreso.CodigoCIIUActividadEconomica = ingreso.ActividadEconomica;
                    ingreso.IngresoMensual = ingreso.Valor;
                    ingreso.DescrpicionActividadCIIUDef = ingreso.ActividadEconomicaDescripcion;
                    ingreso.CodigoCIIUActividadEconomicaDef = ingreso.ActividadEconomica;
                    ingreso.IngresoMensualDef = ingreso.Valor;
                    ingreso.estado = $scope.estado;
                    $scope.actividades.push(ingreso);

                });

            } else {

                var ingreso = {};
                ingreso.ActividadLaboral = '';
                ingreso.ActividadLaboralDef = '';
                ingreso.DescrpicionActividadCIIU = '';
                ingreso.CodigoCIIUActividadEconomica = '';
                ingreso.IngresoMensual = '';
                ingreso.DescrpicionActividadCIIUDef = '';
                ingreso.CodigoCIIUActividadEconomicaDef = '';
                ingreso.IngresoMensualDef = '';
                ingreso.estado = $scope.estado;
                $scope.actividades.push(ingreso);

            }
            // $scope.actividad.ActividadLaboral = ingresos.TipoActividadLaboral;
            // $scope.actividad.DescrpicionActividadCIIU = ingresos.ActividadEconomicaDescripcion;
            // $scope.actividad.CodigoCIIUActividadEconomica = ingresos.ActividadEconomica;
            // $scope.actividad.IngresoMensual = ingresos.Valor;
            // ////////////////// Datos Ubicación
            var direccion = ($filter('filter')(CLIENTE_ALL.DIRECCIONES, {
                DAV_Principal: 'Y'
            })[0] || CLIENTE_ALL.DIRECCIONES[0] || {
                DAV_PersonaCity: '',
                StreetAdress: '',
                DAV_PersonaMunicipality: ''
            });
            $scope.direccion = direccion;

            if ($scope.direccion.DAV_PersonaDepartment) {

                $scope.lovs.lov_ciud_col_filtrada = nameSpace.lovs.lov_ciud_col.filter(function (lov) {

                    if (lov.codigo.toString().slice(0, 5) == $scope.direccion.DAV_PersonaDepartment) {

                        return true;

                    }
                    return false;

                });

            }

            $scope.datosPantalla = {
                departamento: $filter('filter')($scope.lovs.lov_state_abbrev, {
                    codigo: $scope.direccion.DAV_PersonaDepartment ? $scope.direccion.DAV_PersonaDepartment.toString() : ''
                }, true)[0] || {
                    codigo: '',
                    desc: ''
                },
                ciudad: $filter('filter')($scope.lovs.lov_ciud_col_filtrada.length > 0 ? $scope.lovs.lov_ciud_col_filtrada : $scope.lovs.lov_state_abbrev, {
                    codigo: $scope.direccion.DAV_PersonaMunicipality ? $scope.direccion.DAV_PersonaMunicipality.toString() : ''
                }, true)[0] || {
                    codigo: '',
                    desc: ''
                }
            };

            $scope.ubicacion.ciudadCorrespondencia = direccion.DAV_PersonaCity;
            $scope.ubicacion.ciudad = direccion.DAV_PersonaMunicipality;
            $scope.ubicacion.Departamento = direccion.DAV_PersonaDepartment;
            $scope.ubicacion.DirRecidencia = direccion.StreetAdress;
            $scope.ubicacion.Celular = ($filter('filter')(CLIENTE_ALL.CELULARES, {
                DAV_PrincipalCellphone: 'Y'
            })[0] || CLIENTE_ALL.CELULARES[0] || {
                Number: ''
            }).Number;
            $scope.celularDef = $scope.ubicacion.Celular;
            $scope.ubicacion.Correoelectronico = ($filter('filter')(CLIENTE_ALL.EMAILS, {
                DAV_PrincipalEmail: 'Y'
            })[0] || {
                Email: ''
            }).Email;
            $scope.CorreoelectronicoDef = $scope.ubicacion.Correoelectronico;
            $scope.ubicacion.Telefono = ($filter('filter')(CLIENTE_ALL.TELEFONOS, {
                DAV_PrincipalTelephone: 'Y'
            })[0] || CLIENTE_ALL.TELEFONOS[0] || {
                Number: ''
            }).Number;
            $scope.TelefonoDef = $scope.ubicacion.Telefono;
            // //////////////////////// Cuadro Dialogo *
            // ////////////////////////////// VALIDATE CHECKS
            $scope.checksValidate = {
                'autorizoHuella': false,
                'solicitudProducto': true,
                'pagare': true,
                'autoriza-huella': true
            };

            $scope.evaluacion = {
                estado: ''
            };

            $scope.huella = true;
            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                model: {
                    autorizacionCentralesSteps: ['preview', 'biometric']
                },
                assistant: false,
                pdf: {
                    huella: {},
                    huellaCapturada: false
                },

                datosPdf: {
                    rowId: CONFIG.rowId,
                    usuario: CONFIG.usuario,
                    oficina: CONFIG.oficina || '',
                    nombresApellidos: CONFIG.nombre,
                    tipoId: $filter('lov')(CONFIG.idType, $scope.lovs.lov_tipo_identif_homologado),
                    numId: CONFIG.idNumber,
                    ciudadExp: CLIENTE.CiudadExpedicionDesc || '',
                    fecha: new Date().getTime(),
                    ciudad: $filter('lov')(CONFIG.oficina, $scope.lovs.lov_oficina_ciudad) || '',
                    canal: '',
                    huella: ''
                },

                assi: function () {

                    $scope.$gui.autorizaCentrales = false;
                    $scope.$gui.assistant = true;

                },

                bioCaptureAtorizacionCentrales: function (data) {

                    $scope.$gui.datosPdf.huella = data.base64;
                    $scope.$gui.pdf.huellaCapturada = true;

                },

                bioCapture: function (data) {

                    $scope.biometricData = data;

                },

                validacionesPrevias: function (data) {

                    if ($scope.lovs.lov_validaciones_previas_express[0].codigo == 0) {

                        $rootScope.direccion = $scope.direccion;

                        $scope.direccion.DAV_PersonaDepartment = $scope.datosPantalla.departamento.codigo;
                        $scope.direccion.DAV_PersonaCountry = $scope.datosPantalla.ciudad.codigo.toString().slice(0, 3);


                        $rootScope.ubicacion = $scope.ubicacion;
                        $rootScope.tarjeta = $scope.producto.ProductoSolicitado.desc;
                        $rootScope.tarjetaCod = $scope.producto.ProductoSolicitado.codigo;
                        $rootScope.actividades = $scope.actividades;
                        $rootScope.ingresos = ingresos;
                        $rootScope.estado = $scope.estado;
                        $rootScope.datosBasicos = $scope.datosBasicos;
                        $state.go('app.tarjeta-movil.xpress.evaluacion');

                        return;

                    }

                    $scope.$api.validacionesPrevias().then(function (resp) {

                        if (resp.data.camposFuturo.valCampoFuturo1.toString().trim() == 'VALIDACION PREVIA OK') {

                            $rootScope.direccion = $scope.direccion;

                            $scope.direccion.DAV_PersonaDepartment = $scope.datosPantalla.departamento.codigo;
                            $scope.direccion.DAV_PersonaCountry = $scope.datosPantalla.ciudad.codigo.toString().slice(0, 3);

                            $rootScope.ubicacion = $scope.ubicacion;
                            $rootScope.tarjeta = $scope.producto.ProductoSolicitado.desc;
                            $rootScope.tarjetaCod = $scope.producto.ProductoSolicitado.codigo;
                            $rootScope.actividades = $scope.actividades;
                            $rootScope.ingresos = ingresos;
                            $rootScope.datosBasicos = $scope.datosBasicos;
                            $state.go('app.tarjeta-movil.xpress.evaluacion');

                        }

                    }, function (response) {

                        if (response.data != '') {

                            $dialog.open({
                                status: 'error',
                                title: 'VALIDACIONES PREVIAS',
                                content: response.data || 'ha ocurrido un error inesperado'
                            });

                        } else {

                            $dialog.open({
                                type: 'confirm',
                                title: 'GENERACIÓN DOCUMENTOS',
                                content: (response.data || 'Ha ocurrido un error inesperado') + '<br> Error al generar documentos.<br>Intente Nuevamente',
                                accept: function () {

                                    $scope.$gui.validacionesPrevias();

                                },
                                cancel: function () {

                                    $scope.$api.guardarTraza($rootScope.estado, $scope.causalesNeg, 'Declinado', "", "Existente");
                                    $siebel.actualizaSiebel({
                                        customComments: '--- Resumen: NEG - Venta en Linea:'
                                    });
                                    $spaUtils.disableProduct('5');
                                    $state.go('app');

                                }
                            });

                        }

                    });

                },

                cambioValoractividad: function (actividad) {

                    actividad.DescrpicionActividadCIIU = actividad.CodigoCIIUActividadEconomica ? $filter('lov')(actividad.CodigoCIIUActividadEconomica, nameSpace.lovs.lov_siebel_codigo_ciiu).split('-')[1] : '';

                },

                cambioDepartamento: function () {

                    if ($scope.datosPantalla.departamento.codigo) {

                        $scope.lovs.lov_ciud_col_filtrada = nameSpace.lovs.lov_ciud_col.filter(function (lov) {

                            if (lov.codigo.toString().slice(0, 6) == $scope.datosPantalla.departamento.codigo) {

                                return true;

                            }
                            return false;

                        });

                    }


                }

            };



            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$program = {

                doneAssistant: function (done) {

                    if (done) {

                        done().then(function () {

                            $scope.producto.centrales = true;

                        }, function () {});

                    }

                }

            };

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                validacionesPrevias: function () {

                    return $api.compartida.validacionesPrevias({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        infoProceso: {
                            codTipoProceso: "VP",
                            valOperacion: "C",
                            codConvenio: $scope.producto.ProductoSolicitado.codigo,
                            valNumeroSolicitud: "1" // ??
                        },
                        infoCliente: {
                            codTipoIdentificacion: CONFIG.idType,
                            valNumeroIdentificacion: CONFIG.idNumber
                        },
                        camposDisponibles: {
                            valCampoDisponibleN1: "1",
                            valCampoDisponibleN2: "1",
                            valCampoDisponibleC1: "1",
                            valCampoDisponibleC2: "1"
                        }
                    });

                },

                getAutorizacionCentrales: function () {

                    return $api.pdf.getAutorizacionCentrales({
                        id: CONFIG.idNumber,
                        tipoId: CONFIG.idType
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
 		     | INIT
 		     -------------------------------------------------------------------------------------------- */

            if (CONFIG.persona !== 'natural') {

                $dialog.open({
                    status: 'error',
                    content: 'Transacción aplica únicamente para personas Naturales'
                });
                $spaUtils.disableProduct('5');
                $state.go('app');
                return;

            }

            // VALIDACION MAYOR DE EDAD
            if ((new Date(new Date() - new Date($rootScope.CLIENT.CLIENTE.Fechadenacimiento)).getFullYear() - 1970) < 18) {

                $dialog.open({
                    status: 'error',
                    content: $scope.dialogs.validacionEdad
                });
                $state.go('^');
                return;

            }

            $scope.$api.getAutorizacionCentrales().then(function (resp) {

                if (resp.data == true || resp.data == "true") {

                    $scope.producto.centrales = true;
                    return;

                }

                $scope.producto.centrales = false;

            }, function (resp) {

                if (resp.status === 417) {

                    $scope.producto.centrales = false;

                } else {

                    $scope.producto.centrales = false;

                }



            });

        }
    ]);

});
