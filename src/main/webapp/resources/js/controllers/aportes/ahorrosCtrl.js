define(['../../app'], function (app) {

    'use strict';
    app.controller('ahorrosCtrl', [
        '$scope',
        '$rootScope',
        '$api',
        '$slm-dialog',
        'CONFIG',
        '$filter',
        '$state',
        '$utilities',
        'lovs',
        'textos',
        function ($scope, $rootScope, $api, $dialog, CONFIG, $filter, $state, $utilities, lovs, textos) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            // RESERVED NAMESPACE
            var nameSpace = $rootScope.account[$rootScope.routeApp['1']] = {},
                CLIENTE = $rootScope.CLIENT ? $rootScope.CLIENT.CLIENTE : {},
                emailCliente = ($filter('filter')($rootScope.CLIENT.EMAILS || [], {
                    DAV_PrincipalEmail: 'Y'
                })[0] || {
                    Email: ''
                }).Email,
                tiposIdentificacion = $filter('filter')($rootScope.lov.lov_tipo_id_venta_linea, {
                    codigo: 1
                })[0] || {};

            $scope.config = CONFIG;
            nameSpace.title = $rootScope.lov.lov_productos_venta_en_linea_obj['1'].desc;
            nameSpace.checks = {};
            nameSpace.textos = textos;

            $scope.textos = nameSpace.textos;

            // ////////////////////////////// LOVS
            nameSpace.lovs = lovs;
            nameSpace.lovs.lov_msg_venta_cuenta_obj = $utilities.arr2Obj(nameSpace.lovs.lov_msg_venta_cuenta, 'codigo');
            $scope.lovs = lovs;

            var lov_msg = nameSpace.lovs.lov_msg_venta_cuenta_obj;

            // ////////////////////////////// DIALOG MESSAGES
            $scope.dialogs = {
                checkListas: lov_msg.checkListas.desc,
                validacionPersona: lov_msg.validacionPersona.desc,
                validacionCliente: lov_msg.validacionCliente.desc,
                validacionEdad: lov_msg.validacionEdad.desc,
                validacionTipoIdentificacion: lov_msg.validacionTipoIdentificacion.desc,
                validacionCamposSiebel: lov_msg.validacionCamposSiebel.desc,
                validacionCasb: lov_msg.validacionCasb.desc
            };

            // ////////////////////////////// VALIDACION PERSONA
            if (CONFIG.persona !== 'natural' && !CONFIG.naturalConNegocio) {

                $dialog.open({
                    status: 'error',
                    content: $scope.dialogs.validacionPersona,
                    accept: function () {

                        $state.go('^');

                    }
                });
                return;

            }

            // ////////////////////////////// VALIDACION CASB
            if (!$rootScope.autenticacion.cLETEMPLATE) {

                $dialog.open({
                    status: 'attention',
                    content: $scope.dialogs.validacionCasb
                }).then(function () {

                    $state.go('^');

                });
                return;

            }

            // ////////////////////////////// VALIDACION CAMPOS SIEBEL
            if (!CLIENTE.Sexo || !emailCliente || !CLIENTE.Fechadenacimiento) {

                var sexo = !CLIENTE.Sexo ? '<li>Sexo del cliente</li>' : '',
                    email = !emailCliente ? '<li>Email del cliente</li>' : '',
                    fechaNacimiento = !CLIENTE.Fechadenacimiento ? '<li>Fecha de nacimiento del cliente</li>' : '';

                $dialog.open({
                    status: 'attention',
                    content: $scope.dialogs.validacionCamposSiebel + '<br><ul gui="list">' + sexo + email + fechaNacimiento + '</ul>',
                    accept: function () {

                        $state.go('^');

                    }
                });
                return;

            }

            // ////////////////////////////// VALIDACION TIPO IDENTIFICACION
            if (tiposIdentificacion.desc.split(';').indexOf(CONFIG.idType) === -1) {

                $dialog.open({
                    status: 'error',
                    content: $scope.dialogs.validacionTipoIdentificacion,
                    accept: function () {

                        $state.go('^');

                    }
                });
                return;

            }

            // ////////////////////////////// VALIDACION MAYOR DE EDAD
            if ((new Date(new Date() - new Date(CLIENTE.Fechadenacimiento)).getFullYear() - 1970) < 18) {

                $dialog.open({
                    status: 'error',
                    content: $scope.dialogs.validacionEdad,
                    accept: function () {

                        $state.go('^');

                    }
                });
                return;

            }

            $scope.title = 'Apertura ' + nameSpace.title;
            $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            $scope.form = {};

            // ////////////////////////////// CAPTIONS
            $scope.caption = {
                listas: {
                    status: '',
                    content: ''
                }
            };

            $scope.hoy = new Date();

            // ////////////////////////////// VALIDATE CHECKS
            $scope.validateChecks = {
                '4x1000': false,
                'aceptacion-contrato': true,
                'certifica-objetivo': true,
                'autoriza-huella': true
            };

            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {};

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                // ////////////////////////////// CHECK LISTAS RESTRICTIVAS
                checkListas: function () {

                    return $api.cautela.listas({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        perfil: CONFIG.perfil,
                        tipoIdentificacionTitular: CONFIG.idType,
                        nroIdentificacionTitular: CONFIG.idNumber,
                        oficinaTotal: CONFIG.oficinaTotal
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
 		     | INIT
 		     -------------------------------------------------------------------------------------------- */

            // ////////////////////////////// CONSULTA LISTAS RESTRICTIVAS (ESTE SERVICIO FUNCIONA AL REVES, 200 ES ERROR DE NEGOCIO)
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
