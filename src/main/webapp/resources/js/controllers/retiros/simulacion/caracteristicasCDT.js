/* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('caracteristicasCDTCtrl', [
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

            $scope.title = 'CDT';
            $scope.codOficina = CONFIG.hostOficina;
            if (CONFIG.persona == 'natural' || CONFIG.naturalConNegocio) {

                $scope.icon = 'fa-user-circle';
                $scope.extract = CLIENTE.Nombres + ' ' + CLIENTE.PrimerApellido + ' ' + CLIENTE.SegundoApellido;

            } else {

                $scope.icon = 'fa-building';
                $scope.extract = CLIENTE.Name;

            }

            $scope.lovs = nameSpace.lovs;
            nameSpace.textos = textos;
            $scope.textos = nameSpace.textos;

            // captions
            $scope.caption = {
                informacion: 'Si el cliente está de acuerdo con las características, <br>continúe',
                listas: {
                    status: '',
                    content: ''
                },
                confirmacionNic: {
                    status: '',
                    content: ''
                }
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



            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */



            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                // CHECK LISTAS RESTRICTIVAS
                checkListas: function (titular) {

                    return $api.cautela.listasRestrictivas({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        tipoIdentificacionTitular: titular.tipoIdentificacionTitular,
                        nroIdentificacionTitular: titular.nroIdentificacionTitular,
                        codigoSolicitud: $filter('lov')('ABRIR-CDT', $rootScope.lov.lov_listas_restrictiva_operacion, 'desc', 'codigo'),
                        fechaNacimiento: titular.fechaNacimientoConstitucion || undefined,
                        genero: titular.genero || undefined,
                        nombre: titular.nombre,
                        valPaisNacimiento: titular.paisNacimientoConstitucion || undefined,
                        codTipo: titular.natural ? 'N' : 'J'
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
                    content: response.data,
                    accept: function () {

                        // $state.go('^'); // volvemos al dashboard

                    }
                });

            });

            // validar la fecha de actualizacion de datos del CLIENTE
            var fechaSistema = $filter('date')(new Date(), 'yyyy/MM/dd'),
                fechaActualizacion = CONFIG.persona === 'natural' || CONFIG.naturalConNegocio ? CLIENTE.ClientDataUpdateDate : CLIENTE.CustomerUpdateData,
                metodoAut = CONFIG.persona === 'natural' || CONFIG.naturalConNegocio ? CLIENTE.MetodoAutCodeQuote : CLIENTE.MetodoAutCod;

            if (fechaActualizacion) {

                var fechaSistemaFormato = new Date(fechaSistema.slice(0, 4) + ',' + fechaSistema.slice(5, 7) + ',' + fechaSistema.slice(8, 11)).getTime(),
                    fechaActualizacionFormato = new Date(fechaActualizacion.slice(0, 4) + ',' + fechaActualizacion.slice(5, 7) + ',' + fechaActualizacion.slice(8, 11)).getTime(),
                    difFechas = fechaSistemaFormato - fechaActualizacionFormato,
                    dias = Math.floor(difFechas / (1000 * 60 * 60 * 24)),
                    autorizacion = $filter('filter')(nameSpace.lovs.lov_cdt_autenticacion_alterna, {
                        codigo: metodoAut
                    })[0] || '',
                    medotoAutenticacion = CONFIG.persona === 'natural' || CONFIG.naturalConNegocio ? CLIENTE.MetodoAutenticacion.toUpperCase() : CLIENTE.MetBiometrico.toUpperCase();

                if (dias > '365') {

                    if (medotoAutenticacion !== 'ALTERNO' || !autorizacion) {

                        $scope.caption.confirmacionNic.status = 'error';
                        $scope.caption.confirmacionNic.content = $scope.dialogs.fechaMayor;

                    } else {

                        $scope.caption.confirmacionNic.status = dias > '365' ? 'attention' : 'success';
                        $scope.caption.confirmacionNic.content = dias > '365' ? $scope.dialogs.fechaMayor : $scope.dialogs.fechaMenor;

                    }

                } else {

                    $scope.caption.confirmacionNic.status = 'success';
                    $scope.caption.confirmacionNic.content = $scope.dialogs.fechaMenor;

                }

            } else {

                $scope.caption.confirmacionNic.status = 'error';
                $scope.caption.confirmacionNic.content = $scope.dialogs.sinFecha;

            }

        }
    ]);

});
