define(["angularAMD"], function (a) {
    angular.module("routes.cdat", ["ui.router"]).config(["$locationProvider", "$stateProvider", "$urlRouterProvider", "$httpProvider", function (e, d, f, g) {
        d.state("app.cdat", { url: "/cdat", views: { main_content: a.route({ templateUrl: "resources/html/views/cdat/mainCDAT.html", controller: "virtualCDATCtrl", controllerUrl: "controllers/cdat/mainCDAT" }) }, data: { title: "Menú CDAT Virtual", bread: "Menú CDAT Virtual" } }); d.state("app.cdat.caracteristicas", {
            url: "/cdat-caracteristicas", views: {
                cdat_main: a.route({
                    templateUrl: "resources/html/views/cdat/simulacion/caracteristicasCDAT.html",
                    controller: "caracteristicasCDATCtrl", controllerUrl: "controllers/cdat/simulacion/caracteristicasCDAT"
                })
            }, data: { title: "CDAT Virtual - Características", bread: "CDAT Virtual - Características" }, resolve: { textos: ["$api", "$q", function (a, b) { var c = b.defer(); a.reportes.textosReporte("R_CDAT_C023").then(function (a) { c.resolve(a.data) }); return c.promise }], lovs: ["$api", "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_listas_cuenta_digital", id: "251" }]) }] }
        }).state("app.cdat.caracteristicas.simulacion",
            { url: "/cdat-simulacion", views: { "cdat-caracteristicas": a.route({ templateUrl: "resources/html/views/cdat/simulacion/simulacionCDAT.html", controller: "simulacionCDATCtrl", controllerUrl: "controllers/cdat/simulacion/simulacionCDAT" }) }, data: { title: "CDAT Virtual - Simulación", bread: "CDAT Virtual - Simulación" } }).state("app.cdat.caracteristicas.simulacion.constitucion", {
                url: "/apertura", views: {
                    "cdat-constitucion": a.route({
                        templateUrl: "resources/html/views/cdat/simulacion/constitucionCDAT.html", controller: "constitucionCDATCtrl",
                        controllerUrl: "controllers/cdat/simulacion/constitucionCDAT"
                    })
                }, data: { bread: "Apertura" }, resolve: { lovs: ["$api", "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_checks_CDaT", id: "261" }]) }] }
            }).state("app.cdat.caracteristicas.simulacion.constitucion.resumen", {
                url: "/confirmacion", views: { "cdat-constitucion-resumen": a.route({ templateUrl: "resources/html/views/cdat/simulacion/resumenConstitucion.html", controller: "resumenConstitucionCtrl", controllerUrl: "controllers/cdat/simulacion/resumenConstitucion" }) },
                data: { bread: "Confirmación" }
            }).state("app.cdat.caracteristicas.simulacion.constitucion.resumen.biometric", { url: "/biometric", views: { "cdat-constitucion-resumen-biometric": a.route({ templateUrl: "resources/html/views/cdat/simulacion/CDATBiometric.html", controller: "cdatCtrlBiometric", controllerUrl: "controllers/cdat/simulacion/CDATBiometricCtrl" }) } }); d.state("app.cdat.reinversion", {
                url: "/caracteristicas", views: {
                    cdat_main: a.route({
                        templateUrl: "resources/html/views/cdat/reinversion/caracteristicasCDAT.html",
                        controller: "caracteristicasReinvCDATCtrl", controllerUrl: "controllers/cdat/reinversion/caracteristicasCDAT"
                    })
                }, data: { title: "Características", bread: "Características" }, resolve: { textos: ["$api", "$q", function (a, b) { var c = b.defer(); a.reportes.textosReporte("R_CDAT_P038").then(function (a) { c.resolve(a.data) }, function (a) { }); return c.promise }], lovs: ["$api", "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_cdat_permitidos", id: "270" }, { name: "lov_listas_cuenta_digital", id: "251" }]) }] }
            }).state("app.cdat.reinversion.detalle",
                { url: "/cdat-detalle", views: { "cdat-simulacion": a.route({ templateUrl: "resources/html/views/cdat/reinversion/detalleCtrl.html", controller: "detalleCtrl", controllerUrl: "controllers/cdat/reinversion/detalleCtrl" }) }, data: { title: "Detalle CDAT Virtual", bread: "Detalle CDAT Virtual" }, resolve: { lovs: ["$api", "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_oficinas_cdat", id: "290" }]) }] } }).state("app.cdat.reinversion.detalle.simulacion", {
                    url: "/cdat-simulacion", views: {
                        "cdat-detalle": a.route({
                            templateUrl: "resources/html/views/cdat/reinversion/simulacionReinversion.html",
                            controller: "simulacionCDATCtrl", controllerUrl: "controllers/cdat/reinversion/simulacionReinversion"
                        })
                    }, data: { title: "Simulación", bread: "Simulación" }
                }).state("app.cdat.reinversion.detalle.simulacion.reinversion", {
                    url: "/reinversion", views: { "cdat-reinversion": a.route({ templateUrl: "resources/html/views/cdat/reinversion/reinversionCDAT.html", controller: "reinversionCDATCtrl", controllerUrl: "controllers/cdat/reinversion/reinversionCDAT" }) }, data: { bread: "Reinversión" }, resolve: {
                        lovs: ["$api", "$utilities", function (a,
                            b) { return b.resolveLovs([{ name: "lov_checks_CDaT", id: "261" }]) }]
                    }
                }).state("app.cdat.reinversion.detalle.simulacion.reinversion.resumen", { url: "/resumen", views: { "cdat-reinversion-resumen": a.route({ templateUrl: "resources/html/views/cdat/reinversion/resumenReinversion.html", controller: "resumenReinversionCtrl", controllerUrl: "controllers/cdat/reinversion/resumenReinversion" }) }, data: { bread: "Resumen" } }).state("app.cdat.reinversion.detalle.simulacion.reinversion.resumen.biometric", {
                    url: "/biometric", views: {
                        "cdat-reinversion-biometric": a.route({
                            templateUrl: "resources/html/views/cdat/reinversion/CDATBiometric.html",
                            controller: "cdatCtrlBiometric", controllerUrl: "controllers/cdat/reinversion/CDATBiometricCtrl"
                        })
                    }, data: { title: "Captura de huella", bread: "Firma electrónica" }
                }); d.state("app.cdat.cancelacion", {
                    url: "/cancelacion", views: { cdat_main: a.route({ templateUrl: "resources/html/views/cdat/cancelacion/cancelacionCDAT.html", controller: "cancelacionCDATCtrl", controllerUrl: "controllers/cdat/cancelacion/cancelacionCDAT" }) }, data: { title: "Cancelación CDAT Virtual", bread: "Cancelación CDAT Virtual" }, resolve: {
                        textos: ["$api",
                            "$q", function (a, b) { var c = b.defer(); a.reportes.textosReporte("R_CDAT_P038").then(function (a) { c.resolve(a.data) }, function (a) { }); return c.promise }], lovs: ["$api", "$utilities", function (a, b) { return b.resolveLovs([{ name: "lov_cdat_permitidos", id: "270" }, { name: "lov_listas_cuenta_digital", id: "251" }, { name: "lov_oficinas_cdat", id: "290" }]) }]
                    }
                }).state("app.cdat.cancelacion.resumen", {
                    url: "/resumen", views: {
                        "cdat-cancelacion": a.route({
                            templateUrl: "resources/html/views/cdat/cancelacion/resumenCancelacion.html", controller: "resumenCancelacionCtrl",
                            controllerUrl: "controllers/cdat/cancelacion/resumenCancelacion"
                        })
                    }, data: { title: "Confirmación Cancelación CDAT Virtual", bread: "Confirmación Cancelación CDAT Virtual" }
                }).state("app.cdat.cancelacion.resumen.biometric", { url: "/biometric", views: { "cdat-cancelacion-biometric": a.route({ templateUrl: "resources/html/views/cdat/cancelacion/CDATBiometric.html", controller: "cdatCtrlBiometric", controllerUrl: "controllers/cdat/cancelacion/CDATBiometricCtrl" }) }, data: { title: "Captura de huella", bread: "Firma electrónica" } })
    }])
});