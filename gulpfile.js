var gulp = require('gulp');
var plug = require('gulp-load-plugins')();
var wiredep = require('wiredep');
var es = require('event-stream');
var semver = require('semver');
var fs = require('fs');

var run = require('run-sequence');

var env = plug.util.env;

var paths = {
    src: {
        js: 'src/**/*.js',
        templates: 'templates/**/*.html'
    },
    output: {
        dist: 'dist'
    },
    pkg: {
        bower: 'bower.json',
        npm: 'package.json'
    }
}

gulp.task('compile:src:html', function() {
    return gulp.src(paths.src.templates)
        .pipe(plug.size({
            title: 'before'
        }))
        .pipe(plug.htmlmin({
            removeComments: true,
            collapseWhitespace: true
        }))
        .pipe(plug.angularTemplatecache('symbiote-ng-common.templates.js', {
            module: 'symbiote.templates',
            standalone: true,
            root: 'src/'
        }))

    //.pipe(plug.uglify())
    .pipe(plug.size({
            title: 'after'
        }))
        .pipe(plug.size({
            title: 'gzip',
            gzip: true
        }))
        .pipe(gulp.dest(paths.output.dist));
})

gulp.task('compile:src:js', function() {
    return gulp.src(paths.src.js)
        .pipe(plug.sourcemaps.init())

    .pipe(plug.wrapJs('(function() {\r\n"use strict";\r\n%= body %\r\n})();', {
            newline: '\r\n'
        }))
        .pipe(plug.ngAnnotate())

    .pipe(plug.angularFilesort())
        .pipe(plug.concat('symbiote-ng-common.js'))
        //.pipe(plug.uglify())
        .pipe(plug.sourcemaps.write('./'))
        .pipe(gulp.dest(paths.output.dist));
});
gulp.task('default', ['compile:src:js', 'compile:src:html']);

gulp.task('release', [], function() {

    var inc = env.inc;
    var tag = env.tag;
    var setVersion = env.version;
    var newVersion = null;

    if (!setVersion) {
        var bower = readJson(paths.pkg.bower);

        var current = semver(bower.version);
        var currentTag = current.prerelease && current.prerelease.length > 0 && current.prerelease[0];

        if (!inc && currentTag) {
            inc = 'prerelease';
            tag = tag || currentTag;

        } else if (!inc && !currentTag) {
            inc = "patch";
        }
        newVersion = current.inc(inc, tag);
    } else {
        newVersion = semver(setVersion);
    }

    return gulp.src([paths.pkg.bower, paths.pkg.npm])
        .pipe(plug.bump({
            version: newVersion.format()
        }))
        .pipe(gulp.dest('./'))
        .pipe(plug.git.commit('chore(release) v' + newVersion))
        .pipe(plug.filter(paths.pkg.bower))
        .pipe(plug.tagVersion());
});


var readJson = function(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
};