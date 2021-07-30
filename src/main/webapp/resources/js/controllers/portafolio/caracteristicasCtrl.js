define(['../../app'], function (app) {

    'use strict';
    app.controller('caracterCtrl', [
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
        '$spaUtils',
        function (
            $scope,
            $rootScope,
            $api,
            $dialog,
            CONFIG,
            $filter,
            $state,
            $utilities,
            lovs,
            textos,
            $spaUtils
        ) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            // RESERVED NAMESPACE

            $scope.hoy = new Date();

            var nameSpace = $rootScope.account[$rootScope.routeApp['5']],
                CLIENTE = $rootScope.CLIENT.CLIENTE,
                CLIENTE_ALL = $rootScope.CLIENT,
                tiposIdentificacion = $filter('filter')($rootScope.lov.lov_tipo_id_venta_linea, {
                    codigo: 1
                })[0] || {};

            $scope.config = CONFIG;

            $scope.title = 'Tarjeta de Crédito Móvil';
            $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            $scope.form = {};
            $scope.datosBasicos = {};
            $scope.actividad = {};
            $scope.ubicacion = {};
            $scope.producto = {
                centrales: ''
            };

            $scope.listaactividad = lovs.lov_actividad_laboral_express;
            $scope.listaTarjetas = lovs.lov_tarjetas_express;
            $scope.listaCiiu = lovs.lov_siebel_codigo_ciiu;
            nameSpace.textos = textos;
            $scope.textos = nameSpace.textos;
            nameSpace.lovs = lovs; // guardamos listas en nameSpace
            nameSpace.lovs.lov_msg_venta_xpress_obj = $utilities.arr2Obj(lovs.lov_msg_venta_xpress, 'codigo');
            $scope.lov_msg = nameSpace.lovs.lov_msg_venta_xpress_obj;
            // ////////////////////////////// CAPTIONS

            $scope.caracteristicas = $scope.lov_msg['info-carcateristicas'].desc;


            // captions
            $scope.caption = {
                informacion: $scope.lov_msg['recuerde-actualizar'].desc,
                listas: {
                    status: '',
                    content: ''
                }
            };


            $scope.producto.ProductoSolicitado = '01';
            // $scope.producto.centrales = '';


            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {};



            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */
            $scope.$program = {};

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
                        oficinaTotal: CONFIG.oficinaTotal
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
 		     | INIT
 		     -------------------------------------------------------------------------------------------- */

            // ////////////////////////////// VALIDACION CASB
            if ($spaUtils.compareBiometric(5) && !$rootScope.autenticacion.cLETEMPLATE) {

                $dialog.open({
                    status: 'attention',
                    content: "Cliente NO enrolado.<br>Realice proceso de autenticación biométrica <br /> (Escaneo de la cédula)"
                }).then(function () {

                    $state.go('app');

                });
                return;

            }

            // CONSULTA LISTAS RESTRICTIVAS (ESTE SERVICIO FUNCIONA AL REVES, 200 ES ERROR DE NEGOCIO)
            $scope.$api.checkListas().then(function (response) {

                $scope.caption.listas.status = 'error';
                $scope.caption.listas.content = response.data.registros[0].codigoMarcacionMensajeHomologado || response.data.registros[0].codigoListaHomolgado;

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

                            $state.go('app'); // volvemos al dashboard

                        }
                    });

                }

            });

        }
    ]);

});
