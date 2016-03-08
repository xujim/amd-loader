'use strict';

// plugin make karma async
function initAmdJs(files) {
    files.unshift({
        pattern: __dirname + '/amdAdapter.js',
        included: true,
        served: true,
        watched: false
    });
};
initAmdJs.$inject = ['config.files'];

module.exports = function(config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            {
                'framework:amd': ['factory', initAmdJs]
            }
        ],

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'amd'],


        // list of files / patterns to load in the browser
        files: [
            'amd.js',
            'test/test-main.js',
            { pattern: 'node_modules/jquery/dist/jquery.js', included: false },
            { pattern: 'test/example-modules/*.js', included: false },
            { pattern: 'test/**/*.spec.js', included: false }
        ],


        // list of files to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    });
};
