/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('bloqueoDesbloqueoCDTCtrl', [
        '$scope',
        'servicioNumCDT',
        '$rootScope',
        'CONFIG',
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
                nameSpace = $rootScope.account[$rootScope.routeApp['3']];

            $scope.numCDT = servicioNumCDT.cdt;
            $scope.valMontoActualOperacion = "0";
            $scope.buttonOffDesbloqueo = false;
            $scope.buttonOffBloqueo = false;
            $scope.cdtMovil = false;

            // N si es natural o J si es juridica para hacer validaciones en el hotmail
            $scope.tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';

            if (CONFIG.persona == 'natural' || CONFIG.naturalConNegocio) {

                $scope.icon = 'fa-user-circle';
                $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            } else {

                $scope.icon = 'fa-building';
                $scope.extract = CLIENTE.Name;

            }

            $scope.simulacion = nameSpace.simulacion;

            $scope.titular = {};
            nameSpace.titulares = [];

            $scope.cheque = {};
            $scope.cheques = [{}];

            nameSpace.endoso = {};
            $scope.desbloqueo = {};
            $scope.Subestado = {};
            $scope.bloqueo = {};
            $scope.form = {
                Endoso: {},
                cambioForma: {}
            };

            $scope.lovs = nameSpace.lovs;
            $scope.lovs.lov_productos = [];
            $scope.lovs.lov_email = PERSONA.EMAILS;
            $scope.listaBloqueo = $scope.lovs.lov_cdt_tipo_bloqueo;

            $scope.caption = {
                info: '<ul><li><h3>Para desbloquear un CDT​:</h3></li><li>Si está bloqueado por pérdida, se deben cumplir las políticas de reposición.</li><li>Si está bloqueado por fallecimiento, se debe cumplir con la documentación para la sucesión</li><li>Si está bloqueado por actualizacion de datos, se debe hacer la respectiva tarea en el “Nos Interesa Conocerlo”</li></ul>',
                listas: {
                    status: '',
                    content: ''
                }
            };
            $scope.lovs.lov_desbloqueo_CDT = [{
                codigo: "01",
                desc: "Por pérdida"
            }, {
                codigo: "02",
                desc: "Por actualización datos"
            }, {
                codigo: '03',
                desc: 'Fallecimiento'
            }, {
                codigo: "04",
                desc: "Tarjeta de liquidez"
            }];

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {

                aplicarDesbloqueo: function () {

                    $scope.$api.bloqueoDesbloqueoCdt().then(function (response) {

                        if (response.data) {

                            if (response.data.codCDT && response.data.caracterAceptacion == 'B') {

                                // $scope.$gui.enviarNotificacion();

                                $dialog.open({
                                    status: 'success',
                                    content: 'El Desbloqueo se ha aplicado'
                                });

                                $scope.buttonOffDesbloqueo = true;
                                $scope.$gui.enviarNotificacion();

                            } else if (response.data.codCDT && response.data.caracterAceptacion == 'M') {

                                $dialog.open({
                                    status: 'error',
                                    content: response.data.msgRespuesta || 'Ha ocurrido un error inesperado'
                                });

                            } else {

                                $dialog.open({
                                    status: 'error',
                                    content: 'El Desbloqueo no fue aplicado, intente nuevamente.'
                                });

                            }

                        }

                    }, function (resp) {

                        if (resp.status == 417) {

                            $dialog.open({
                                status: 'error',
                                content: resp.headers("Respuesta") || 'No fue posible realizar la novedad, por favor intente nuevamente'
                            });

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>' + resp.status + '</b><br>Intente Nuevamente'
                            });

                        }

                    });


                },

                aplicarBloqueo: function () {

                    $scope.$api.bloqueoDesbloqueoCdt().then(function (response) {

                        if (response.data) {

                            if (response.data.codCDT && response.data.caracterAceptacion == 'B') {



                                $dialog.open({
                                    status: 'success',
                                    content: 'El Bloqueo se ha aplicado'
                                });

                                $scope.buttonOffBloqueo = true;
                                $scope.$gui.enviarNotificacion();


                            } else if (response.data.codCDT && response.data.caracterAceptacion == 'M') {

                                $dialog.open({
                                    status: 'error',
                                    content: response.data.msgRespuesta || 'Ha ocurrido un error inesperado'
                                });

                            } else {

                                $dialog.open({
                                    status: 'error',
                                    content: 'Ha ocurrido un error inesperado'
                                });

                            }

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error Código: 200'
                            });

                        }

                    }, function (resp) {

                        if (resp.status == 417) {

                            $dialog.open({
                                status: 'error',
                                content: resp.headers("Respuesta") || 'No fue posible realizar la novedad, por favor intente nuevamente'
                            });

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>' + resp.status + '</b><br>Intente Nuevamente'
                            });

                        }

                    });

                },

                changeforma: function () {

                    $scope.$gui.resetCampos();

                },

                resetCampos: function () {

                    $scope.bloqueo.observaciones = '';
                    $scope.bloqueo.correo = '';

                    $scope.desbloqueo.observaciones = '';
                    $scope.desbloqueo.correo = '';

                },
                enviarNotificacion: function () {

                    var fecOperacion = $filter('date')(new Date(), 'dd/MM/yyyy'),
                        informacionEnvioMailObj = {
                            nombre: $scope.extract,
                            email: $scope.bloqueo.correo ? $scope.bloqueo.correo.Email : 'N.A'
                        };

                    $scope.$api.enviarNotificacionesMail(informacionEnvioMailObj).then(function (resp) {

                        $dialog.open({
                            status: 'success',
                            content: 'Resultado enviado exitosamente<br><strong>Fecha operación:</strong> ' + fecOperacion
                        });

                    }, function (resp) {

                        $dialog.open({
                            status: 'error',
                            content: resp.headers('Respuesta') || 'Ha ocurrido un error inesperado'
                        });

                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$program = {


                consultaCdtXEstado: function () {

                    $scope.$api.consultaCdtXEstado().then(function (response) {

                        var fechaSistema = $filter('date')(new Date(), 'dd/MM/yyyy');

                        angular.forEach(response.data.registros, function (registro, i) {

                            if (registro.valNumeroCDT == $scope.numCDT[0].valNumeroCDT) {

                                $scope.valMontoActualOperacion = registro.valMontoActualOperacion;

                                // validaciones para definir el Subestado
                                if (registro.valBloqueoNovedades && registro.valBloqueoNovedades == 'S') {

                                    registro.subEstado = 'BLOQUEADO ' + (registro.valDescCausalBloqueo ? registro.valDescCausalBloqueo : '');
                                    $scope.Subestado = '1';

                                }

                                $scope.desbloqueo.subEstado = registro.subEstado;
                                $scope.desbloqueo.causalEmail = registro.valDescCausalBloqueo;

                                var tipoOperacion = $filter('lov')(registro.codTipoOperacion, $scope.lovs.lov_cdt_tipo_operacion, 'desc', 'codigo');
                                
                                if (tipoOperacion == '1' && (!registro.valNumeroPreimpreso || registro.valNumeroPreimpreso == '0')) {
                                    $scope.listaBloqueo = $scope.lovs.lov_bloqueo_cdt_movil;
                                }

                            }

                        });

                    }, function (resp) {

                        if (resp.status !== 417) {

                            $dialog.open({
                                status: 'error',
                                content: resp.headers("Respuesta") || 'No fue posible realizar la consulta, por favor intente nuevamente'
                            });

                        }

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

                }

            };

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                getCliente: function (params) {

                    return $api.siebel.getCliente({
                        rowId: CONFIG.rowId,
                        inNumID: params.idNumber,
                        inTipoID: params.idType
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

                bloqueoDesbloqueoCdt: function () {

                    return $api.consultaCdt.bloqueoDesbloqueoCdt({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        codOperacion: ($scope.numCDT[0].valBloqueoNovedades == 'S' || $scope.numCDT[0].valBloqueoNovedades == 's') ? 'D' : 'I',
                        valNumeroCdt: $scope.numCDT[0].valNumeroCDT,
                        valBloqueo: ($scope.numCDT[0].valBloqueoNovedades == 'S' || $scope.numCDT[0].valBloqueoNovedades == 's') ? '0' : $scope.valMontoActualOperacion,
                        valDescripcionBloqueo: $scope.desbloqueo.observaciones || $scope.bloqueo.observaciones,
                        valMotivoBloqueo: $scope.bloqueo.formaPagoIntereses,
                        codVendedor: CONFIG.idNumber,
                        codJornada: "0",
                        oficinaTotal: CONFIG.oficina.slice(-4)
                    });

                },
                enviarNotificacionesMail: function (params) {

                    return $api.pymes.enviarNotificacionesMail({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficinaTotal,
                        email: params.email,
                        idPlantilla: $scope.Subestado != '1' ? 'NotificaBloqueoCdtC360.html' : 'NotificaDesbloqueoCdtC360.html',
                        asunto: 'Novedad Bloqueo/Desbloqueo CDT',
                        formato: 'html',
                        tipoNotificacion: $scope.Subestado != '1' ? 'CdtBloqueo' : 'CdtDesbloqueo',
                        parametros: [{
                            valNombre: 'numeroCdt',
                            valValor: $scope.numCDT[0].valNumeroCDT
                        }, {
                            valNombre: $scope.Subestado != '1' ? 'descMotivoBloqueoCdt' : 'descMotivoDesbloqueoCdt', // Sin esto la wea no funciona
                            valValor: $scope.Subestado != '1' ? $filter('lov')($scope.bloqueo.formaPagoIntereses, $scope.lovs.lov_cdt_tipo_bloqueo) : $scope.desbloqueo.causalEmail

                        }],
                        adjuntos: []
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */
            $scope.$program.consultaCdtXEstado();
            $scope.$program.lovCuentas();


        }
    ]);

});
