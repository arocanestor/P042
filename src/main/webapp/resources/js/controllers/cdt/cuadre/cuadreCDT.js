/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('cuadreCDTCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        'CONFIG',
        '$timeout',
        '$slm-dialog',
        '$filter',
        '$state',
        'textos',
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
            textos,
            $utilities
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var CLIENTE = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT.CLIENTE : $rootScope.COMPANY.CLIENTE,
                // RESERVED NAMESPACE
                nameSpace = $rootScope.account[$rootScope.routeApp['3']];

            $scope.lovs = nameSpace.lovs;
            nameSpace.textos = textos;
            $scope.textos = nameSpace.textos;
            $scope.$config = CONFIG;
            $scope.cuadre = false;
            $scope.imprimirCuadre = false;
            nameSpace.cdtSeleccionado = {};
            $scope.consultaCuadre = [];
            $scope.checks = {
                tabla: ''
            };
            $scope.lovs.lov_cdt_jornada = [{
                codigo: "0",
                desc: "Normal"
            }, {
                codigo: "1",
                desc: "Adicional"
            }];

            $scope.captionService = {
                tipoCaption: 'attention',
                mensaje: 'No fue posible realizar la consulta, por favor intente nuevamente',
                estado: false
            };

            // captions
            $scope.caption = {
                info: '<ul><li>Recuerde que los títulos físicos reinvertidos, cancelados, fraccionados, fusionados y con instrucción de cancelación, se deben enviar en el movimiento de la oficina,</li><li>de lo contrario generará un faltante.</li></ul>'
            };
            $scope.$program = {};
            $scope.$program.printFlag = false;

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {

                // model: {
                //
                //     formPdf: false
                //
                // },

                consultarCuadre: function (consulta) {

                    $scope.$api.consultaCuadreCDTOficina(consulta).then(function (resp) {

                        if (resp.data) {

                            if (resp.data.caracterAceptacion === 'B' && resp.data.codMsgRespuesta == '0') {

                                var validadorData = resp.data.registros ? (resp.data.registros.length != 0) : false;

                                if (validadorData) {

                                    $scope.consultaCuadre = resp.data.registros;
                                    $scope.cuadre = true;
                                    $scope.captionService.estado = false;
                                    $scope.captionService.tipoCaption = 'attention';
                                    $scope.captionService.mensaje = '';

                                } else {

                                    $dialog.open({
                                        status: 'error',
                                        content: 'El cliente no posee registros'
                                    });
                                    $scope.consultaCuadre = [];
                                    $scope.cuadre = false;
                                    $scope.captionService.estado = true;
                                    $scope.captionService.tipoCaption = 'attention';
                                    $scope.captionService.mensaje = 'El cliente no posee registros';

                                }


                            }


                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>200</b><br>Intente Nuevamente'
                            });
                            $scope.consultaCuadre = [];
                            $scope.cuadre = false;
                            $scope.captionService.estado = true;
                            $scope.captionService.tipoCaption = 'error';
                            $scope.captionService.mensaje = 'No fue posible realizar la consulta';


                        }

                    }, function (resp) {

                        if (resp.status == 417) {

                            $dialog.open({
                                status: 'error',
                                content: resp.headers("Respuesta") || 'No fue posible realizar la consulta, por favor intente nuevamente'
                            });
                            $scope.consultaCuadre = [];
                            $scope.cuadre = false;
                            $scope.captionService.estado = true;
                            $scope.captionService.tipoCaption = 'error';
                            $scope.captionService.mensaje = 'No fue posible realizar la consulta';


                        } else {

                            $dialog.open({
                                status: 'error',
                                content: 'Error código: <b>' + resp.status + '</b><br>Intente Nuevamente'
                            });
                            $scope.consultaCuadre = [];
                            $scope.cuadre = false;
                            $scope.captionService.estado = true;
                            $scope.captionService.tipoCaption = 'error';
                            $scope.captionService.mensaje = 'No fue posible realizar la consulta';

                        }

                    });



                },

                imprimir: function (consultaCuadre) {

                    var cuadres = [];

                    $dialog.open({
                        type: 'confirm',
                        content: '¿Desea generar documento?',
                        accept: function () {

                            angular.forEach(consultaCuadre, function (obj) {

                                var datos = {};
                                datos.tipoTransaccion = obj.tipoTransaccion;
                                datos.valorTotal = $filter('currency')(obj.valorTotal);
                                datos.cantidad = obj.cantidad;

                                cuadres.push(datos);

                            });

                            // var idReporte = R_CSLTA_CUADRE;

                            $scope.$api.datosPdf(cuadres);
                            // $scope.$gui.model.formPdf = true;
                            $scope.$program.printFlag = true;

                        }
                    });

                }
            };


            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$program = {

                // formCallback: function () {
                //
                //     $scope.$gui.model.formPdf = false;
                //
                // }
            };


            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                consultaCuadreCDTOficina: function (params) {

                    return $api.consultaCdt.consultaCuadreCDTOficina({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficina,
                        fechaConsulta: $filter('date')($filter('davDates')(params.fechaCuadre, 'ddMMyyyy'), 'yyyy-MM-ddT00:00:00'),
                        codJornadaConsulta: params.jornada,
                        codOficina: CONFIG.hostOficina || CONFIG.oficina.slice(-4)
                    });

                },

                datosPdf: function (params) {

                    $scope.$program.data = {
                        fechaConsulta: $scope.consulta.fechaCuadre,
                        jornadaConsulta: $filter('lov')($scope.consulta.jornada, $scope.lovs.lov_cdt_jornada),
                        registros: params
                    };

                }

            };


            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

        }
    ]);

});
