/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('simulacionCDTCtrl', [
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

            $scope.title = 'Apertura ' + $rootScope.lov.lov_productos_venta_en_linea_obj['3'].desc;
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

                    /**
                     * Reseteo de campos para Consulta Tipo Deposito
                     * @type {Object}
                     */
                    $scope.simulacion = {};

                    /**
                     * Realizar consultaTipoDepositoSolicitud
                     * @type {[type]}
                     */
                    $scope.$program.consultaTipoDepositoSolicitud();

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
                                    content: resp.headers('Respuesta') || 'Ha ocurrido un error inesperado'
                                });

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
                            obj.DAV_PrincipalEmail = obj.PrimaryEmail == 'Y' || obj.DAV_PrincipalEmail == 'Y';

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
                            content: resp.headers('Respuesta') || 'Ha ocurrido un error inesperado'
                        });

                    });

                },

                enviarNotificacion: function (correo) {

                    var fecOperacion = $filter('date')(new Date(), 'dd/MM/yyyy'),
                        informacionEnvioMailObj = {
                            nombre: $scope.extract,
                            email: correo.Email == 'Otro correo' ? correo.otherEmail : correo.Email
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
                                    content: resp.headers("Respuesta") || 'La Tasa autorizada con atribuciones, no fue aprobada.'
                                    // content: 'La Tasa autorizada con atribuciones, no fue aprobada.',
                                });

                                $scope.simulacion.tasaAtribucion = '';

                            });

                        }

                    }, 1000);

                },

                guardarCDT: function () {

                    nameSpace.simulacion = $scope.simulacion;

                    if ($scope.tipoProyeccion.seleccion == 'cdt') {

                        nameSpace.proyeccion = $scope.proyeccionCDT;

                    } else if ($scope.tipoProyeccion.seleccion == 'proyeccion1') {

                        nameSpace.proyeccion = $scope.proyeccion1;

                    } else {

                        nameSpace.proyeccion = $scope.proyeccion2;

                    }

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$program = {

                consultaTipoDepositoSolicitud: function () {

                    $scope.$api.consultaTipoDepositoSolicitud().then(function (resp) {

                        var depositos = resp.data.depositos,
                            tipoPersona = '';
                        $scope.arrDepositos = [];

                        $scope.lovs.filtroTipoProducto = [];

                        if (CONFIG.persona == 'natural') {
                            if(CONFIG.naturalConNegocio) {
                                tipoPersona = 'PNCN'
                            } else {
                                tipoPersona = 'PN'
                            }
                        } else {
                            tipoPersona = 'PJ'
                        }

                        angular.forEach($scope.lovs.lov_cdt_tipo_producto, function (obj) {
                            if(obj.desc == tipoPersona) {
                                $scope.lovs.filtroTipoProducto.push(obj);    
                            }                                    
                        });

                        angular.forEach(depositos, function (deposito, i) {

                            angular.forEach($scope.lovs.filtroTipoProducto, function (obj) {
                                
                                if(obj.codigo == deposito.codTipoDeposito) {
                                    
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
                                        fechaPlazoMin: $filter('date')($filter('davDates')(deposito.rangoMontos[0].fecFechaPlazoMinHomologado, 'yyyyMMdd'), 'dd/MM/yyyy'),
                                        fechaPlazoMax: $filter('date')($filter('davDates')(deposito.rangoMontos[0].fecFechaPlazoMaxHomologado, 'yyyyMMdd'), 'dd/MM/yyyy'),
                                        codMoneda: deposito.codMoneda,
                                        codCategoria: deposito.categorias[0].codCategoria
                                    });    

                                }                                    
                            
                            });                            

                        });

                    }, function (resp) {

                        $dialog.open({
                            status: 'error',
                            content: resp.headers('Respuesta') || 'Ha ocurrido un error inesperado',
                            accept: function () {

                                $state.go('^');

                            }
                        });

                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                consultaTipoDepositoSolicitud: function () {

                    return $api.Cdat.consultaTipoDepositoSolicitud({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        producto: 'cdt', // solo se envia para cuando se hace llamado desde cdt porque se necesita enviar otro codOficina diferente al de cdat
                        contextoRequerimiento: {
                            idTransaccional: CONFIG.rowId
                        },
                        consultarTipoDeposito: {
                            codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                            codMoneda: '0'
                        }
                    });

                },

                consultaPeriodoTasa: function () {

                    return $api.consultaCdt.consultaPeriodoTasa({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        valIdTransaccional: 'ConsultaPeriodoTasa',
                        valCodTipoDeposito: $scope.simulacion.tipoCDT.codigo,
                        fechaValor: $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00.000-05:00'),
                        numPlazo: (function () {

                            var plazo = '';

                            if ($scope.simulacion.tipoPlazo != 'calendario') {

                                plazo = $scope.simulacion.tipoPlazo == 'dias' ? Number($scope.simulacion.plazo) : Number($scope.simulacion.plazo) * 30;

                            } else {

                                plazo = undefined;

                            }

                            return plazo;

                        }()),
                        fechaVencimiento: $scope.simulacion.tipoPlazo == 'calendario' ? $scope.simulacion.dateFrom.split('/')[2] + '-' + $scope.simulacion.dateFrom.split('/')[1] + '-' + $scope.simulacion.dateFrom.split('/')[0] + 'T00:00:00.000-05:00' : undefined,
                        numMonto: $scope.simulacion.valorInversion,
                        numCodMoneda: $scope.simulacion.tipoCDT.codMoneda,
                        valCodMomento: 'N',
                        valCodTipoDocumento: CONFIG.idType,
                        valDocumento: CONFIG.idNumber
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
                        valMontoInversion: $scope.simulacion.valorInversion,
                        codPeriodoPago: $scope.simulacion.frecuenciaCod, // si el cliente no quiere capitalizar intereses se envia por defecto el periodo Al vencimiento(NNN)
                        codTipoDocumento: CONFIG.idType,
                        idDocumento: CONFIG.idNumber,
                        fecFechaInversion: $scope.lovs.lov_cdt_sysdate[0].codigo == 'true' ? $filter('date')(new Date(), 'yyyy-MM-ddT00:00:00') : $scope.lovs.lov_cdt_sysdate[0].desc,
                        fecFechaVencimiento: $scope.consultaPlazo.valFechaVenHomologado,
                        codMomento: 'N',
                        operadorPuntos: '+',
                        puntosAdicionales: difTasas,
                        indicadorOfiSiebel: 'S'
                    });

                },

                enviarNotificacionesMail: function (params) {

                    var fechaA = new Date();
                    var meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

                    return $api.pymes.enviarNotificacionesMail({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        email: params.email,
                        idPlantilla: 'SimulacionAperturaCDT360.html',
                        asunto: 'Simulación CDT',
                        formato: 'html',
                        tipoNotificacion: 'CdtSimulacionApertura',
                        parametros: [{
                            valNombre: 'tipoProducto',
                            valValor: $scope.simulacion.tipoCDT.desc || ''
                        }, {
                            valNombre: 'fechaSimulacion',
                            valValor: $filter('date')($filter('davDates')(fechaA, 'yyyyMMdd'), 'yyyy/MM/dd') || ''
                        }, {
                            valNombre: 'valorInversion',
                            valValor: $scope.simulacion ? ($filter('currency')($filter('davCurrency')($scope.simulacion.valorInversion, 'add')).slice(1) || '0.00') : '0.00'
                        }, {
                            valNombre: 'interesDesSolicitada',
                            valValor: ($scope.proyeccionCDT && $scope.proyeccionCDT.valTotalInteresesNetoHomologado) ? $scope.proyeccionCDT.valTotalInteresesNetoHomologado.slice(1) : '0.00'
                        }, {
                            valNombre: 'interesDesDavivienda1',
                            valValor: ($scope.proyeccion1 && $scope.proyeccion1.valTotalInteresesNetoHomologado) ? $scope.proyeccion1.valTotalInteresesNetoHomologado.slice(1) : '0.00'
                        }, {
                            valNombre: 'interesDesDavivienda2',
                            valValor: ($scope.proyeccion2 && $scope.proyeccion2.valTotalInteresesNetoHomologado) ? $scope.proyeccion2.valTotalInteresesNetoHomologado.slice(1) : '0.00'
                        }, {
                            valNombre: 'interesAntesSolicitada',
                            valValor: ($scope.proyeccionCDT && $scope.proyeccionCDT.valTotalInteresEstimado) ? $scope.proyeccionCDT.valTotalInteresEstimado.slice(1) : '0.00'
                        }, {
                            valNombre: 'interesAntesDavivienda1',
                            valValor: ($scope.proyeccion1 && $scope.proyeccion1.valTotalInteresEstimado) ? $scope.proyeccion1.valTotalInteresEstimado.slice(1) : '0.00'
                        }, {
                            valNombre: 'interesAntesDavivienda2',
                            valValor: ($scope.proyeccion2 && $scope.proyeccion2.valTotalInteresEstimado) ? $scope.proyeccion2.valTotalInteresEstimado.slice(1) : '0.00'
                        }, {
                            valNombre: 'TasaEASolicitada',
                            valValor: ($scope.proyeccionCDT && $scope.proyeccionCDT.valTasaEfectiva && $scope.simulacion.tipoCDT.valTieneTasaVariable != 'S') ? ($scope.proyeccionCDT.valTasaEfectiva.toString()) : ($scope.proyeccionCDT && $scope.proyeccionCDT.valTasaEfectiva ? $scope.proyeccionCDT.valTasaEfectiva.toString() : "0.0")
                        }, {
                            valNombre: 'TasaEADavivienda1',
                            valValor: ($scope.proyeccion1 && $scope.proyeccion1.valTasaEfectiva && $scope.simulacion.tipoCDT.valTieneTasaVariable != 'S') ? ($scope.proyeccion1.valTasaEfectiva.toString()) : ($scope.proyeccion1 && $scope.proyeccion1.valTasaEfectiva ? $scope.proyeccion1.valTasaEfectiva.toString() : "0.0")
                        }, {
                            valNombre: 'TasaEADavivienda2',
                            valValor: ($scope.proyeccion2 && $scope.proyeccion2.valTasaEfectiva && $scope.simulacion.tipoCDT.valTieneTasaVariable != 'S') ? ($scope.proyeccion2.valTasaEfectiva.toString()) : ($scope.proyeccion2 && $scope.proyeccion2.valTasaEfectiva ? $scope.proyeccion2.valTasaEfectiva.toString() : "0.0")
                        }, {
                            valNombre: 'PlazoSolicitada',
                            valValor: ($scope.proyeccionCDT && $scope.proyeccionCDT.valPlazoDias) ? $scope.proyeccionCDT.valPlazoDias.toString() : "0"
                        }, {
                            valNombre: 'PlazoDavivienda1',
                            valValor: ($scope.proyeccion1 && $scope.proyeccion1.valPlazoDias) ? $scope.proyeccion1.valPlazoDias.toString() : "0"
                        }, {
                            valNombre: 'PlazoDavivienda2',
                            valValor: ($scope.proyeccion2 && $scope.proyeccion2.valPlazoDias) ? $scope.proyeccion2.valPlazoDias.toString() : "0"
                        }, {
                            valNombre: 'FechaVenSolicitada',
                            valValor: $scope.proyeccionCDT.fecFechaVencimientoHomologado ? $scope.proyeccionCDT.fecFechaVencimientoHomologado.split('/')[2] + '/' + $scope.proyeccionCDT.fecFechaVencimientoHomologado.split('/')[1] + '/' + $scope.proyeccionCDT.fecFechaVencimientoHomologado.split('/')[0] : '0000/00/00'
                        }, {
                            valNombre: 'FechaVenDavivienda1',
                            valValor: $scope.proyeccion1.fecFechaVencimientoHomologado ? $scope.proyeccion1.fecFechaVencimientoHomologado.split('/')[2] + '/' + $scope.proyeccion1.fecFechaVencimientoHomologado.split('/')[1] + '/' + $scope.proyeccion1.fecFechaVencimientoHomologado.split('/')[0] : '0000/00/00'
                        }, {
                            valNombre: 'FechaVenDavivienda2',
                            valValor: $scope.proyeccion2.fecFechaVencimientoHomologado ? $scope.proyeccion2.fecFechaVencimientoHomologado.split('/')[2] + '/' + $scope.proyeccion2.fecFechaVencimientoHomologado.split('/')[1] + '/' + $scope.proyeccion2.fecFechaVencimientoHomologado.split('/')[0] : '0000/00/00'
                        }, {
                            valNombre: 'TasaVigente',
                            valValor: meses[fechaA.getMonth()]
                        }, {
                            valNombre: 'año',
                            valValor: fechaA.getFullYear().toString()
                        }],
                        adjuntos: []
                    });

                },

                consultaAtribucionesCdt: function () {

                    return $api.consultaCdt.consultaAtribucionesCdt({
                        rowId: CONFIG.rowId,
                        oficinaTotal: CONFIG.oficinaTotal,
                        usuario: CONFIG.usuario,
                        codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4),
                        codTipoDeposito: $scope.simulacion.tipoCDT.codigo,
                        valMontoAtribucion: $scope.simulacion.valorInversion,
                        codPlazoAtribucion: $scope.consultaPlazo.valPlazo,
                        codTipoPersona: $scope.tipoCliente,
                        valTasaAutorizada: $scope.simulacion.tasaAtribucion
                    });

                }
            };

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.$program.consultaTipoDepositoSolicitud();

        }
    ]);

});
