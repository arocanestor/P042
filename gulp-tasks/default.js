'use strict';

module.exports = (function () {

    var dependencies = ['base.lint', 'base.copy'];

    function init (gulp, lodash, plugins, config, loggerUtility, callback) {

        var _ = lodash,
            util = plugins.util,
            paths = config.paths,
            logger = loggerUtility;

        logger.success('Build finalizado exitosamente, ya se puede ejecutar mvn clean install');

        callback();

    }

    return {
        dep: dependencies,
        fn: init
    };

}());
