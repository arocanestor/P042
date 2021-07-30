'use strict';

module.exports = (function () {

    var dependencies = [],
        paths;

    function init (gulp, lodash, plugins, config) {

        paths = config.paths;

        var eslint = plugins.eslint;

        return gulp.src(paths.appSrc.scripts + '**/*.js')
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.failAfterError());

    }

    return {
        dep: dependencies,
        fn: init
    };

}());
