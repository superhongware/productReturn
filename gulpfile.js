// (function(){
//   'use strict';
const gulp = require('gulp');
const browserSync = require('browser-sync');
const webpack = require('webpack-stream');
const babel = require('gulp-babel');
var uglify = require('gulp-uglify');


const webpackModule = {
    loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
    }]
};

gulp.task('serve', function() {
    webpackrun();
    var server = {
        baseDir: './',
        index: 'index.html'
    };
    browserSync.instance = browserSync.init({
        startPath: '/',
        server: server,
        browser: 'default'
    });
    gulp.watch([
        'src/bundle.js',
        'index.html'
    ], function(event) {
        browserSync.reload(event.path);
    });
    gulp.watch('src/**/*.js', function(event) {
      webpackrun();
    });

    function webpackrun(){
      return gulp.src('src/index.js')
      .pipe(webpack({
        devtool: 'source-map',
        // entry: ['babel-polyfill', './app/js'],
        output: {
          filename: "bundle.js",
          chunkFilename: "index.[id].js",
        },
        module: webpackModule,
      }))
      // .pipe(babel())
      .pipe(gulp.dest('src'));
    }

});



gulp.task('build', function() {
    gulp.src('src/index.js')
        .pipe(webpack({
            output: {
                filename: "index.js",
            },
            module: webpackModule,
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});
// })();
