var gulp = require('gulp');
var plug = require('gulp-load-plugins')();
var wiredep = require('wiredep');
var es = require('event-stream');

var run = require('run-sequence');

var env = plug.util.env;

var paths = {
    src: {
        js: 'src/**/*.js',
        templates: 'templates/**/*.html'
    },
    output: {
        dist: 'dist'        
    }
}

gulp.task('compile:src:html', function () {
    return gulp.src(paths.src.templates)
        .pipe(plug.size({ title: 'before' }))
        .pipe(plug.htmlmin({ removeComments: true, collapseWhitespace: true }))
        .pipe(plug.angularTemplatecache('symbiote-ng-common.templates.js', {
            module: 'symbiote.templates',
            standalone: true,
            root: 'src/'
        }))

        //.pipe(plug.uglify())
        .pipe(plug.size({ title: 'after' }))
    .pipe(plug.size({ title: 'gzip', gzip: true }))
        .pipe(gulp.dest(paths.output.dist));
})

gulp.task('compile:src:js', function () {
    return gulp.src(paths.src.js)
        .pipe(plug.sourcemaps.init())
        
        .pipe(plug.wrapJs('(function() {\r\n"use strict";\r\n%= body %\r\n})();', { newline: '\r\n' }))
        .pipe(plug.ngAnnotate())
        
        .pipe(plug.angularFilesort())
        .pipe(plug.concat('symbiote-ng-common.js'))
        //.pipe(plug.uglify())
        .pipe(plug.sourcemaps.write('./'))        
        .pipe(gulp.dest(paths.output.dist));
});
gulp.task('default', ['compile:src:js', 'compile:src:html']);


