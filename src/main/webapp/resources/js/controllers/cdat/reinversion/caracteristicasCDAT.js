/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('caracteristicasReinvCDATCtrl', ['$scope', '$rootScope', '$api', 'CONFIG', '$timeout', '$slm-dialog', '$filter', '$state', 'lovs', 'textos', function ($scope, $rootScope, $api, CONFIG, $timeout, $dialog, $filter, $state, lovs, textos) {

        /* ------------------------------------------------------------------------------------------
         | SETUP
         -------------------------------------------------------------------------------------------- */

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

        $scope.lovs = lovs;
        $scope.continuar = false;

        var CLIENTE = $rootScope.CLIENT.CLIENTE,
            nameSpace = $rootScope.account[$rootScope.routeApp['2']] = {};

        $scope.title = 'Reinversión CDAT Virtual';
        $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;
        $scope.caracteristicas = 'Características CDAT Virtual';

        nameSpace.textos = textos;
        $scope.textos = nameSpace.textos;

        $scope.dialogs = {
            checkListas: 'Error al verificar al cliente en listas restrictivas. Intente mas tarde',
            checkCDaT: 'El cliente no presenta CDAT Virtual en fecha de vencimiento o días hábiles de gracia para su Reinversión'
        };

        // captions
        $scope.caption = {
            informacion: 'Si el cliente está de acuerdo, continúe.',
            listas: {
                status: '',
                content: ''
            },
            mensajeBloqueo: {
                status: '',
                content: ''
            }
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

                $scope.continuar = false;
                $scope.caption.listas.status = 'success';
                $scope.caption.listas.content = coincidencias[0].desc;

            } else {

                $scope.continuar = true;
                $scope.caption.listas.status = 'error';
                $scope.caption.listas.content = data.registros[0].codigoMarcacionMensajeHomologado || data.registros[0].codigoListaHomolgado;
                $scope.llamadoMensajeBloqueo = 1;
                $scope.caption.mensajeBloqueo.status = 'error';
                $scope.caption.mensajeBloqueo.content = 'Sólo se puede realizar la cancelación del CDAT';

            }

        }, function (response) {

            if (response.status === 417) {

                $scope.caption.listas.status = 'success';
                $scope.caption.listas.content = response.headers('Respuesta');
                $scope.continuar = false;

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

    }]);

});
