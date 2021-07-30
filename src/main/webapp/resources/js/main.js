(function () {

    var baseResourcesUrl = '/WebBaseNg/resources/',
        baseJsUrl = baseResourcesUrl + 'js/';

    require.config({
        waitSeconds: 0,
        paths: {
            'polyfills': baseJsUrl + 'lib/polyfills/polyfills.min',
            'angular': baseJsUrl + 'lib/angular/angular.min',
            'angular-sanitize': baseJsUrl + 'lib/angular-sanitize/angular-sanitize.min',
            'angular-ui-router': baseJsUrl + 'lib/angular-ui-router/angular-ui-router.min',
            'angularAMD': baseJsUrl + 'lib/angular-amd/angularAMD.min',
            'ckeditor': baseJsUrl + 'lib/ck-editor/ckeditor.min',
            'core-genericFilters': baseJsUrl + 'filters/genericFilters',
            'core-directives': baseJsUrl + 'directives/directives',
            'core-config': baseJsUrl + 'services/config',
            'core-extras': baseJsUrl + 'services/extras',
            'core-interceptors': baseJsUrl + 'factories/interceptors',
            'core-utilities': baseJsUrl + 'factories/utilities',
            'core-slm': baseResourcesUrl + 'modules/slm/slm',
            'core-devices': baseResourcesUrl + 'modules/devices/devices',
            'core-calendar': baseResourcesUrl + 'modules/calendar/calendar',
            'core-angularsoap': baseResourcesUrl + 'modules/angularSOAP/angular.soap',
            'core-soapclient': baseResourcesUrl + 'modules/angularSOAP/soapclient'
        },
        shim: {
            'angularAMD': ['angular'],
            'angular-ui-router': ['angular'],
            'angular-sanitize': ['angular'],
            'core-angularsoap': ['angular'],
            'core-soapclient': ['angular']
        },
        deps: ['app']
    });

}());
