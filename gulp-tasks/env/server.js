'use strict';

var bs = require('browser-sync').create(),
 proxxy = require('http-proxy-middleware');

module.exports = (function () {

    var dependencies = ['env.mockServer'],
        _, services, mockHtml, mockServer, rewritePaths, rewriteEndpoints, logger;

    function init (gulp, lodash, plugins, config, loggerUtility, callback) {

        var server = config.server,
            paths = config.paths,
            util = require("gulp-util");

        _ = lodash;
        services = config.services;
        rewritePaths = config.services.rewritePaths;
        rewriteEndpoints = config.services.rewriteEndpoints;
        mockServer = config.mockServer;
        mockHtml = util.env.mock;
        logger = loggerUtility;

        // validar que se tenga configurado un endpoint o el mockserver encendido
        if (!_.trim(services.endPoint) && !mockServer.isActive) {

            logger.error('Es necesesario que se defina un endpoint de servicios ya que el mockServer se encuentra desactivado!');
            bs.exit();
            callback();
            process.exit();

        } else {

            bs.init({
                ui: false,
                notify: false,
                logPrefix: util.colors.white.bgRed.bold(' SPA ') + util.colors.white.bgBlue(' ' + config.spa.code + ' '),
                server: {
                    baseDir: '.',
                    index: paths.appSrc.root + 'index.html',
                    middleware: _getProxys(),
                    routes: server.routes
                },
                open: server.openBrowser,
                port: server.port,
                ghostMode: false,
                online: server.externalUrl,
                reloadDelay: 1000,
                injectChanges: false
            }, callback);

            bs.watch(paths.appSrc.root + 'index.html', bs.reload);

        }

    }

    /**
     * _getProxys - obtain proxy-middleware module
     *
     * @return {proxy}  http-proxy-middleware for browser-sync
     */
    function _getProxys () {

        var options = {
            target: _getProxyEndpoint(),
            changeOrigin: true,
            logLevel: 'debug',
            onProxyReq: _onProxyReq,
            onProxyRes: _onProxyRes,
            onError: _onProxyError
        };

        if (!_.isEmpty(rewriteEndpoints)) {

            options.router = {};

            _.forEach(rewriteEndpoints, function (endpoint, rewritePattern) {

                if (!/^(http[s]*:\/\/)/.test(endpoint)) {

                    endpoint = 'http://' + endpoint;

                }

                options.router[rewritePattern] = endpoint.replace(/\/$/, '') + '/';

            });

        }

        return mockHtml ? false : [proxxy(['/api/', '/actualizaSiebel'], options)];

    }

    /**
     * _onProxyReq - handle on proxy request event
     *
     * @param  {object} proxyReq http-proxy-middleware request
     * @param  {object} req      native request
     * @param  {object} res      native response
     */
    function _onProxyReq (proxyReq, req, res) {

        var acRegExp = /^\/actualizaSiebel/,
            path;

        if (acRegExp.test(req.originalUrl)) {

            path = req.originalUrl;

        } else {

            path = _resolvePath(req.originalUrl);

        }

        proxyReq.path = path;

    }

    /**
     * _onProxyRes - handle on proxy response event
     *
     * @param  {object} proxyRes http-proxy-middleware request
     * @param  {object} req      native request
     * @param  {object} res      native response
     */
    function _onProxyRes (proxyRes, req, res) {

        // TODO: handle on proxy response event

    }

    /**
     * _onProxyError - handle on proxy error event
     *
     * @param  {string} err cause of error
     * @param  {object} req native request
     * @param  {object} res native response
     */
    function _onProxyError (err, req, res) {

        logger.error('Ha ocurrido un error en el request: ' + req.url + ' -> ' + err);

        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });

        res.end('Ha ocurrido un error.');

    }

    /**
     * _resolvePath - resolve api path for external endPoint
     *
     * @param  {string} path to resolve
     * @return {String}      resolved path
     */
    function _resolvePath (path) {

        var pathArr = path.split('/').slice(2),
            api = pathArr[0],
            service = pathArr[1],
            apiResolved = _.upperFirst(api) + '-api/' + api,
            pathRewrited = _validatePathRewrite(path);

        if (pathRewrited && /[aA-zZ]+-{1}[api]+\/[aA-zZ]+\/[aA-zZ]+/.test(pathRewrited)) {

            return pathRewrited;

        }

        return '/' + (pathRewrited || apiResolved) + '/' + service;

    }

    /**
     * _validatePathRewrite - validate if the request path need to be rewrited
     *
     * @param  {String} path to validate rewriting
     * @return {String}      rewrited path
     */
    function _validatePathRewrite (path) {

        var rewritedPath = '';

        _.forEach(rewritePaths, function (value, key) {

            var regExp = new RegExp(key);

            if (regExp.test(path)) {

                rewritedPath = value.replace(/\/$/, '');
                return false;

            }

        });

        return rewritedPath;

    }

    /**
     * _getProxyEndpoint - get proxy endponit based on config file
     *
     * @return {String} proxy endpoint to use
     */
    function _getProxyEndpoint () {

        var targetProxyEndpoint = 'http://' + mockServer.location + ':' + mockServer.port;

        if (_.trim(services.endPoint)) {

            targetProxyEndpoint = services.endPoint;

            if (!/^(http[s]*:\/\/)/.test(targetProxyEndpoint)) {

                targetProxyEndpoint = 'http://' + targetProxyEndpoint;

            }

        }

        return targetProxyEndpoint.replace(/\/$/, '') + '/';

    }

    return {
        dep: dependencies,
        fn: init
    };

}());
