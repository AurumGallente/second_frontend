'use strict';
var rewrite = require( "connect-modrewrite" );
module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            js: {
                src: ['bower_components/jquery/dist/jquery.min.js', 'bower_components/bootstrap/dist/js/bootstrap.min.js', 'bower_components/angular/angular.min.js', 'bower_components/angular-ui-router/release/angular-ui-router.min.js', 'bower_components/angular-resource/angular-resource.min.js', 'bower_components/angular-flash-messages/angular-flash.js', 'bower_components/angular-bootstrap/ui-bootstrap.min.js', 'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js', 'bower_components/bootstrap-spinedit/js/bootstrap-spinedit.js', 'scripts/app.js'],
                dest: 'build/built.js',
            },
            css: {
                src: ['bower_components/bootstrap/dist/css/bootstrap.min.css', 'css/slate.css', 'bower_components/bootstrap-spinedit/css/bootstrap-spinedit.css', 'css/custom.css'],
                dest: 'build/built.css'
            }
        },
        watch: {
            options: {
                livereload: true
            },
            scripts: {
                files: ['scripts/**/*.js'],
                tasks: ['concat:js']
            },
            css: {
                files: ['css/**/*.css'],
                tasks: ['concat:css']
            },
            views: {
                files: ['views/**/*.html', './index.html'],
                tasks: ['']
            }
        },
        connect: {
            options: {
                middleware: function (connect, options, middlewares) {
                    var rules = [
                        "!\\.html|\\.js|\\.eot|.woff|.woff2|\\.css|\\.svg|\\.jp(e?)g|\\.png|\\.gif$ /index.html"
                    ];
                    middlewares.unshift(rewrite(rules));
                    return middlewares;
                }
            },
            server: {
                options: {
                    port: 9001,
                    base: './',
                    livereload: true
                }
            }
        },
        open: {
            all: {
                // Gets the port from the connect configuration
                path: 'http://localhost:<%= connect.server.options.port%>'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.registerTask('server', ['open']);
    grunt.registerTask('default', ['concat', 'connect:server', 'watch']);
};