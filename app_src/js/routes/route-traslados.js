define(["angularAMD"], function (a) {
    angular
        .module("routes.traslados", ["ui.router"])
        .config([
            "$locationProvider",
            "$stateProvider",
            "$urlRouterProvider",
            "$httpProvider",
            function (
                d, $stateProvider, e, f
            ) {
                var c = [{name: "lov_novedades_fondos_inversion_tipo_asociacion_cuentas", id: "384"}];
                $stateProvider.state("app.traslado-portafolios",
                    {
                        url: "/traslado-portafolios",
                        views: {
                            main_content: a.route({
                                templateUrl: "resources/html/views/traslados/main-traslados.html",
                                controller: "mainTrasladosCtrl",
                                controllerUrl: "controllers/asociadas/mainTrasladosCtrl"
                            })
                        },
                        data: {title: "Novedad Cuentas Asociadas", bread: "Novedad Cuentas Asociadas"},
                        resolve: {
                            lovs: ["$utilities", function ($utilities) {
                                return $utilities.resolveLovs(c)
                            }]
                        }
                    })
            }])
});
