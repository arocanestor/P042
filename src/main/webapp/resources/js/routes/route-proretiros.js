define(["angularAMD"], function (b) {
    angular.module("routes.retiros", ["ui.router"]).config(
        ["$locationProvider", "$stateProvider", "$urlRouterProvider", "$httpProvider", function (e, d, f, g) {
            var c = [
                        { name: "lov_fondos_tipo_novedad_programacion", id: "378" },
                        { name: "lov_fondos_periocidad", id: "379" },
                        { name: "lov_fondos_motivo_cancelacion", id: "380" }
                    ]; d.state("app.programacion-retiros", {
                url: "/programacion-retiros", views: {
                    main_content: b.route({
                        templateUrl: "resources/html/views/retiros/mainRetiros.html", controller: "mainRetirosCtrl",
                        controllerUrl: "controllers/retiros/mainRetirosCtrl"
                    })
                }, data: { title: "Programación de Retiros", bread: "Programación de Retiros" }, resolve: { lovs: ["$utilities", function (a) { return a.resolveLovs(c) }] }
            }).state("app.programacion-retiros.crear", {
                url: "/crear", views: { retiros_main: b.route({ templateUrl: "resources/html/views/retiros/crear/crearRetiros.html", controller: "crearRetirosCtrl", controllerUrl: "controllers/retiros/crear/crearRetirosCtrl" }) }, data: { title: "Nueva Programación", bread: "Nueva Programación" }, resolve: {
                    lovs: ["$utilities",
                        function (a) { return a.resolveLovs(c) }]
                }
            })
        }])
});