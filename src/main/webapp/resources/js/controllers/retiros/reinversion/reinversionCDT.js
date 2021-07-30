 /* global define, console*/
define(['../../../app'], function (app) {

    'use strict';
    app.controller('reinversionCDTCtrl', [
        '$scope',
        '$rootScope',
        'CONFIG',
        '$slm-dialog',
        '$filter',
        '$api',
        '$timeout',
        '$utilities',
        function (
            $scope,
            $rootScope,
            CONFIG,
            $dialog,
            $filter,
            $api,
            $timeout,
            $utilities
        ) {


            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */
            var PERSONA = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? $rootScope.CLIENT : $rootScope.COMPANY,
                CLIENTE = PERSONA.CLIENTE,
                nameSpace = $rootScope.account[$rootScope.routeApp['3']],
                arrCheque = {
                    numCheque: '',
                    numCuenta: '',
                    codBanco: '',
                    valorCheque: '',
                    remover: false // para que no aparezca el boton de eliminar en el primer cheque
                };

            // N si es natural o J si es juridica para hacer validaciones en el hotmail
            $scope.tipoCliente = CONFIG.persona == 'natural' || CONFIG.naturalConNegocio ? 'N' : 'J';
            $scope.codOficina = CONFIG.hostOficina;

            $scope.lovs = nameSpace.lovs;
            $scope.simulacion = nameSpace.simulacion;
            $scope.cheque = {};
            $scope.cheques = [arrCheque];
            $scope.reinversion = {};
            $scope.reinversion.checks = {};
            nameSpace.reinversion = {};
            $scope.form.Reinversion = {};
            $scope.lovs.lov_productos = [];

            // se precarga la opcion Cuenta Davivienda en los campos de Forma de pago
            $scope.reinversion.pagoDisminuyo = $filter('filter')($scope.lovs.lov_cdt_forma_pago_disminucion, {
                codigo: '1'
            })[0];
            $scope.reinversion.formaPago = $filter('filter')($scope.lovs.lov_cdt_forma_pago_intereses, {
                codigo: '1'
            })[0];

            $scope.caption = {
                confirmApertura: '<ul gui="list">' +
                    '   <li> Para pasar a la confirmación de la reinversión, continúe </li>' +
                    '   <li> Haga click en Regresar para volver al paso anterior</li>' +
                    '</ul>',
                confirmAperturaConCapital: '<ul gui="list">' +
                    '   <li> CDT con capitalización de intereses al final del periodo, no se permite cambiar forma de pago de intereses</li>' +
                    '   <li> Para pasar a la confirmación de la reinversión, continúe </li>' +
                    '   <li> Haga click en Regresar para volver al paso anterior</li>' +
                    '</ul>',
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
                fechaMayor: 'Recuerde, ACTUALIZAR LOS DATOS DEL CLIENTE, al finalizar la apertura',
                sinFecha: 'Para continuar, VINCULE EL CLIENTE AL BANCO'
            };


            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.guardarInfo = function () {

                nameSpace.reinversion = $scope.reinversion;
                nameSpace.cheques = $scope.cheques;

            };

            $scope.$gui = {

                actualizarValorCheque: function (cheques) {

                    var cont = 0;

                    // contador para saber cuantos chekbox estan seleccionados
                    angular.forEach($scope.reinversion.checks, function (value, i) {

                        cont += (value == true) ? value : 0;

                    });

                    $scope.contadorChecks = cont;

                },

                removeTitular: function (index, array) {

                    $dialog.open({
                        type: 'confirm',
                        content: '¿Desea quitar este elemento?',
                        accept: function () {

                            array.splice(index, 1);

                        }
                    });

                },

                agregarCheque: function () {

                    $scope.cheques.push({
                        numCheque: '',
                        numCuenta: '',
                        codBanco: '',
                        valorCheque: ''
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$program = {

                lovCuentas: function () {

                    var arr = CONFIG.objPersona.listOfDavFincorpaccountBc ? CONFIG.objPersona.listOfDavFincorpaccountBc.davFincorpaccountBc : CONFIG.objPersona.listOfFincorpAccount.fincorpAccount,
                        cuentas = [];

                    angular.forEach(arr, function (value, i) {

                        var rechazoDebito = $filter('filter')($scope.lovs.lov_cdt_rechazo_cuentas, {
                                codigo: value.davSubproductCode
                            }, true)[0],
                            tipManejo = $filter('filter')($scope.lovs.lov_cdt_rechazo_tipo_manejo, {
                                codigo: value.davManagementType
                            }, true)[0];

                        if (!rechazoDebito && !tipManejo && (value.davEffectiveProduct === 'VIGENTE' || value.davEffectiveProduct === '01')) {

                            if (value.davProductPartNumber == 'P006') {

                                cuentas.push({
                                    value: value.accountNumber3,
                                    label: 'Cuenta Davivienda - Ahorros ' + value.accountNumber3.slice(-4),
                                    tipo: 'AHO'
                                });

                            } else if (value.davProductPartNumber == 'P007') {

                                cuentas.push({
                                    value: value.accountNumber3,
                                    label: 'Cuenta Davivienda - Corriente ' + value.accountNumber3.slice(-4),
                                    tipo: 'CTE'
                                });

                            }

                        }

                    });

                    $scope.lovs.lov_productos = cuentas;

                },

                calcularSumatoria: function (valInversionEfectivo, valDebito, cheques) {

                    var sumatoria = 0;
                    var sumaValCheques = 0;

                    angular.forEach(cheques, function (value, i) {

                        var valorCheque = value.valorCheque;
                        sumaValCheques += Number(valorCheque);

                    });

                    if ($scope.contadorChecks == 1 && $scope.reinversion.checks.efectivoCheck) {

                        valInversionEfectivo = $scope.simulacion.diferenciaValores;
                        $scope.reinversion.valorEfectivo = $scope.simulacion.diferenciaValores;

                    } else {

                        valInversionEfectivo = valInversionEfectivo ? valInversionEfectivo : 0;

                    }

                    if ($scope.contadorChecks == 1 && $scope.reinversion.checks.cuentaCheck) {

                        valDebito = $scope.simulacion.diferenciaValores;
                        $scope.reinversion.valorDebito = $scope.simulacion.diferenciaValores;

                    } else {

                        valDebito = valDebito ? valDebito : 0;

                    }


                    sumaValCheques = sumaValCheques ? sumaValCheques : 0;

                    // SUMA DE LOS CAMPOS DE MONTOS
                    sumatoria += Number(valInversionEfectivo) + Number(valDebito) + Number(sumaValCheques);

                    $scope.reinversion.totalRecepcion = sumatoria;

                    return sumatoria;

                }

            };

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {};

            /* ------------------------------------------------------------------------------------------
             | INIT
             -------------------------------------------------------------------------------------------- */

            // diferencia entre el valor a reinvertir y el valor de inversion actualizacion
            $scope.simulacion.diferenciaValores = Number($scope.simulacion.valorReinversion) - Number($scope.simulacion.valorInversion);
            $scope.simulacion.diferenciaValoresAbsoluto = Math.abs($scope.simulacion.diferenciaValores);

            $scope.$program.lovCuentas();


        }
    ]);

});
