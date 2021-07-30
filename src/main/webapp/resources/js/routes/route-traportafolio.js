define(["angularAMD"], function (a) {
    angular.module("routes.novedadcuentas", ["ui.router"]).config(["$locationProvider", "$stateProvider", "$urlRouterProvider", "$httpProvider", function (e, c, f, g) {
        c.state("app.novedadcuentas", { url: "/novedadcuentas", views: { main_content: a.route({ templateUrl: "resources/html/views/novedadcuentas/mainNovedades.html", controller: "novedadesCtrl", controllerUrl: "controllers/novedadcuentas/mainNovedades" }) }, data: { title: "Novedades de Fondos", bread: "Novedad Cuenta Retiro" } }); c; c.state("app.novedadcuentas.reinversion",
            {
                url: "/caracteristicas", views: { novedadcuentas_main: a.route({ templateUrl: "resources/html/views/novedadcuentas/reinversion/caracteristicasCDAT.html", controller: "caracteristicasReinvCDATCtrl", controllerUrl: "controllers/novedadcuentas/reinversion/caracteristicasCDAT" }) }, data: { title: "Características", bread: "Características" }, resolve: {
                    textos: ["$api", "$q", function (a, b) { var d = b.defer(); a.reportes.textosReporte("R_CDAT_P038").then(function (a) { d.resolve(a.data) }, function (a) { }); return d.promise }], lovs: ["$api",
                        "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_novedadcuentas_permitidos", id: "270" }, { name: "lov_listas_cuenta_digital", id: "251" }]) }]
                }
            }).state("app.novedadcuentas.reinversion.detalle", {
                url: "/novedadcuentas-detalle", views: { "novedadcuentas-simulacion": a.route({ templateUrl: "resources/html/views/novedadcuentas/reinversion/detalleCtrl.html", controller: "detalleCtrl", controllerUrl: "controllers/novedadcuentas/reinversion/detalleCtrl" }) }, data: { title: "Detalle CDAT Virtual", bread: "Detalle CDAT Virtual" },
                resolve: { lovs: ["$api", "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_oficinas_novedadcuentas", id: "290" }]) }] }
            }).state("app.novedadcuentas.reinversion.detalle.simulacion", { url: "/novedadcuentas-simulacion", views: { "novedadcuentas-detalle": a.route({ templateUrl: "resources/html/views/novedadcuentas/reinversion/simulacionReinversion.html", controller: "simulacionCDATCtrl", controllerUrl: "controllers/novedadcuentas/reinversion/simulacionReinversion" }) }, data: { title: "Simulación", bread: "Simulación" } }).state("app.novedadcuentas.reinversion.detalle.simulacion.reinversion",
                { url: "/reinversion", views: { "novedadcuentas-reinversion": a.route({ templateUrl: "resources/html/views/novedadcuentas/reinversion/reinversionCDAT.html", controller: "reinversionCDATCtrl", controllerUrl: "controllers/novedadcuentas/reinversion/reinversionCDAT" }) }, data: { bread: "Reinversión" }, resolve: { lovs: ["$api", "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_checks_CDaT", id: "261" }]) }] } }).state("app.novedadcuentas.reinversion.detalle.simulacion.reinversion.resumen", {
                    url: "/resumen", views: {
                        "novedadcuentas-reinversion-resumen": a.route({
                            templateUrl: "resources/html/views/novedadcuentas/reinversion/resumenReinversion.html",
                            controller: "resumenReinversionCtrl", controllerUrl: "controllers/novedadcuentas/reinversion/resumenReinversion"
                        })
                    }, data: { bread: "Resumen" }
                }).state("app.novedadcuentas.reinversion.detalle.simulacion.reinversion.resumen.biometric", {
                    url: "/biometric", views: { "novedadcuentas-reinversion-biometric": a.route({ templateUrl: "resources/html/views/novedadcuentas/reinversion/CDATBiometric.html", controller: "novedadcuentasCtrlBiometric", controllerUrl: "controllers/novedadcuentas/reinversion/CDATBiometricCtrl" }) }, data: {
                        title: "Captura de huella",
                        bread: "Firma electrónica"
                    }
                }); c.state("app.novedadcuentas.cancelacion", {
                    url: "/cancelacion", views: { novedadcuentas_main: a.route({ templateUrl: "resources/html/views/novedadcuentas/cancelacion/cancelacionCDAT.html", controller: "cancelacionCDATCtrl", controllerUrl: "controllers/novedadcuentas/cancelacion/cancelacionCDAT" }) }, data: { title: "Cancelación CDAT Virtual", bread: "Cancelación CDAT Virtual" }, resolve: {
                        textos: ["$api", "$q", function (a, b) {
                            var c = b.defer(); a.reportes.textosReporte("R_CDAT_P038").then(function (a) { c.resolve(a.data) },
                                function (a) { }); return c.promise
                        }], lovs: ["$api", "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_novedadcuentas_permitidos", id: "270" }, { name: "lov_listas_cuenta_digital", id: "251" }, { name: "lov_oficinas_novedadcuentas", id: "290" }]) }]
                    }
                }).state("app.novedadcuentas.cancelacion.resumen", {
                    url: "/resumen", views: { "novedadcuentas-cancelacion": a.route({ templateUrl: "resources/html/views/novedadcuentas/cancelacion/resumenCancelacion.html", controller: "resumenCancelacionCtrl", controllerUrl: "controllers/novedadcuentas/cancelacion/resumenCancelacion" }) },
                    data: { title: "Confirmación Cancelación CDAT Virtual", bread: "Confirmación Cancelación CDAT Virtual" }
                }).state("app.novedadcuentas.cancelacion.resumen.biometric", { url: "/biometric", views: { "novedadcuentas-cancelacion-biometric": a.route({ templateUrl: "resources/html/views/novedadcuentas/cancelacion/CDATBiometric.html", controller: "novedadcuentasCtrlBiometric", controllerUrl: "controllers/novedadcuentas/cancelacion/CDATBiometricCtrl" }) }, data: { title: "Captura de huella", bread: "Firma electrónica" } })
    }])
});