var gulp =require('gulp-help')(require('gulp'));

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

gulp.task('compile:src:html', 'Compile templates', function() {
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

gulp.task('compile:src:js', 'Compile JS', function() {
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

gulp.task('default', 'Compile the JS and HTML', ['compile:src:js', 'compile:src:html']);

gulp.task('bump', false, function(){

    var files = [paths.pkg.bower, paths.pkg.npm];
    return bump(files, env);
})

gulp.task('release','Bumps the version, and creates a tag', ['default'], function() {

    var files = [paths.pkg.bower, paths.pkg.npm];

    return bump(files, env)
        .pipe(plug.addSrc(paths.output + '/*.*'))   // Techinally I should have tested / validated the output before i publish.
        .pipe(plug.git.commit('chore(release) v' + env.version))
        .pipe(plug.filter(paths.pkg.bower))
        .pipe(plug.tagVersion())
}, {
    options: {
        'version': 'The SemVer to bump the release to.',
        'inc=bump': 'one of: major, minor, patch, premajor, preminor, prepatch, prerelase',
        'tag=name': 'The name of the prerelase tag. If ommited then the current tag will be used'
    }
});

function bump(files, args) {
    var nextVersion = getBumpedVersion(files[0], args);
    return gulp.src(files)
        .pipe(plug.bump({
            version: nextVersion.format()
        }))
        .pipe(gulp.dest('./'));
}

function getBumpedVersion(pkgFile, args) {
    if (args.version)
        return semver(args.version);

    var pkg = readJson(pkgFile);
    var pkgVersion = semver(pkg.version);

    var currentTag = pkgVersion.prerelease && pkgVersion.prerelease.length > 0 && pkgVersion.prerelease[0];

    if (!args.inc && currentTag) {
        args.inc = 'prerelease';
        args.tag = args.tag || currentTag || 'build';

    } else if (!args.inc && !currentTag) {
        args.inc = "patch";
    }

    env.version = pkgVersion.inc(args.inc, args.tag);
    return env.version;
}

var readJson = function(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
};