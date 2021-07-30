 /* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('caracteristicasCDATCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        'CONFIG',
        '$timeout',
        '$slm-dialog',
        '$filter',
        '$state',
        'lovs',
        'textos',
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
            lovs,
            textos,
            $spaUtils
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var CLIENTE = $rootScope.CLIENT.CLIENTE,
                // RESERVED NAMESPACE
                nameSpace = $rootScope.account[$rootScope.routeApp['2']] = {};


            // ////////////////////////////// VALIDACION PERSONA
            if (CONFIG.persona !== 'natural' && !CONFIG.naturalConNegocio) {

                $dialog.open({
                    status: 'error',
                    content: 'Transacción aplica únicamente para personas Naturales',
                    accept: function () {

                        $state.go('^');

                    }
                });
                return;

            }

            // ////////////////////////////// VALIDACION CASB
            if ($spaUtils.compareBiometric(2) && !$rootScope.autenticacion.cLETEMPLATE) {

                $dialog.open({
                    status: 'attention',
                    content: "Cliente NO enrolado.<br>Realice proceso de autenticación biométrica <br /> (Escaneo de la cédula)"
                }).then(function () {

                    $state.go('^');

                });
                return;

            }

            $scope.title = 'Apertura CDAT Virtual';
            $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;
            $scope.caracteristicas = 'Informe al cliente las características del producto CDAT Virtual';

            $scope.lovs = lovs;
            nameSpace.textos = textos;
            $scope.textos = nameSpace.textos;

            // captions
            $scope.caption = {
                informacion: 'Si el cliente está de acuerdo, continúe.',
                listas: {
                    status: '',
                    content: ''
                }
            };

            $scope.dialogs = {
                checkListas: 'Error al verificar al cliente en listas restrictivas. Intente mas tarde'
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */



            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */



            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

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

                }

            };


            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            $scope.$api.checkListas().then(function (response) {

                var data = response.data,
                    coincidencias = $filter('filter')($scope.lovs.lov_listas_cuenta_digital, {
                        codigo: data.registros[0].codigoMarcacion
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


        }
    ]);

});
