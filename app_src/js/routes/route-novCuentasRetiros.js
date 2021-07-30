define(["angularAMD"], function (b) {
    angular.module("routes.novedaCuentaRetiro", ["ui.router"]).config(
        ["$locationProvider", "$stateProvider", "$urlRouterProvider", "$httpProvider", function (e, d, f, g) {
            var c = [   
                        {name: "lov_novedades_fondos_inversion_tipo_asociacion_cuentas", id: "384"},
                        {name: "lov_fondos_tipo_novedad_programacion", id: "378" },
                        {name: "lov_fondos_periocidad", id: "379" },
                        {name: "lov_fondos_motivo_cancelacion", id: "380" }
                    ]; 
            d.state("app.novedad-cuenta-retiros", {
                url: "/novedad-cuenta-retiros", 
                views: {
                    main_content: b.route({
                        templateUrl: "resources/html/views/novedaCuentaRetiro/mainNovCuentaRetiro.html",
                        controller: "mainNovCuentaRetiro", 
                        controllerUrl: "controllers/novedaCuentaRetiro/mainNovCuentaRetiro"
                    })
                }, 
                data: { 
                    title: "Programación de Retiros", 
                    bread: "Programación de Retiros" }, 
                    resolve: { lovs: ["$utilities", function (a) { return a.resolveLovs(c) }] }
            }).state("app.novedad-cuenta-retiros.nuevaCuenta", {
                url: "/nuevaCuenta", 
                views: { 
                    retiros_main:  b.route({ 
                            templateUrl: "resources/html/views/novedaCuentaRetiro/nuevaCuenta/nuevaCuenta.html", 
                            controller: "nuevaCuenntaCtrl", 
                            controllerUrl: "controllers/novedaCuentaRetiro/nuevaCuenta/nuevaCuentaCtrl" 
                        }) 
                    }, 
                    data: { 
                        title: "Inscribir Nueva Cuenta", 
                        bread: "Inscribir Nueva Cuenta" }, 
                        resolve: {lovs: ["$utilities", function (a) { return a.resolveLovs(c) }]
                }
            })
        }])
});