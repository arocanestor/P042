'use strict';

module.exports = (function () {

    var dependencies = [],
        _, logger;

    function init (gulp, lodash, plugins, config, loggerUtility, callback) {
        console.log(plugins.util)
        var paths = config.paths,
            util = require("gulp-util"),
            stubby = require("gulp-stubby-server"),
            mockServer = config.mockServer,
            mockHtml = util.env.mock;

        _ = lodash;
        logger = loggerUtility;

        var options = {
            callback: _onSuccess,
            stubs: mockServer.port,
            location: mockServer.location || 'localhost',
            tls: mockServer.httpsPort || '8001',
            admin: mockServer.admin || '8889',
            watch: paths.mockServices.root + 'config-services.json',
            files: [paths.mockServices.root + 'config-services.json']
        };

        if (mockServer.isActive && !mockHtml) {

            stubby(options, callback);

        } else {

            logger.note(' EL MOCKSERVER SE ENCUENTRA DESACTIVADO ');
            callback();

        }

    }


    /**
     * _onSuccess - handle on success server start
     *
     * @param  {object} server  stubby-server instance
     * @param  {object} options stubby-server config options
     */
    function _onSuccess (server, options) {

        // total server.endpoints.lastId
        logger.note(' SE INICIA EL MOCKSERVER DE FORMA EXITOSA ');

    }

    return {
        dep: dependencies,
        fn: init
    };

}());
