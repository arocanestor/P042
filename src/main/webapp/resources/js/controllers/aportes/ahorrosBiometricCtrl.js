
define(['../../app'], function (app) {

    'use strict';
    app.controller('ahorrosCtrlBiometric', [
        '$scope',
        '$rootScope',
        '$slm-dialog',
        '$api',
        '$filter',
        '$state',
        'CONFIG',
        '$spaUtils',
        'actualizaSiebel',
        function ($scope, $rootScope, $dialog, $api, $filter, $state, CONFIG, $spaUtils, $siebel) {

            /* ------------------------------------------------------------------------------------------
             | SETUP
             -------------------------------------------------------------------------------------------- */

            // RESERVED NAMESPACE
            var nameSpace = $rootScope.account[$rootScope.routeApp['1']],
                lov_msg = nameSpace.lovs.lov_msg_venta_cuenta_obj,
                checks = nameSpace.checks;

            $scope.lov_msg = lov_msg;
            $scope.checks = checks;

            $scope.result = {
                account: '',
                captions: {
                    account: {},
                    gmf: {},
                    docs: {}
                },
                stamp: ''
            };

            // captions
            $scope.caption = {
                informeEnvioContrato: lov_msg.informeEnvioContrato.desc
            };

            // huella capturada
            $scope.biometricData = {};


            /* ------------------------------------------------------------------------------------------
             | GUI FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$gui = {

                bioCapture: function (data) {

                    $scope.biometricData = data;

                },

                createAccount: function () {

                    $scope.$api.createAccount().then(function (response) {

                        $spaUtils.disableProduct(1);
                        var cuentaCreada = response.data, // almacenamos respuesta de la creacion de la cuenta
                            createdStamp = new Date();

                        cuentaCreada.numeroProducto = '0550' + cuentaCreada.numeroProducto.slice(4);

                        $scope.result.account = cuentaCreada.numeroProducto;
                        $scope.result.captions.account = {
                            type: 'success',
                            message: '<b>APERTURA CUENTA:</b> Apertura exitosa.'
                        };
                        $scope.result.stamp = createdStamp;

                        // VERIFICAMOS QUE EL CHECK DE GMF SE HAYA SELECCIONADO EN LA PRIMERA PANTALLA
                        if (nameSpace.checks['4x1000']) {

                            // MARCAMOS COMO EXCENTA LA CUENTA RECIEN CREADA
                            $scope.$api.gmf(cuentaCreada).then(function () {

                                // RESULTADO CREACION CUENTA CON GMF OK
                                $scope.result.captions.gmf = {
                                    type: 'success',
                                    message: '<b>MARCACIÓN 4x1000:</b> Cuenta marcada exenta del 4x1000.'
                                };

                            }, function (response) {

                                // RESULTADO CREACION CUENTA CON ERROR EN GMF
                                $scope.result.captions.gmf = {
                                    type: 'attention',
                                    message: '<b>MARCACIÓN 4x1000:</b> ' + response.headers('Respuesta')
                                };
                                nameSpace.checks['4x1000'] = false;

                            })['finally'](function () { // eslint-disable-line dot-notation

                                // GENERAMOS DOCUMENTOS
                                $scope.$api.generarDocumentos(cuentaCreada).then(null, function (response) {

                                    $scope.result.captions.docs = {
                                        type: 'attention',
                                        message: '<b>DOCUMENTACIÓN:</b> Hubo un error al generar la documentación'
                                    };

                                });

                            });

                        } else {

                            // GENERAMOS DOCUMENTOS
                            $scope.$api.generarDocumentos(cuentaCreada).then(null, function (response) {

                                $scope.result.captions.docs = {
                                    type: 'attention',
                                    message: '<b>DOCUMENTACIÓN:</b> Hubo un error al generar la documentación'
                                };

                            });

                        }

                        // REGISTRAMOS LA APERTURA DE LA CUENTA EN EL CONTADOR
                        // $spaUtils.setCounter($rootScope.routeApp['1']);

                        // REGISTRAMOS EN OBSERVACIONES DE SIEBEL EL NUMERO DE LA CUENTA CREADA
                        $siebel.actualizaSiebel({
                            customComments: '\n- Venta en Linea:\n\t- Numero de Producto Originado: ' + cuentaCreada.numeroProducto + ' - ' + nameSpace.title
                        });

                    }, function (response) {

                        // RESULTADO FALLIDO EN CREACION CUENTA SIN GMF
                        if (response.status === 417) {

                            $scope.result.captions.account = {
                                type: 'error',
                                message: '<b>APERTURA CUENTA:</b> Proceso no exitoso. Por favor intente más tarde.'
                            };

                        } else {

                            $scope.result.captions.account = {
                                type: 'error',
                                message: '<b>APERTURA CUENTA:</b> Proceso no exitoso. Por favor intente más tarde.'
                            };

                        }

                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
             | PROGRAM FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            /* ------------------------------------------------------------------------------------------
             | API FUNCTIONS
             -------------------------------------------------------------------------------------------- */

            $scope.$api = {

                // ////////////////////////////// APERTURA DE CUENTA DE AHORROS
                createAccount: function () {

                    var cliente = $rootScope.CLIENT,
                        persona = cliente.CLIENTE,
                        address = ($filter('filter')(cliente.DIRECCIONES, {
                            DAV_Principal: 'Y'
                        })[0] || cliente.DIRECCIONES[0] || {
                            StreetAdress: '',
                            DAV_PersonaMunicipality: ''
                        }),
                        phone = ($filter('filter')(cliente.TELEFONOS, {
                            DAV_PrincipalTelephone: 'Y'
                        })[0] || cliente.TELEFONOS[0] || {
                            Number: 0
                        }),
                        ingreso = ($filter('filter')(cliente.INGRESOS, {
                            Principal: 'Y'
                        })[0] || {
                            ActividadEconomica: '00000'
                        }),
                        lovs = nameSpace.lovs,
                        productosDigital = $rootScope.lov.lov_productos_venta_en_linea_obj['1'].codigo;

                    return $api.cuentas.aperturaAhorros({
                        rowId: CONFIG.rowId,
                        usuario: CONFIG.usuario,
                        oficinaTotal: CONFIG.oficinaTotal,
                        tipoIdentificacion: CONFIG.idType,
                        numeroIdentificacion: CONFIG.idNumber,
                        nombres: persona.Nombres,
                        primerApellido: persona.PrimerApellido,
                        segundoApellido: persona.SegundoApellido,
                        sexo: persona.Sexo,
                        actividadEconomica: ingreso.ActividadEconomica || '00000',
                        subproducto: $filter('filter')(lovs.lov_subproducto_cuenta_digital, {
                            codigo: productosDigital
                        })[0].desc,
                        claseCuenta: $filter('filter')(lovs.lov_clase_cuenta_digital, {
                            codigo: productosDigital
                        })[0].desc,
                        tipoCuenta: $filter('filter')(lovs.lov_tipo_cuenta_digital, {
                            codigo: productosDigital
                        })[0].desc,
                        indObjetivo: $filter('filter')(lovs.lov_objetivo_cuenta_digital, {
                            codigo: productosDigital
                        })[0].desc,
                        medioEntregaExtracto: $filter('filter')(lovs.lov_extracto_cuenta_digital, {
                            codigo: productosDigital
                        })[0].desc,
                        direccion: address.StreetAdress || '',
                        ciudad: address.DAV_PersonaMunicipality || '',
                        telefono: phone.Number,
                        codigoVendedor: $filter('fillWith')(CONFIG.employee.davIdentificationNumber2, {
                            length: 16,
                            char: '0'
                        }),
                        codigoEstrategia: $filter('filter')($rootScope.lov.lov_productos_venta_en_linea, {
                            codigo: lovs.lov_estrategia_cuenta_digital[0].codigo
                        })[0].desc
                    });

                },

                // ////////////////////////////// GENERACION DE DOCUMENTOS
                generarDocumentos: function (cuentaCreada) {

                    var cliente = $rootScope.CLIENT.CLIENTE,
                        division = CONFIG.employee.listOfEmployeePosition.employeePosition[0].division.slice(-4),
                        oficina = $filter('filter')(nameSpace.lovs.lov_oficinas, {
                            codigo: division
                        }, true)[0] || {
                            codigo: division,
                            desc: division
                        },
                        ciudad = $filter('filter')(nameSpace.lovs.lov_oficina_ciudad, {
                            codigo: oficina.codigo
                        })[0] || {
                            codigo: oficina.codigo,
                            desc: oficina.codigo
                        },
                        idType = $filter('filter')(nameSpace.lovs.lov_tipo_identif_homologado, {
                            codigo: CONFIG.idType
                        }, true)[0],
                        now = new Date(),
                        gmf = nameSpace.checks['4x1000'];

                    return $api.compartida.generacionDoc({
                        rowId: CONFIG.rowId.split('-')[1],
                        oficinaTotal: CONFIG.oficinaTotal,
                        session: "0",
                        paqueteDocId: gmf ? 'CUENTA_DIGITAL_GMF_360' : 'CUENTA_DIGITAL_360',
                        cliente: {
                            valTipoIdentificacion: CONFIG.idType,
                            valNumeroIdentificacion: CONFIG.idNumber,
                            valMail: ($filter('filter')($rootScope.CLIENT.EMAILS, {
                                DAV_PrincipalEmail: 'Y'
                            })[0] || {
                                Email: ''
                            }).Email
                        },
                        parametros: {
                            parametro: [{
                                id: "{contrato_oficina}",
                                valor: oficina.codigo + '-' + oficina.desc
                            },
                            {
                                id: "{contrato_fecha}",
                                valor: $filter('date')(new Date(), 'yyyy/MM/dd')
                            },
                            {
                                id: "{contrato_naturaleza}",
                                valor: "Persona Natural"
                            },
                            {
                                id: "{contrato_nombres_apellidos}",
                                valor: cliente.Nombres + ' ' + cliente.PrimerApellido + ' ' + cliente.SegundoApellido
                            },
                            {
                                id: "{contrato_tipo_id}",
                                valor: idType.desc
                            },
                            {
                                id: "{contrato_num_id}",
                                valor: CONFIG.idNumber
                            },
                            {
                                id: "{contrato_tipo_producto}",
                                valor: "Cuenta Ahorros"
                            },
                            {
                                id: "{contrato_subproducto}",
                                valor: "Tradicional"
                            },
                            {
                                id: "{contrato_tipo_manejo}",
                                valor: "Individual"
                            },
                            {
                                id: "{contrato_num_producto}",
                                valor: cuentaCreada.numeroProducto.slice(-12)
                            },
                            {
                                id: "{contrato_cuenta_empleador}",
                                valor: "No Aplica"
                            },
                            {
                                id: "{contrato_check_tarjeta_debito_si}",
                                valor: "uncheck.png"
                            },
                            {
                                id: "{contrato_check_tarjeta_debito_no}",
                                valor: "check.png"
                            },
                            {
                                id: "{contrato_check_tarjeta_debito_ninguno}",
                                valor: "hook.png"
                            },
                            {
                                id: "{contrato_check_talonario_si}",
                                valor: "uncheck.png"
                            },
                            {
                                id: "{contrato_check_talonario_no}",
                                valor: "check.png"
                            },
                            {
                                id: "{contrato_check_talonario_ninguno}",
                                valor: "hook.png"
                            },
                            {
                                id: "{esExcentaGMF_check}",
                                valor: gmf ? 'check.png' : 'uncheck.png'
                            },
                            {
                                id: "{aceptoConozco_check}",
                                valor: "check.png"
                            },
                            {
                                id: "{certificoObjetivo_check}",
                                valor: "check.png"
                            },
                            {
                                id: "{autorizo_check}",
                                valor: "check.png"
                            },
                            {
                                id: "{nic_nombres}",
                                valor: cliente.Nombres
                            },
                            {
                                id: "{nic_primer_apellido}",
                                valor: cliente.PrimerApellido
                            },
                            {
                                id: "{nic_segundo_apellido}",
                                valor: cliente.SegundoApellido
                            },
                            {
                                id: "{soporte_ti}",
                                valor: idType.desc
                            },
                            {
                                id: "{soporte_numeroIdentificacion}",
                                valor: CONFIG.idNumber
                            },
                            {
                                id: "{contrato_year_firma}",
                                valor: $filter('date')(now, 'yyyy')
                            },
                            {
                                id: "{contrato_mes_firma}",
                                valor: $filter('capitalize')($filter('date')(now, 'MMMM'))
                            },
                            {
                                id: "{contrato_dia_firma}",
                                valor: $filter('date')(now, 'dd')
                            },
                            {
                                id: "{nic_hora_entrevista}",
                                valor: $filter('date')(now, 'HH:mm:ss')
                            },
                            {
                                id: "{gmf_ciudad}",
                                valor: gmf ? ciudad.desc : ''
                            },
                            {
                                id: "{gmf_fecha}",
                                valor: gmf ? $filter('date')(now, 'yyyy-MM-dd') : ''
                            },
                            {
                                id: "{gmf_tipo_identificacion}",
                                valor: gmf ? idType.desc : ''
                            },
                            {
                                id: "{gmf_numero_identificacion}",
                                valor: gmf ? CONFIG.idNumber : ''
                            },
                            {
                                id: "{gmf_numero_cuenta}",
                                valor: gmf ? cuentaCreada.numeroProducto.slice(-12) : ''
                            },
                            {
                                id: "{gmf_nombres}",
                                valor: gmf ? cliente.Nombres + ' ' + cliente.PrimerApellido + ' ' + cliente.SegundoApellido : ''
                            },
                            {
                                id: "{ciudad}",
                                valor: ciudad.desc
                            },
                            {
                                id: "{num_cuenta}",
                                valor: cuentaCreada.numeroProducto.slice(-12)
                            },
                            {
                                id: "{hora}",
                                valor: $filter('date')(now, 'HH:mm:ss')
                            }],
                            adjunto: [{
                                valNombre: "huella_registrada",
                                valContenido: $scope.biometricData.base64,
                                valTipo: "PNG"
                            }]
                        },
                        enviarCopiaCorreo: "true",
                        requiereClave: "true",
                        valClaveDocumento: CONFIG.idNumber
                    });

                },

                // ////////////////////////////// MARCACION 4x1000
                gmf: function (cuentaCreada) {

                    return $api.novedades.gmf({
                        rowId: CONFIG.rowId,
                        subTipoConsulta: "",
                        clasificacion: "",
                        motivoConsulta: "",
                        usuario: CONFIG.usuario,
                        perfil: CONFIG.perfil,
                        idTransaccion: "NovedadesGMF",
                        valNumeroCuenta: cuentaCreada.numeroProducto,
                        valIndicadorMarcacion: "0",
                        oficinaTotal: CONFIG.oficinaTotal
                    });

                }

            };

            /* ------------------------------------------------------------------------------------------
 		     | INIT
 		     -------------------------------------------------------------------------------------------- */

        }
    ]);

});
