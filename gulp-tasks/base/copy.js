'use strict';

var merge = require('merge-stream');

module.exports = (function () {

    var dependencies = [];

    function init (gulp, lodash, plugins, config, loggerUtility, callback) {

        var _ = lodash,
            util = plugins.util,
            paths = config.paths,
            logger = loggerUtility;

        var jsFiles = gulp.src(paths.appSrc.scripts + '/**/*')
            .pipe(plugins.bom())
            .pipe(gulp.dest(paths.webappSrc.resources.scripts));

        var templates = gulp.src(paths.appSrc.templates + '/**/*')
            .pipe(plugins.bom())
            .pipe(gulp.dest(paths.webappSrc.resources.templates));

        var indexFile = gulp.src(paths.appSrc.root + 'index.html')
            .pipe(plugins.bom())
            .pipe(gulp.dest(paths.webappSrc.views));

        return merge(jsFiles, templates);

    }

    return {
        dep: dependencies,
        fn: init
    };

}());
