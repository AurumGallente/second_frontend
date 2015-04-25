'use strict';
module.exports = function(grunt) {

    targethtml: {
        debug: {
            input: './index.html';
            output: './index.html';
        }
        ;
        release: {
            input: './index.html';
            output: './index.html';
        }
    }
    grunt.loadNpmTasks('grunt-targethtml');
};