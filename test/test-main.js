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

/*
http://www.ruanyifeng.com/blog/2012/11/require_js.html
理论上，require.js加载的模块，必须是按照AMD规范、用define()函数定义的模块。但是实际上，虽然已经有一部分流行的函数库（比如jQuery）符合AMD规范，更多的库并不符合。那么，require.js是否能够加载非规范的模块呢？
回答是可以的。
这样的模块在用require()加载之前，要先用require.config()方法，定义它们的一些特征。
*/
require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',
    paths: {
        'jquery': 'node_modules/jquery/dist/jquery',
        'notAmd': 'test/example-modules/module-global'
    },
    shim: {//shim专门用来定义不规范的模块
        'notAmd': {
            exports: 'NotAmd'
        }
    }
});

require(allTestFiles, function() {
    window.__karma__.start();
});
