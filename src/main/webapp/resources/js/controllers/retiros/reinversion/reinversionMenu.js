/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('reinversionMenuCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        'CONFIG',
        '$timeout',
        '$slm-dialog',
        '$filter',
        '$state',
        '$utilities',
        function (
            $scope,
            $rootScope,
            $api,
            CONFIG,
            $timeout,
            $dialog,
            $filter,
            $state,
            $utilities
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var CLIENTE = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT.CLIENTE : $rootScope.COMPANY.CLIENTE,
                // RESERVED NAMESPACE
                nameSpace = $rootScope.account[$rootScope.routeApp['3']];
            $scope.codOficina = CONFIG.hostOficina;
            $scope.title = 'Reinversión CDT';
            if (CONFIG.persona == 'natural' || CONFIG.naturalConNegocio) {

                $scope.icon = 'fa-user-circle';
                $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            } else {

                $scope.icon = 'fa-building';
                $scope.extract = CLIENTE.Name;

            }

            $scope.cdts = [];
            $scope.cdt = {};
            $scope.lovs = nameSpace.lovs;
            nameSpace.cdtSeleccionado = {};
            $scope.checks = {
                tabla: ''
            };

            // captions
            $scope.caption = {
                informacion: '<ul gui="list"><li>Si el CDT tiene intereses pendientes, acompañe al cliente a Caja para realizar el pago</li><li>En la reinversión puede modificar cualquier condición, excepto los titulares</li></ul>',
                listas: {
                    status: '',
                    content: ''
                },
                confirmacionNic: {
                    status: '',
                    content: ''
                },
                sinCDT: 'No hay CDT para reinvertir'
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

                obtenerCdt: function (cdt) {

                    if (cdt.valRendimientoXPagaNeto > 0) {

                        $dialog.open({
                            status: 'error',
                            content: 'El CDT seleccionado tiene intereses por pagar.</br>Realice el pago de los intereses para continuar con la reinversi&oacute;n',
                            accept: function () {}

                        });

                    }

                    $scope.cdtSeleccionado = cdt;

                },

                guardarInfo: function () {


                    nameSpace.cdtSeleccionado = $scope.cdtSeleccionado;

                }

            };


            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$program = {

                consultaCdtXEstado: function () {

                    $scope.cdts = [];

                    $scope.$api.consultaCdtXEstado().then(function (response) {

                        var fechaSistema = $filter('date')(new Date(), 'dd/MM/yyyy');

                        angular.forEach(response.data.registros, function (registro, i) {

                            // si es ACT y fecVencimientoOperacion diferente de la actual no se muestra
                            var regla1 = false;
                            var regla2 = false;

                            if ((registro.valEstado && registro.fecVencimientoOperacionHomologado) || (registro.valEstado && registro.valAccionSiguiente)) {

                                if ((registro.valEstado == 'ACT' && registro.fecVencimientoOperacionHomologado == fechaSistema) || (registro.valEstado == 'VEN' && registro.valAccionSiguiente != 'XCREN')) {

                                    regla1 = true;

                                }

                            }

                            if (regla1 && registro) {

                                if (!(registro.valBloqueoLegal && (registro.valBloqueoLegal == 'S' || registro.valBloqueoLegal == 's')) &&
                                    !(registro.valBloqueoNovedades && (registro.valBloqueoNovedades == 'S' || registro.valBloqueoNovedades == 's')) &&
                                    !(registro.valProductoEnGarantia && (registro.valProductoEnGarantia == 'S' || registro.valProductoEnGarantia == 's')) &&
                                    !(registro.valTipoDeposito && registro.valTipoDeposito == 'CDAT')) {

                                  
                                    regla2 = true;
                                    

                                }

                                if (regla2) {

                                    // // validaciones para definir el Subestado
                                    // if (registro.valBloqueoLegal && (registro.valBloqueoLegal == 'S' || registro.valBloqueoLegal == 's')) {
                                    //
                                    //     registro.subEstado = 'EMBARGADO';
                                    //
                                    // } else if (registro.valBloqueoNovedades && (registro.valBloqueoNovedades == 'S' || registro.valBloqueoNovedades == 's')) {
                                    //
                                    //     registro.subEstado = 'BLOQUEADO ' + (registro.valDescCausalBloqueo ? registro.valDescCausalBloqueo : '');
                                    //
                                    // } else if (registro.valDescAccionSiguiente && registro.valDescAccionSiguiente == 'POR CANCELAR') {
                                    //
                                    //     registro.subEstado = 'INSTRUCCIÓN DE CANCELACIÓN';
                                    //
                                    // } else if (registro.valProductoEnGarantia && registro.valProductoEnGarantia == 'S') {
                                    //
                                    //     registro.subEstado = 'EN GARANTÍA';
                                    //
                                    // }
                                    if (registro.valEstado == 'ACT') {

                                        registro.subEstado = 'ACTIVO';

                                    } else if (registro.valEstado == 'VEN') {

                                        registro.subEstado = 'VENCIDO';

                                    } else {

                                        registro.subEstado = '';

                                    }
                                    $scope.cdts.push(registro); // Borrar en caso no deba permitir uno bloqueado o demas

                                }

                            }

                        });

                    }, function (response) {

                        if (response.status == 417) {

                            $dialog.open({
                                status: 'error',
                                content: response.headers("Respuesta") || "No fue posible consultar, por favor intente nuevamente"
                            });

                        }

                    });

                }

            };


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
                        codigoSolicitud: $filter('lov')('REINVERTIR-CDT', $rootScope.lov.lov_listas_restrictiva_operacion, 'desc', 'codigo'),
                        fechaNacimiento: titular.fechaNacimientoConstitucion || undefined,
                        genero: titular.genero || undefined,
                        nombre: titular.nombre,
                        valPaisNacimiento: titular.paisNacimientoConstitucion || undefined,
                        codTipo: titular.natural ? 'N' : 'J'
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

                }

            };


            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */
            var fechadenacimientoOConstitucionFormateada = (function () {

                if (CONFIG.persona == 'natural') {

                    return CLIENTE.Fechadenacimiento ? CLIENTE.Fechadenacimiento.split(' ')[0] : '';

                }

                return CLIENTE.DateFormed ? CLIENTE.DateFormed.split(' ')[0] : '';

            }());


            $scope.$api.checkListas({
                tipoIdentificacionTitular: CONFIG.idType,
                nroIdentificacionTitular: CONFIG.idNumber,
                fechaNacimientoConstitucion: fechadenacimientoOConstitucionFormateada ? $filter('date')(new Date(fechadenacimientoOConstitucionFormateada), 'yyyy-MM-ddT00:00:00') : '',
                natural: CONFIG.persona == 'natural',
                genero: CLIENTE.Sexo,
                nombre: CONFIG.persona == 'natural' ? CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido : CLIENTE.Name,
                paisNacimientoConstitucion: CONFIG.persona == 'natural' ? CLIENTE.PaisdeNacimiento : (CLIENTE.ConstitutionCity + "").slice(0, 3)
            }).then(function (response) {

                var data = response.data,
                    codigosVinculables = $rootScope.lov.lov_listas_restrictiva_permitir_codigo.map(function (obj) {

                        return obj.codigo;

                    });

                $scope.caption.listas.status = codigosVinculables.indexOf(data.codigoRespuesta) != -1 ? 'success' : 'error';
                $scope.caption.listas.content = data.mensajeRespuesta;
                $scope.caption.vinculable = codigosVinculables.indexOf(data.codigoRespuesta) != -1;

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

            // hace el llamado al servicio que llena la tabla de cdts

            $scope.$on('$viewContentLoading', function () {

                if ($state.current.name == 'app.cdt.reinversion') {

                    $scope.cdtSeleccionado = undefined;
                    nameSpace.cdtSeleccionado = undefined;
                    $scope.checks.tabla = '';
                    $state.$current.path[2].data.redirect = undefined;
                    $scope.$program.consultaCdtXEstado();

                }

            });

        }

    ]);

});
