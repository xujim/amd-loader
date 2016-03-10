var allTestFiles = [];
var TEST_REGEXP = /spec\.js$/i;

var pathToModule = function(path) {
    return path.replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to Amd module names.
        allTestFiles.push(pathToModule(file));
    }
});

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',
    paths: {
        'jquery': 'node_modules/jquery/dist/jquery',
        'notAmd': 'test/example-modules/module-global'
    },
    shim: {
        'notAmd': {
            exports: 'NotAmd'
        }
    }
});

require(allTestFiles, function() {
    window.__karma__.start();
});
