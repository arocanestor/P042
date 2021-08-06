/* global define, console*/
define(['../../app'], function (app) {

    'use strict';
    app.controller('mainRetirosCtrl', [
        '$scope',
        'servicioNumCDT',
        '$rootScope',
        'CONFIG',
        '$slm-dialog',
        '$filter',
        '$api',
        '$timeout',
        '$utilities',
        'EXTRAS',
        'lovs',
        function (
            $scope,
            servicioNumCDT,
            $rootScope,
            CONFIG,
            $dialog,
            $filter,
            $api,
            $timeout,
            $utilities,
            EXTRAS,
            lovs
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,
                nameSpace = $rootScope.account[$rootScope.routeApp['3']];

            $scope.numProdDafaturo = CONFIG.numeroProducto;
            $scope.lovs = lovs;
            $scope.retiros = [];
            $scope.productoSeleccionado =
            {

            }

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$gui = {

                eliminarProgramacionRetiroFondos: function () {

                    $dialog.open({
                        type: 'confirm',
                        content: '¿Está seguro de eliminar la programación?',
                        accept: function () {
                            $scope.$gui.aplicarNovedad()

                            /*$scope.$api.eliminarProgramacionRetiroFondos().then(response => {

                            }, response => {

                                $dialog.open({
                                    status: 'error',
                                    content: response.headers("Respuesta") || 'No fue posible realizar la acción, por favor intente nuevamente'
                                });

                            });*/

                        },
                        cancel: function () { }
                    });
                },
                
                aplicarNovedad: function () {


                    $scope.$gui.datosPdf = $scope.$program.datosPdf();
                    $scope.$gui.assistant = true;


                },


            };
            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$program = {
                actualizarNovedad: function (done) {
                    $api.reportes.guardaPdf($rootScope.$ada.datosReporte).then(function (response) {

                    }, function (response) {
                        $dialog.open({
                            status: "error",
                            content:
                                response.headers("Respuesta") || "Error Inesperado"
                        });
                    })

                },

                datosPdf: function () { // se aplican los datos del PDF

                    return {
                        oficina: "0004",
                        usuario: "HCUSBA",
                        detalle: {
                            numeroDeProducto: "0237541",
                            programacionDeRetiro: "23/05/2021",
                            valorProgramado: "CFR 45 5DS",
                            fechaDepagoDelRetInt: "U47RYH8EF32"
                        }
                    }


                },
                cancelNovedad: function () {

                    $scope.productoSeleccionado.esExcenta = !$scope.productoSeleccionado.esExcenta; // Revertimos el check en caso que se cancele la operacion

                }
            };
            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$api = {
                consultaProgramacionRetirosFondos: function () {
                    return $api.novedades.consultaProgramacionRetirosFondos(
                        {
                            rowId: CONFIG.rowId,
                            usuario: CONFIG.usuario,
                            oficinaTotal: CONFIG.oficina,
                            numeroProducto: CONFIG.numeroProducto,
                            numeroIdentificacion: CONFIG.idNumber,
                            tipoIdentificacion: CONFIG.idType
                        }
                    );
                },
                eliminarProgramacionRetiroFondos: function () {
                    return $api.novedades.eliminarProgramacionRetiroFondos({
                        rowId: "1",
                        usuario: "Siebel",
                        oficinaTotal: 1,
                        valNumeroProducto: "",
                        valMedioPago: 0,
                        valCuentaRetiros: 787878787,
                        valProgramado: 0,
                        valTipoCuentaRetiro: 0,
                        fecPagoRetiro: "2021-05-07",
                        valPeriodicidad: 0,
                        valIndicadorClave: "",
                        valSegundaClave: "",
                        valFilaMatriz: "",
                        valColumnaMatriz: "",
                        valTipoNovedad: 0,
                        valEntidadRetiro: "",
                        valConsecutivo: "",
                        valNumeroProductoDestino: "",
                        valTipoProductoDestino: 0,
                        valFilosofiaRetiro: 787878787
                    })
                }

            };
            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */
            $scope.$api.consultaProgramacionRetirosFondos().then(function (response) {
                var data = response.data;
                if (data) {
                    $scope.retiros = data.retiroFondos;

                    angular.forEach($scope.lovs.lov_fondos_tipo_novedad_programacion, function (tipoNovedad) {

                        angular.forEach($scope.retiros, function (retiro) {

                            if (retiro.tipoNovedad == tipoNovedad.codigo) {
                                cuenta.tipoNovedad = tipoNovedad.desc;
                            }

                        });

                    });
                }


            }, function (response) {

                if (response.status == 417) {
                    $dialog.open({
                        status: 'error',
                        content: response.headers('Respuesta')
                    });

                } else {

                    $dialog.open({
                        status: 'error',
                        content: 'Ha ocurrido un error inesperado'

                    });

                }
            });
        }
    ]);

});
