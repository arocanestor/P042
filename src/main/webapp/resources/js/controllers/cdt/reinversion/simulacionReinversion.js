/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('simulacionReinversionCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        'CONFIG',
        '$timeout',
        '$slm-dialog',
        '$filter',
        '$state',
        '$utilities',
        '$spaUtils',
        function (
            $scope,
            $rootScope,
            $api,
            CONFIG,
            $timeout,
            $dialog,
            $filter,
            $state,
            $utilities,
            $spaUtils
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,
                nameSpace = $rootScope.account[$rootScope.routeApp['3']];

            // N si es natural o J si es juridica para hacer validaciones en el hotmail
            $scope.tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';
            $scope.codOficina = CONFIG.hostOficina;

            $scope.title = 'Reinversión ' + $rootScope.lov.lov_productos_venta_en_linea_obj['3'].desc;
            if (CONFIG.persona == 'natural' || CONFIG.naturalConNegocio) {

                $scope.icon = 'fa-user-circle';
                $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            } else {

                $scope.icon = 'fa-building';
                $scope.extract = CLIENTE.Name;

            }
            $scope.lovs = nameSpace.lovs;
            $scope.simulacion = {};
            nameSpace.simulacion = {};
            nameSpace.proyeccion = {};
            $scope.cdtSeleccionado = nameSpace.cdtSeleccionado;
            $scope.inputChangedPromise = '';

            $scope.lovs.lov_email = [];

            $scope.intereses = [{
                value: 'Si',
                label: 'Si'
            }, {
                value: 'No',
                label: 'No'
            }];

            $scope.arrDepositos = [];
            $scope.simulacion.valorInversion = $scope.cdtSeleccionado.valMontoActualOperacion;

            $scope.periodo = {};
            $scope.rendimientos = [];

            $scope.proyeccionCDT = {};
            $scope.proyeccion1 = {};
            $scope.proyeccion2 = {};
            $scope.tipoProyeccion = {
                seleccion: ''
            };
            $scope.form = {};

            $scope.caption = {
                resultSimulacion: '<ul gui="list"><li>Si el cliente desea tener la simulación, envíesela al correo electrónico</li><li> Si el cliente acepta la oferta, continúe </li><li> Si el cliente desea hacer otra simulación, haga click en Volver a Simular</li></ul>',
                listas: {
                    status: '',
                    content: ''
                }
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                model: {
                    resultado: false
                },

                vaciarFormulario: function () {

                    var valorActualSave = $scope.simulacion.valorInversion;
                    $scope.simulacion = {};
                    $scope.simulacion.valorInversion = valorActualSave;
                    $scope.consultaTipoDepositoProductoSolicitud();

                    /**
                     * Reseteo de campos para simualcion view - Proyecciones
                     * @type {Object}
                     */
                    $scope.proyeccionCDT = {};
                    $scope.proyeccion1 = {};
                    $scope.proyeccion2 = {};
                    $scope.tipoProyeccion = {
                        seleccion: ''
                    };


                },

                guardarPeriocidad: function () {

                    if ($scope.simulacion.interes == 'Si') {

                        $scope.simulacion.frecuenciaDesc = 'AL VENCIMIENTO';
                        $scope.simulacion.frecuenciaCod = 'NNN';

                    } else if ($scope.simulacion.frecuencia) {

                        $scope.simulacion.frecuenciaDesc = $scope.simulacion.frecuencia.valDescPeriodo;
                        $scope.simulacion.frecuenciaCod = $scope.simulacion.frecuencia.valCodPeriodo;

                    }

                },

                cambioValorSimulacion: function () {


                    if ($scope.inputChangedPromise) {

                        $timeout.cancel($scope.inputChangedPromise);

                    }
                    $scope.inputChangedPromise = $timeout(function () {

                        if ($scope.form.valoresCDT.$valid) {

                            $scope.$api.consultaPeriodoTasa().then(function (resp) {

                                $scope.tipoTasas = resp.data.consultaTipoTasa;
                                $scope.rendimientos = resp.data.listaPeriodos;
                                $scope.consultaPlazo = resp.data.consultaPlazo;

                                var sumaTasas = '';
                                $scope.sumaTasasForzada = '';

                                if ($scope.tipoTasas) {

                                    var validador = $scope.tipoTasas.codTipoTasa && $scope.tipoTasas.valOperador && $scope.tipoTasas.valSpread !== null && $scope.tipoTasas.valSpread != undefined;

                                    if (validador) {

                                        sumaTasas = String($scope.tipoTasas.codTipoTasa) + ' ' + String($scope.tipoTasas.valOperador) + ' ' + String($scope.tipoTasas.valSpread);

                                    }



                                }

                                $scope.sumaTasasForzada = sumaTasas;

                                // se llena el campo Tasa de Cartelera
                                $scope.simulacion.tasaCartelera = $scope.simulacion.tipoCDT.valTieneTasaVariable == 'S' ? sumaTasas : Number(resp.data.consultaTasas.valTasaEfectiva);

                            }, function (resp) {

                                $dialog.open({
                                    status: 'error',
                                    title: 'CONSULTA PERIODO TASA',
                                    content: resp.headers("Respuesta") || "No fue posible consultar, por favor intente nuevamente"
                                });

                            });

                        }

                    }, 1000);


                },

                invocarAtribuciones: function () {

                    if ($scope.inputChangedPromise) {

                        $timeout.cancel($scope.inputChangedPromise);

                    }
                    $scope.inputChangedPromise = $timeout(function () {

                        if ($scope.form.tasas.$valid) {

                            $scope.$api.consultaAtribucionesCdt().then(function (resp) {

                            }, function (resp) {

                                $dialog.open({
                                    status: 'error',
                                    content: 'La Tasa autorizada con atribuciones, no fue aprobada.'
                                });

                                $scope.simulacion.tasaAtribucion = '';

                            });

                        }

                    }, 1000);

                },

                simular: function () {

                    // lleno la lista de correos electronicos del cliente
                    $scope.lovs.lov_email = (function () {

                        // map actua igual que el each pero con este se puede ir modificando cada valor
                        return PERSONA.EMAILS.map(function (obj) {

                            // PrimaryEmail es cuando es juridica y DAV_PrincipalEmail es para natural
                            obj.DAV_PrincipalEmail = obj.PrimaryEmail || obj.DAV_PrincipalEmail;

                            return obj;

                        });

                    }());

                    // se añade la opcion de otro correo a la lista de correos
                    $scope.lovs.lov_email.push({
                        Email: 'Otro correo'
                    });

                    // se precarga el correo principal del cliente
                    $scope.correo = $filter('filter')($scope.lovs.lov_email, {
                        DAV_PrincipalEmail: 'Y'
                    })[0];

                    $scope.$api.simulacionCdtClienteSolicitud().then(function (resp) {

                        $scope.tipoProyeccion.seleccion = 'cdt';

                        if ($scope.simulacion.tipoCDT.valTieneTasaVariable == 'S') {

                            angular.forEach(resp.data.proyecciones, function (proyeccion, i) {

                                if (proyeccion.idTipoProyeccion == 'cdt') {

                                    proyeccion.valTasaEfectiva = $scope.sumaTasasForzada;
                                    $scope.proyeccionCDT = proyeccion;

                                } else if (proyeccion.idTipoProyeccion == 'proyeccion1') {

                                    proyeccion.valTasaEfectiva = $scope.sumaTasasForzada;
                                    $scope.proyeccion1 = proyeccion;

                                } else {

                                    proyeccion.valTasaEfectiva = $scope.sumaTasasForzada;
                                    $scope.proyeccion2 = proyeccion;

                                }

                            });

                        } else {

                            angular.forEach(resp.data.proyecciones, function (proyeccion, i) {

                                if (proyeccion.idTipoProyeccion == 'cdt') {

                                    $scope.proyeccionCDT = proyeccion;

                                } else if (proyeccion.idTipoProyeccion == 'proyeccion1') {

                                    $scope.proyeccion1 = proyeccion;

                                } else {

                                    $scope.proyeccion2 = proyeccion;

                                }

                            });

                        }

                        $timeout(function () {

                            document.body.scrollTop = document.documentElement.scrollTop = 650;

                        }, 10);


                    }, function (resp) {

                        $dialog.open({
                            status: 'error',
                            title: 'SIMULACIÓN',
                            content: resp.headers("Respuesta") || "No fue posible simular, por favor intente nuevamente"
                        });

                    });

                },

                enviarNotificacion: function () {

                    var fecOperacion = $filter('date')(new Date(), 'dd/MM/yyyy'),
                        informacionEnvioMailObj = {
                            nombre: $scope.extract,
                            email: $scope.correo.Email == 'Otro correo' ? $scope.otroCorreo : $scope.correo.Email
                        };

                    $scope.$api.enviarNotificacionesMail(informacionEnvioMailObj).then(function (resp) {

                        $dialog.open({
                            status: 'success',
                            content: 'Resultado enviado exitosamente<br><strong>Fecha operación:</strong> ' + fecOperacion
                        });

                    }, function (resp) {

                        $dialog.open({
                            status: 'error',
                            content: resp.headers("Respuesta") || "No fue posible enviar notificación, por favor intente nuevamente"
                        });

                    });

                }

            };

            $scope.guardarCDT = function () {

                nameSpace.simulacion = $scope.simulacion;

                if ($scope.tipoProyeccion.seleccion == 'cdt') {

                    nameSpace.proyeccion = $scope.proyeccionCDT;

                } else if ($scope.tipoProyeccion.seleccion == 'proyeccion1') {

                    nameSpace.proyeccion = $scope.proyeccion1;

                } else {

                    nameSpace.proyeccion = $scope.proyeccion2;

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.consultaTipoDepositoProductoSolicitud = function () {

                $scope.$api.consultaTipoDepositoProductoSolicitud().then(function (resp) {

                    var depositos = resp.data.depositos;
                    $scope.arrDepositos = [];

                    angular.forEach(depositos, function (deposito, i) {

                        $scope.arrDepositos.push({
                            codigo: deposito.codTipoDeposito,
                            desc: deposito.valDescripcionTipoDeposito,
                            valBaseCalculo: deposito.valBaseCalculo,
                            valTieneTasaVariable: deposito.valTieneTasaVariable,
                            codSubproductoRPR: deposito.codSubproductoRPR,
                            montoMin: Number(deposito.rangoMontos[0].valMontoMin) - 1,
                            montoMax: Number(deposito.rangoMontos[0].valMontoMax) + 1,
                            plazoMin: Number(deposito.rangoMontos[0].valPlazoMin) - 1,
                            plazoMax: Number(deposito.rangoMontos[0].valPlazoMax) + 1,
                            fechaPlazoMin: $scope.formatoFechaMinMax(deposito.rangoMontos[0].fecFechaPlazoMinHomologado),
                            fechaPlazoMax: $scope.formatoFechaMinMax(deposito.rangoMontos[0].fecFechaPlazoMaxHomologado),
                            codMoneda: deposito.codMoneda,
                            codCategoria: deposito.categorias[0].codCategoria
                        });

                    });

                    $scope.simulacion.tipoCDT = $scope.arrDepositos[0];

                }, function (resp) {

                    $dialog.open({
                        status: 'error',
                        content: resp.headers('Respuesta') || 'Ha ocurrido un error inesperado'
                    });

                    $spaUtils.disableProduct('3');
                    $state.go('^');

                });

            };

            $scope.formatoFecha = function (date) {

                var value = date.toString().replace(/[//]/g, '');

                return value.replace(/(\d{2})(\d{2})(\d+)/, '$3-$2-$1T00:00:00.000-05:00');

            };

            $scope.formatoFechaMinMax = function (date) {

                var value = date.toString().replace(/[//]/g, '');

                return value.replace(/(\d{4})(\d{2})(\d+)/, '$3/$2/$1');

            };


            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                consultaTipoDepositoProductoSolicitud: function () {

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
                            codTipoDeposito: $scope.cdtSeleccionado.codTipoOperacion,
                            valNumeroCDT: $scope.cdtSeleccionado.valNumeroCDT,
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                            codMoneda: '0'
                        }
                    });

                },

                consultaPeriodoTasa: function () {

                    let PreFab_numPlazo;

                    if ($scope.simulacion.tipoPlazo != 'calendario') {

                        if ($scope.simulacion.tipoPlazo == 'dias') {

                            PreFab_numPlazo = Number($scope.simulacion.plazo);

                        } else {

                            PreFab_numPlazo = Number($scope.simulacion.plazo) * 30;

                        }

                    }

                    return $api.consultaCdt.consultaPeriodoTasa({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        valIdTransaccional: 'ConsultaPeriodoTasa',
                        valCodTipoDeposito: $scope.simulacion.tipoCDT.codigo,
                        fechaValor: $scope.formatoFecha($scope.cdtSeleccionado.fecVencimientoOperacionHomologado),
                        numPlazo: PreFab_numPlazo,
                        fechaVencimiento: $scope.simulacion.tipoPlazo == 'calendario' ? $scope.formatoFecha($scope.simulacion.dateFrom) : undefined,
                        numMonto: $scope.simulacion.valorReinversion,
                        numCodMoneda: $scope.simulacion.tipoCDT.codMoneda,
                        valCodMomento: 'R',
                        valCodTipoDocumento: CONFIG.idType,
                        valDocumento: CONFIG.idNumber
                    });

                },

                consultaAtribucionesCdt: function () {

                    return $api.consultaCdt.consultaAtribucionesCdt({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                        codTipoDeposito: $scope.simulacion.tipoCDT.codigo,
                        valMontoAtribucion: $scope.simulacion.valorReinversion,
                        codPlazoAtribucion: $scope.consultaPlazo.valPlazo,
                        codTipoPersona: $scope.tipoCliente,
                        valTasaAutorizada: $scope.simulacion.tasaAtribucion
                    });

                },

                simulacionCdtClienteSolicitud: function () {

                    var difTasas = $scope.simulacion.tasaAtribucion ? Number($scope.simulacion.tasaAtribucion) - Number($scope.simulacion.tasaCartelera) : '0.00';

                    return $api.consultaCdt.simulacionCdtClienteSolicitud({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        idTransaccional: 'SimulacionCdtClienteSolicitud',
                        codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                        codTipoDeposito: $scope.simulacion.tipoCDT.codigo,
                        codCategoria: $scope.simulacion.tipoCDT.codCategoria,
                        codMoneda: '0',
                        valPlazoDias: $scope.consultaPlazo.valPlazo,
                        valMontoInversion: $scope.simulacion.valorReinversion,
                        codPeriodoPago: $scope.simulacion.frecuenciaCod, // si el cliente no quiere capitalizar intereses se envia por defecto el periodo Al vencimiento(NNN)
                        codTipoDocumento: CONFIG.idType,
                        idDocumento: CONFIG.idNumber,
                        fecFechaInversion: $scope.formatoFecha($scope.cdtSeleccionado.fecVencimientoOperacionHomologado),
                        fecFechaVencimiento: $scope.consultaPlazo.valFechaVenHomologado,
                        codMomento: 'R',
                        codNumBanco: $scope.cdtSeleccionado.valNumeroCDT,
                        operadorPuntos: '+',
                        puntosAdicionales: difTasas,
                        indicadorOfiSiebel: 'S'
                    });

                },

                enviarNotificacionesMail: function (params) {

                    return $api.pymes.enviarNotificacionesMail({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        email: params.email,
                        idPlantilla: 'NotificacionPymeSastreC360.html',
                        asunto: 'Oferta Seguro Tranquilidad Pymes',
                        formato: 'html',
                        tipoNotificacion: 'PymeSastre',
                        parametros: [{
                            valNombre: 'nombre',
                            valValor: params.nombre
                        }],
                        adjuntos: [{
                            valNombre: 'Cotización seguro Tranquilidad Pymes Davivienda.pdf',
                            // valContenido: params.archivo,
                            valTipo: 'pdf'
                        }]
                    });

                }
            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.consultaTipoDepositoProductoSolicitud();

        }
    ]);

});
