define(["angularAMD"], function (a) {
    angular.module("routes.novAportes", ["ui.router"]).config(["$locationProvider", "$stateProvider", "$urlRouterProvider", "$httpProvider", function (d, b, e, f) {
        var c = [{ name: "lov_novedades_fondos_inversion_tipo_asociacion_cuentas", id: "384" }];
        b.state("app.novedad-aportes",
            {
                url: "/routes.novAportes",
                views: {
                    main_content: a.route({
                        templateUrl: "resources/html/views/novAportes/novAportes.html",
                        controller: "novAportes", 
                        controllerUrl: "controllers/novAportes/novAportes"
                    })
                },
                data: { title: "Novedad Cuentas Asociadas", bread: "Novedad Cuentas Asociadas" },
                resolve: { lovs: ["$utilities", function (a) { return a.resolveLovs(c) }] }
            })
    }])
});