'use strict';

var gulpRequireTasks = require('gulp-require-tasks'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    util = require('gulp-util'),
    lodash = require('lodash'),
    config = require('./config');

var plugins = gulpLoadPlugins({
    scope: ['devDependencies'],
    rename: {
        'gulp-stubby-server': 'stubby',
        'gulp-concat-css': 'concatcss',
        'gulp-trailing-comma': 'removeComma'
    }
});

// logger utility
var loggerUtility = {

    colors: {
        error: util.colors.bold.red,
        success: util.colors.bold.green,
        warning: util.colors.italic.yellow,
        info: util.colors.cyan,
        note: util.colors.bgYellow.black
    },

    error: function (str) {

        util.log(this.colors.error(str));

    },

    success: function (str) {

        util.log(this.colors.success(str));

    },

    warning: function (str) {

        util.log(this.colors.warning(str));

    },

    info: function (str) {

        util.log(this.colors.info(str));

    },

    note: function (str) {

        util.log(this.colors.note(str));

    }

};

try {

    var plugins = gulpLoadPlugins({
        scope: ['devDependencies'],
        rename: {
            'gulp-stubby-server': 'stubby',
            'gulp-concat-css': 'concatcss',
            'gulp-trailing-comma': 'removeComma'
        }
    });

    gulpRequireTasks({
        separator: '.',
        arguments: [lodash, plugins, config, loggerUtility]
    });

} catch (err) {

    var gulp = require('gulp'),
        fallback = function (cb) {

            loggerUtility.error('No se encontraron dependencias. Por favor asegurese de tener el archivo package.json');
            cb();

        };

    gulp.task('env.server', fallback);
    gulp.task('default', fallback);

}
