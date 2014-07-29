var gulp = require('gulp'),
	jscs = require('gulp-jscs'),
	jshint = require('gulp-jshint'),
	mocha = require('gulp-mocha');

var paths = {
	lib: 'lib/**/*.js',
	tests: 'test/**/*.js'
};
paths.all = [paths.lib, paths.tests];

gulp.task('jscs', function(){
	return gulp.src(paths.all)
		.pipe(jscs());
});

gulp.task('jshint', function(){
	return gulp.src(paths.all)
		.pipe(jshint());
});

gulp.task('test', function(){
	return gulp.src(paths.tests, { read: false })
		.pipe(mocha({
			reporter: 'list',
			ui: 'tdd'
		}));
});

gulp.task('watch', function() {
	gulp.watch(paths.all, ['jshint', 'jscs', 'test']);
});

gulp.task('default', ['jshint', 'jscs', 'watch']);
