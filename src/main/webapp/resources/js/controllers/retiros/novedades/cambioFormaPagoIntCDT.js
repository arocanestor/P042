/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('cambioFormaPagoIntCDTCtrl', [
        '$scope',
        'servicioNumCDT',
        '$rootScope',
        'CONFIG',
        '$slm-dialog',
        '$filter',
        '$api',
        '$state',
        '$utilities',
        function (
            $scope,
            servicioNumCDT,
            $rootScope,
            CONFIG,
            $dialog,
            $filter,
            $api,
            $state,
            $utilities
        ) {


            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,
                nameSpace = $rootScope.account[$rootScope.routeApp['3']];




            $scope.emailCliente = ($filter('filter')($utilities.arrNormalize(PERSONA.EMAILS, 'EMAIL'), {
                            DAV_PrincipalEmail: 'Y'
                        })[0] || {
                            Email: undefined
                        }).Email;


            $scope.phone = ($filter('filter')($utilities.arrNormalize(PERSONA.TELEFONOS, 'TELEFONO'), {
                            DAV_PrincipalTelephone: 'Y'
                        })[0] || {
                            Number: 0
                        });

            if (CONFIG.persona == 'natural' || CONFIG.naturalConNegocio) {

                $scope.name = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;
                $scope.alias = CLIENTE.Nombres;

            } else {

                $scope.name = CLIENTE.Name;
                $scope.alias = CLIENTE.Name;

            }

            $scope.numCDT = servicioNumCDT.cdt;
            $scope.emailOFF = true;
            $scope.aplicarOFF = false;

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
            $scope.forma = {};
            $scope.form = {
                Endoso: {},
                cambioForma: {}
            };

            $scope.lovs = nameSpace.lovs;
            $scope.lovs.lov_productos = [];
            $scope.lovs.lov_email = PERSONA.EMAILS;
            $scope.lovs.lov_cdt_forma_pago_intereses_filtro = [];
            $scope.cambioAplicado = {};

            $scope.listaBancos = [];

            $scope.listaTipoCuentas= [{
                cod: 'AHO',
                tipo: 'Cuenta de ahorros'
            }, {
                cod: 'CTE',
                tipo: 'Cuenta corriente'
            }]

            $scope.caption = {
                listas: {
                    status: '',
                    content: ''
                },
                confirmacionNic: {
                    status: '',
                    content: ''
                },
                info: 'El cambio de forma de pago de próximos intereses se ha aplicado.',
                error: 'El cambio de forma de pago de próximos intereses no pudo ser aplicado.'
            };

            $scope.dialogs = {
                checkListas: 'Error al verificar al cliente en listas restrictivas. Intente mas tarde',
                sinFecha: 'Para continuar, VINCULE EL CLIENTE AL BANCO'
            };


            $scope.dialogs = {
                checkListas: 'Error al verificar al cliente en listas restrictivas. Intente mas tarde',
                fechaMenor: 'EL CLIENTE TIENE SUS DATOS ACTUALIZADOS, puede continuar',
                fechaMayor: 'Para continuar, ACTUALICE LOS DATOS DEL CLIENTE',
                sinFecha: 'Para continuar, VINCULE EL CLIENTE AL BANCO'
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */


            $scope.$gui = {

                finalizar: function () {

                    if ($scope.forma.formaPagoIntereses.codigo == '3') {


                        $scope.$api.inscribirCuentaACHCDT().then(function (resp) {

                            if (resp.data.codMsgRespuesta.toString() === '0' && resp.data.caracterAceptacion === 'B') {
                                $scope.$gui.mantenimiento();
                            } else {
                                $dialog.open({
                                    status: 'error',
                                    content: resp.msgRespuesta || 'Ha ocurrido un error inesperado'
                                });
                            }

                        }, function (resp) {


                            $dialog.open({
                                status: 'error',
                                content: resp.headers("Respuesta") || 'Ha ocurrido un error inesperado'
                            });

                        });

                    } else {
                        $scope.$gui.mantenimiento();
                    }


                },

                mantenimiento: function () {

                    $scope.$api.mantenimientoCdt().then(function (response) {

                        if (response) {

                            if (response.data.codCDT && response.data.caracterAceptacion == 'B') {

                                $scope.cambioAplicado = true;
                                $scope.emailOFF = false;
                                $scope.aplicarOFF = true;
                                $scope.$gui.enviarNotificacion();

                            } else if (response.data.codCDT && response.data.caracterAceptacion == 'M') {

                                $scope.cambioAplicado = false;

                            }

                        }

                    }, function (resp) {

                        if (resp.status == 417) {

                            $dialog.open({
                                status: 'error',
                                content: resp.headers("Respuesta") || 'No fue posible realizar la consulta, por favor intente nuevamente'
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

                    $scope.forma.cuentaFormaPagoIntereses = '';
                    $scope.forma.correo = '';

                },
                enviarNotificacion: function () {

                    var fecOperacion = $filter('date')(new Date(), 'dd/MM/yyyy'),
                        informacionEnvioMailObj = {
                            nombre: $scope.extract,
                            email: $scope.forma.correo.Email
                        };

                    $scope.$api.enviarNotificacionesMail(informacionEnvioMailObj).then(function (resp) {

                        if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

                            $scope.emailOFF = false;
                            $dialog.open({
                                status: 'success',
                                content: 'Resultado enviado exitosamente<br><strong>Fecha operación:</strong> ' + fecOperacion
                            });

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

                        if ((value.davEffectiveProduct === 'VIGENTE' || value.davEffectiveProduct === '01')) {

                            var codigoSubProducto = value.davSubproductCode.slice(-4);

                            if (value.codigoProducto == '0550' || value.codigoProducto == '0570') {

                                cuentas.push({
                                    value: value.accountNumber3,
                                    label: 'Cuenta Davivienda - Ahorros ' + value.accountNumber3.slice(-4),
                                    tipo: 'AHO'
                                });

                            } else if (value.codigoProducto == '0560') {

                                cuentas.push({
                                    value: value.accountNumber3,
                                    label: 'Cuenta Davivienda - Corriente ' + value.accountNumber3.slice(-4),
                                    tipo: 'CTE'
                                });

                            }


                            // if ((['2000', '2001', '2080', '2081', '2090']).indexOf(codigoSubProducto) != -1) {
                            // }

                        }

                    });


                    $scope.lovs.lov_productos = cuentas;

                }
            };

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                mantenimientoCdt: function () {

                    var cdt = $scope.numCDT[0];

                    return $api.consultaCdt.mantenimientoCdt({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficina,
                        operacion: {
                            valNumeroCDT: cdt.valNumeroCDT
                        },
                        detallePago: [{
                            codTipoDocumento: CONFIG.idType,
                            valNumeroDocumento: CONFIG.idNumber,
                            codFormaPago: $scope.forma.formaPagoIntereses.codigo == '1' ? $scope.forma.cuentaFormaPagoIntereses.tipo : $scope.forma.formaPagoIntereses.codigo == '2' ? 'EFEC' : 'PSE',
                            codMonedaPago: 0,
                            valPorcentaje: 100,
                            codPeriocidadPago: cdt.codFormaPago,
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                            codTipoCuentaAch: $scope.forma.formaPagoIntereses.codigo == '3' ? $scope.forma.tipoCuenta.cod == 'AHO'? 'A' : 'C' : undefined,
                            codBancoAch: $scope.forma.formaPagoIntereses.codigo == '3' ? $scope.forma.bancoDestino.codigoBanco : undefined,
                            valCuentaPro: $scope.forma.formaPagoIntereses.codigo == '2' ? undefined : $scope.forma.formaPagoIntereses.codigo == '3' ? $scope.forma.numProduct : ($scope.forma.cuentaFormaPagoIntereses.value || '')
                        }]

                    });

                },

                enviarNotificacionesMail: function (params) {

                    return $api.pymes.enviarNotificacionesMail({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficinaTotal,
                        email: params.email,
                        idPlantilla: 'NotificaCambioCdtC360.html',
                        asunto: 'Novedad Forma y Medio de Pago CDT',
                        formato: 'html',
                        tipoNotificacion: 'CdtCambio',
                        parametros: [{
                            valNombre: 'numeroCdt',
                            valValor: $scope.numCDT[0].valNumeroCDT
                        },
                        {
                            valNombre: 'formaPago',
                            valValor: $scope.forma.formaPagoIntereses.desc
                        }],
                        adjuntos: []
                    });

                },
                // CHECK LISTAS RESTRICTIVAS
                checkListas: function () {

                    return $api.cautela.listas({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        perfil: CONFIG.perfil,
                        tipoIdentificacionTitular: CONFIG.idType,
                        nroIdentificacionTitular: CONFIG.idNumber,
                        oficinaTotal: CONFIG.oficina
                    });

                },

                consultaBancos: function () {

                    return $api.administrador.consultaBancos();

                },

                inscribirCuentaACHCDT: function () {

                    return $api.consultaCdt.inscribirCuentaACHCDT({
                        numTipoID: CONFIG.idType,
                        numNumeroDeID: CONFIG.idNumber,
                        numCodigoDePais: '0',
                        numCodigoDeArea: '0',
                        numNumeroDeTelefono: '0',
                        numExtension: '0',
                        valCorreoElectronico: $scope.emailCliente == undefined ? "" : $scope.emailCliente,
                        numCelular: $scope.phone.Number,
                        numCantidadDeCuentas: '1',
                        numCodigoBancoDeCuentaACH: $scope.forma.bancoDestino.codigoBanco,
                        numTipoCuentaACH: $scope.forma.tipoCuenta.cod == 'AHO'? '3' : '1',
                        valNumeroCuentaACH: $scope.forma.numProduct,
                        numNovedadCuentaACH: '4',
                        numTipoIDDelCliente: CONFIG.idType,
                        numNumeroIDDelCliente: CONFIG.idNumber,
                        valNombreDelCliente: $scope.name,
                        valAliasDelCliente: $scope.alias,
                        numValidaID: '1',
                        numNovedadDeLosFondos: '0',
                        valNumeroDeCDT: $scope.numCDT[0].valNumeroCDT,
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario.substring(0,3),
                        perfil: CONFIG.perfil,
                        oficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                        oficinaTotal: CONFIG.oficina.slice(-4)
                    });

                }

            };


            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.$program.lovCuentas();

            $scope.$api.checkListas().then(function (response) {

                var data = response.data,
                    estructura = data.registros[0].codigoMarcacion ? data.registros[0].codigoMarcacion + '-' + data.caracterAceptacion + '-2' : data.registros[0].codigoLista + '-' + data.caracterAceptacion + '-1',
                    coincidencias = $filter('filter')($scope.lovs.lov_excluir_listas_cdt, {
                        codigo: estructura
                    });

                if (coincidencias.length) {

                    $scope.caption.listas.status = 'success';
                    $scope.caption.listas.content = coincidencias[0].desc;

                } else {

                    $scope.caption.listas.status = 'error';
                    $scope.caption.listas.content = data.registros[0].codigoMarcacionMensajeHomologado || data.registros[0].codigoListaHomolgado;

                }

            }, function (response) {

                if (response.status === 417) {

                    $scope.caption.listas.status = 'success';
                    $scope.caption.listas.content = response.headers('Respuesta');

                } else {

                    $dialog.open({
                        status: 'error',
                        title: 'CONSULTA LISTAS RESTRICTIVAS',
                        content: 'Error código: <b>' + response.status + '</b><br>Intente Nuevamente',
                        accept: function () {

                            $state.go('^'); // volvemos al dashboard

                        }
                    });

                }

            });

            // validar la fecha de actualizacion de datos del CLIENTE
            var fechaSistema = $filter('date')(new Date(), 'yyyy/MM/dd'),
                fechaActualizacion = CONFIG.persona === 'natural' || CONFIG.naturalConNegocio ? CLIENTE.ClientDataUpdateDate : CLIENTE.CustomerUpdateData;

            if (fechaActualizacion) {

                var fechaSistemaFormato = new Date(fechaSistema.slice(0, 4) + ',' + fechaSistema.slice(5, 7) + ',' + fechaSistema.slice(8, 11)).getTime(),
                    fechaActualizacionFormato = new Date(fechaActualizacion.slice(0, 4) + ',' + fechaActualizacion.slice(5, 7) + ',' + fechaActualizacion.slice(8, 11)).getTime(),
                    difFechas = fechaSistemaFormato - fechaActualizacionFormato,
                    dias = Math.floor(difFechas / (1000 * 60 * 60 * 24));

                $scope.caption.confirmacionNic.status = dias > '365' ? 'error' : 'success';
                $scope.caption.confirmacionNic.content = dias > '365' ? $scope.dialogs.fechaMayor : $scope.dialogs.fechaMenor;

            } else {

                $scope.caption.confirmacionNic.status = 'error';
                $scope.caption.confirmacionNic.content = $scope.dialogs.sinFecha;

            }


            if ($scope.numCDT[0].codTipoOperacion == 'CF08' && $scope.numCDT[0].valNumeroPreimpreso == 0) {
                $scope.tipo = 'movilDav';
                if ($scope.lovs.lov_productos.length == 0) {
                    angular.forEach($scope.lovs.lov_cdt_forma_pago_intereses, function (lov) {

                        if (lov.codigo == '3') {
                            $scope.lovs.lov_cdt_forma_pago_intereses_filtro.push (lov);
                        }

                    });
                } else {
                    angular.forEach($scope.lovs.lov_cdt_forma_pago_intereses, function (lov) {

                        if (lov.codigo == '1') {
                            $scope.lovs.lov_cdt_forma_pago_intereses_filtro.push (lov);
                        }

                    });
                }
            } else if ($scope.numCDT[0].codTipoOperacion == 'CF09' && $scope.numCDT[0].valNumeroPreimpreso == 0) {
                $scope.tipo = 'movilOtros';
                angular.forEach($scope.lovs.lov_cdt_forma_pago_intereses, function (lov) {

                    if (lov.codigo == '1' || lov.codigo == '3') {
                        $scope.lovs.lov_cdt_forma_pago_intereses_filtro.push (lov);
                    }

                });
            } else {
                $scope.tipo = 'noMovil';
                angular.forEach($scope.lovs.lov_cdt_forma_pago_intereses, function (lov) {

                    if (lov.codigo == '1' || lov.codigo == '2') {
                        $scope.lovs.lov_cdt_forma_pago_intereses_filtro.push (lov);
                    }

                });
            }

            if ($scope.tipo == 'movilDav' || $scope.tipo == 'movilOtros') {
                $scope.$api.consultaBancos().then(function (resp) {

                    angular.forEach(resp.data.bancos, function (banco) {

                        if (banco.estadoBanco == '01') {
                            $scope.listaBancos.push({
                                codigoBanco: banco.codigoBanco,
                                nombreBanco: banco.nombreBanco,
                                longitudCTAAH: banco.longitudCTAAH,
                                logitudCTACTE: banco.logitudCTACTE
                            });
                        }

                    });

                }, function () {

                    $dialog.open({
                        status: 'error',
                        title: 'CONSULTA Bancos',
                        content: 'Ha ocurrido un error inesperado',
                        accept: function () {

                            //$state.go('^'); // volvemos al dashboard

                        }
                    });

                });
            }


        }
    ]);

});
