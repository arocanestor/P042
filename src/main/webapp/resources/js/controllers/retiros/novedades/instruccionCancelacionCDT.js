/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('instruccionCancelacionCDTCtrl', [
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
            $scope.emailOFF = true;
            $scope.aplicarOFF = false;

            $scope.fechaExp = new Date($scope.numCDT[0].fecVencimientoOperacion);
            // N si es natural o J si es juridica para hacer validaciones en el hotmail
            $scope.tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';

            $scope.simulacion = nameSpace.simulacion;

            $scope.titular = {};
            nameSpace.titulares = [];

            $scope.cheque = {};
            $scope.cheques = [{}];

            nameSpace.endoso = {};
            $scope.instruccion = {};
            $scope.form = {
                Endoso: {},
                cambioForma: {}
            };

            $scope.lovs = nameSpace.lovs;
            $scope.lovs.lov_productos = [];
            $scope.lovs.lov_email = PERSONA.EMAILS;
            $scope.formaPagoIntereses = {};
            $scope.cambioAplicado = false;

            angular.forEach($scope.lovs.lov_cdt_forma_pago_intereses, function (obj, i) {

                if (obj.codigo == 1) {

                    $scope.instruccion.formaPagoIntereses = obj.desc;

                }

            });


            $scope.caption = {
                info: '<ul>' +
                    '   <li><h3>La instrucción de cancelación se ha aplicado</h3></li>' +
                    '   <li>Esta instrucción de cancelación se aplicará el día 24/08/2018, sin necesidad de que el cliente vuelva a la oficina.</li>' +
                    '   <li>Al titulo físico debe escribirle "CANCELADO" y lo debe enviar en el movimiento de HOY de la oficina.</li>' +
                    '   <li>Una vez aplicada la instrucción de cancelación, NO se puede reversar.</li>' +
                    '</ul>',
                listas: {
                    status: '',
                    content: ''
                }
            };

            $scope.dialogs = {
                checkListas: 'Error al verificar al cliente en listas restrictivas. Intente mas tarde',
                sinFecha: 'Para continuar, VINCULE EL CLIENTE AL BANCO'
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {

                cancelacion: function () {


                    $scope.$api.cancelacionCdtCobis().then(function (response) {

                        if (response.data) {

                            if (response.data.caracterAceptacion == 'B') {

                                $scope.cambioAplicado = true;
                                $scope.emailOFF = false;
                                $scope.aplicarOFF = true;
                                $scope.$gui.enviarNotificacion();

                            } else if (response.data.caracterAceptacion == 'M') {


                                $scope.cambioAplicado = false;
                                $dialog.open({
                                    status: 'error',
                                    content: response.data.msgRespuesta || 'Error'
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
                                content: response.headers('Respuesta') || 'Ha ocurrido un error inesperado'
                            });

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Ha ocurrido un error inesperado'
                            });

                        }

                    });

                },

                aplicarCambio: function () {

                    $scope.$gui.cancelacion();

                },

                changeforma: function () {

                    $scope.$gui.resetCampos();

                },

                resetCampos: function () {

                    $scope.instruccion.cuentaFormaPagoIntereses = '';
                    $scope.instruccion.correo = '';

                },
                enviarNotificacion: function () {

                    var fecOperacion = $filter('date')(new Date(), 'dd/MM/yyyy'),
                        informacionEnvioMailObj = {
                            nombre: $scope.extract,
                            email: $scope.instruccion.correo.Email
                        };

                    $scope.$api.enviarNotificacionesMail(informacionEnvioMailObj).then(function (resp) {

                        if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

                            $dialog.open({
                                status: 'success',
                                content: 'Resultado enviado exitosamente<br><strong>Fecha operación:</strong> ' + fecOperacion
                            });
                            $scope.emailOFF = true;

                        } else {

                            $dialog.open({
                                status: 'error',
                                content: resp.data.msgRespuesta || 'Error'
                            });

                        }



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

                lovCuentas: function () {

                    var arr = CONFIG.objPersona.listOfDavFincorpaccountBc ? CONFIG.objPersona.listOfDavFincorpaccountBc.davFincorpaccountBc : CONFIG.objPersona.listOfFincorpAccount.fincorpAccount,
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
                consultaCdtXEstado: function () {

                    $scope.$api.consultaCdtXEstado().then(function (response) {

                        var fechaSistema = $filter('date')(new Date(), 'dd/MM/yyyy');

                        angular.forEach(response.data.registros, function (registro, i) {

                            // si es ACT y fecVencimientoOperacion diferente de la actual no se muestra
                            if ((registro.valEstado == 'ACT' && registro.fecVencimientoOperacionHomologado == fechaSistema) || registro.valEstado == 'VEN') {

                                if (registro.valBloqueoLegal && registro.valBloqueoLegal == 'S') {

                                    registro.subEstado = 'EMBARGADO';
                                    $scope.Subestado = '1';

                                } else if (registro.valBloqueoNovedades && registro.valBloqueoNovedades == 'S') {

                                    registro.subEstado = 'BLOQUEADO ' + (registro.valDescCausalBloqueo ? registro.valDescCausalBloqueo : '');
                                    $scope.Subestado = '1';

                                } else if (registro.valDescAccionSiguiente && registro.valDescAccionSiguiente == 'POR CANCELAR') {

                                    registro.subEstado = 'INSTRUCCIÓN DE CANCELACIÓN';
                                    $scope.Subestado = '1';

                                } else if (registro.valProductoEnGarantia && registro.valProductoEnGarantia == 'S') {

                                    registro.subEstado = 'EN GARANTÍA';
                                    $scope.Subestado = '1';

                                } else {

                                    $scope.Subestado = '2';

                                }

                            }

                            $scope.descSubestado = registro.subEstado;

                        });

                        $scope.caption = {
                            listas: {
                                status: '',
                                content: ''
                            },
                            informacion_1: 'No puede ejecutarse el proceso de cancelación para el CDT No ' + $scope.numCDT[0].valNumeroCDT + '. Subestado: ' + $scope.descSubestado,
                            informacion_2: 'No puede ejecutarse el proceso de cancelación para el CDT No ' + $scope.numCDT[0].valNumeroCDT + '. Ha ocurido un error inesperado'

                        };

                    }, function (response) {

                        if (response.status !== 417) {

                            $dialog.open({
                                status: 'error',
                                content: 'Ha ocurrido un error inesperado'
                            });

                        }

                    });

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
                enviarNotificacionesMail: function (params) {

                    return $api.pymes.enviarNotificacionesMail({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        email: params.email,
                        idPlantilla: 'NotificaCancelacionCdtC360.html',
                        asunto: 'Novedad Cancelación CDT',
                        formato: 'html',
                        tipoNotificacion: 'CdtCancelacion',
                        parametros: [{
                            valNombre: 'numeroCdt',
                            valValor: $scope.numCDT[0].valNumeroCDT
                        }, {
                            valNombre: 'fechaVencimiento',
                            valValor: $filter('date')($filter('davDates')($scope.fechaExp, 'yyyyMMdd'), 'yyyy/MM/dd')
                        }],
                        adjuntos: []
                    });

                },
                cancelacionCdtCobis: function () {

                    return $api.consultaCdt.cancelacionCdtCobis({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficina,
                        valNumeroCDT: $scope.numCDT[0].valNumeroCDT,
                        codOficina: CONFIG.hostOficina || (CONFIG.oficina.toString().length > 4 ? CONFIG.oficina.slice(-4) : CONFIG.oficina),
                        codAgenteVendedor: $rootScope.$data.codAgenteVendedor,
                        codTipoDocumento: CONFIG.idType,
                        idDocumento: CONFIG.idNumber,
                        codMoneda: $scope.numCDT[0].codMoneda,
                        codProducto: $scope.instruccion.cuentaFormaPagoIntereses.tipo,
                        valCuentaDebito: $scope.instruccion.cuentaFormaPagoIntereses.value,
                        valValorMovimiento: $scope.numCDT[0].valMontoActualOperacion
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
