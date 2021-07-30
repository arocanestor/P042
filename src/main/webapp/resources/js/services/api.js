define(['angularAMD'], function ($ngAMD) {

    'use strict';
    $ngAMD.service('$api', [
        '$http',
        '$q',
        '$soap',
        '$rootScope',
        function (
            $http,
            $q,
            $soap,
            $rootScope
        ) {

            var api = {
                autenticacion: {},
                parametros: {},
                novedadescuentas: {},
                novedades: {},
                cautela: {},
                cuentas: {},
                compartida: {},
                siebel: {},
                pdf: {},
                evaluador: {},
                administrador: {},
                reportes: {},
                productos: {},
                pymes: {},
                extractos: {}
            };

            api.novedadescuentas.consultarAsociacionAFondosCuentas = function (data) {
                return $http({
                    url: 'api/novedades/consultarAsociacionAFondosCuentasV1',
                    method: 'POST',
                    pushAction: {
                        name: 'consultarAsociacionAFondosCuentas'
                    },
                    data: data
                });
            };

            api.novedadescuentas.daviplusYSolidezModificacionDeCuentas = function (data) {
                return $http({
                    url: 'api/novedades/daviplusYSolidezModificacionDeCuentas',
                    method: 'POST',
                    pushAction: {
                        name: 'daviplusYSolidezModificacionDeCuentas'
                    },
                    data: data
                });
            };

            api.novedadescuentas.consultaProgramacionRetirosFondos = function (data) {
                return $http({
                    url: 'api/novedades/consultaProgramacionRetirosFondos',
                    method: 'POST',
                    pushAction: {
                        name: 'consultaProgramacionRetirosFondos'
                    },
                    data: data
                });
            };

            api.novedadescuentas.eliminarProgramacionRetiroFondos = function (data) {
                return $http({
                    url: 'api/novedades/eliminarProgramacionRetiroFondos',
                    method: 'POST',
                    pushAction: {
                        name: 'eliminarProgramacionRetiroFondos'
                    },
                    data: data
                });
            };

            api.novedadescuentas.programacionAportesRetiros = function (data) {
                return $http({
                    url: 'api/novedades/programacionAportesRetiros',
                    method: 'POST',
                    pushAction: {
                        name: 'programacionAportesRetiros'
                    },
                    data: data
                });
            };

            //////////////////////////////////////////////////////////////////////////
            api.autenticacion.consultaCliente = function (data) {

                return $http({
                    url: 'api/autenticacion/consultaCliente',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'consultaCliente'
                    }
                });

            };

            api.novedades.gmf = function (data) {

                return $http({
                    url: 'api/novedades/novedadesGMF',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'novedadesGMF'
                    }
                });

            };

            api.cautela.listas = function (data) {

                return $http({
                    url: 'api/cautela/listaCautela',
                    method: 'POST',
                    pushAction: {
                        name: 'listaCautela'
                    },
                    cache: true,
                    data: data
                });

            };

            api.cautela.listasRestrictivas = function (data) {

                return $http({
                    url: 'api/cautela/consultaListasRestrictivas',
                    method: 'POST',
                    pushAction: {
                        name: 'listasRestrictivas'
                    },
                    data: data
                });

            };

            api.cuentas.aperturaAhorros = function (data) {

                return $http({
                    url: 'api/compartidos/aperturaCuentaAhorros',
                    method: 'POST',
                    pushAction: {
                        name: 'aperturaCuentaAhorros'
                    },
                    data: data
                });

            };

            api.compartida.generacionDoc = function (data) {

                return $http({
                    url: 'api/compartidos/generacionDocumentos',
                    method: 'POST',
                    pushAction: {
                        name: 'generacionDocumentos'
                    },
                    data: data
                });

            };

            api.compartida.validacionesPrevias = function (data) {

                return $http({
                    url: 'api/compartidos/validacionesPrevias',
                    method: 'POST',
                    pushAction: {
                        name: 'validacionesPrevias'
                    },
                    data: data
                });

            };

            api.pdf.getAutorizacionCentrales = function (params) {

                return $http({
                    url: 'api/reportes/getAutorizacionCentrales',
                    method: 'GET',
                    pushAction: {
                        name: 'getAutorizacionCentrales'
                    },
                    params: params
                });

            };

            api.pdf.guardarTraza = function (data) {

                return $http({
                    url: 'api/reportes/guardarTraza',
                    method: 'POST',
                    pushAction: {
                        name: 'guardarTraza'
                    },
                    data: data
                });

            };

            api.reportes.datosReporte = function (data) {

                return $http({
                    url: 'api/reportes/datosReporte',
                    method: 'POST',
                    data: data,
                    pushAction: { // ............................. Se utiliza para trazar cada peticion en Siebel (Solo para transacciones en linea)
                        name: 'datosReporte' // ......... REQUIRED: Se utiliza el nombre del servicio
                    }
                });

            };

            api.reportes.fileNet = function (data) {

                return $http({
                    url: 'api/reportes/fileNet',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'fileNet'
                    }
                });

            };

            api.reportes.linkQueryFileNet = function (data) {

                return $http({
                    url: 'api/reportes/linkQueryFileNet',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'linkQueryFileNet'
                    }
                });

            };

            api.reportes.consultaDocsFileNet = function (data) {

                return $http({
                    url: 'api/reportes/cosultaDocsFileNet',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'consultaDocsFileNet'
                    }
                });

            };

            api.reportes.guardaPdf = function (data) {

                return $http({
                    url: 'api/reportes/guardaPdf',
                    method: 'POST',
                    data: data,
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8'
                    },
                    pushAction: {
                        name: 'guardaPdf'
                    }
                });

            };

            api.reportes.obtienePdf = function (data) {

                return $http({
                    url: 'api/reportes/obtienePdf/' + data,
                    method: 'GET',
                    pushAction: {
                        name: 'obtienePdf'
                    }
                });

            };

            api.siebel.getCliente = function (params) {

                return $http({
                    url: 'api/siebelsp/consultaPersonaNatural',
                    method: 'GET',
                    pushAction: {
                        name: 'consultaPersonaNatural'
                    },
                    cache: true,
                    params: params
                });

            };

            api.siebel.getCompany = function (params) {

                return $http({
                    url: 'api/siebelsp/consultaPersonaJuridica',
                    method: 'GET',
                    pushAction: {
                        name: 'consultaPersonaJuridica'
                    },
                    cache: true,
                    params: params
                });

            };

            api.evaluador.evaluadorLight = function (data) {

                $rootScope.thirdXHRs = $rootScope.thirdXHRs || [];
                $rootScope.thirdXHRs.push('evaluador');

                return $soap.post('/evaluadorLight/services/evaluacionWS', 'solicitarEvaluacionLight', data).finally(function () {

                    $rootScope.thirdXHRs.pop();

                });

            };

            api.compartida.crearPagare = function (data) {

                return $http({
                    url: 'api/compartidos/crearPagare',
                    method: 'POST',
                    pushAction: {
                        name: 'crearPagare'
                    },
                    data: data
                });

            };

            api.compartida.asignarMedio = function (data) {

                return $http({
                    url: 'api/compartidos/asignarMedio',
                    method: 'POST',
                    pushAction: {
                        name: 'asignarMedio'
                    },
                    data: data
                });

            };

            api.compartida.generacionDocDesembolso = function (data) {

                return $http({
                    url: 'api/compartidos/generarDocsDesembolso',
                    method: 'POST',
                    pushAction: {
                        name: 'generacionDocDesembolso'
                    },
                    data: data
                });

            };

            api.administrador.reportesWebapplets = function (data) {

                return $http({
                    url: 'api/administrador/reportesWebapplets?idWebapplet=R001',
                    method: 'POST',
                    data: data
                });

            };

            api.administrador.consultaBancos = function () {

                return $http({
                    url: 'api/administrador/consultaBancos',
                    method: 'POST'
                });

            };

            api.reportes.textosReporte = function (data) {

                return $http({
                    url: 'api/reportes/textosReporte',
                    method: 'POST',
                    data: data,
                    cache: true
                });

            };

            api.productos.consultarProductos = function (data) {

                return $http({
                    url: 'api/productos/consultarProductos',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'consultarProductos'
                    }
                });

            };

            api.pymes.enviarNotificacionesMail = function (data) {

                return $http({
                    url: 'api/pymes/enviarNotificacionesMail',
                    method: 'POST',
                    data: data,
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8'
                    },
                    pushAction: {
                        name: 'enviarNotificacionesMail'
                    }
                });

            };

            api.extractos.extractosDisponibles = function (data) {

                return $http({
                    url: 'api/extractos/extractosDisponibles',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'extractosDisponibles'
                    }
                });

            };

            api.extractos.enviarExtractosMail = function (data) {

                return $http({
                    url: 'api/extractos/enviarExtractosMail',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'enviarExtractosMail'
                    }
                });

            };

            api.administrador.consultarFuncionalidadesXUsuario = function (data) {

                return $http({
                    url: 'api/administrador/consultarFuncionalidadesXUsuario',
                    method: 'POST',
                    data: data,
                    pushAction: {
                        name: 'consultarFuncionalidadesXUsuario'
                    }
                });

            };

            return api;

        }
    ]);

});
