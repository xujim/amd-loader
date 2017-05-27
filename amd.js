// 具体代码阅读还可参考：http://www.cnblogs.com/yjfengwen/p/4198245.html
// 关于AMD参数的配置，可参考：https://segmentfault.com/a/1190000002401665
// 或更详细的：http://www.mincoder.com/article/4147.shtml
(function(root) {//root就是this，见最下方一行代码
  /*
  require.config({
　　　　shim: {

　　　　　　'underscore':{
　　　　　　　　exports: '_'
　　　　　　},
　　　　　　'backbone': {
　　　　　　　　deps: ['underscore', 'jquery'],
　　　　　　　　exports: 'Backbone'
　　　　　　}
　　　　}
　　});
  */
    var CONFIG = {
        baseUrl: '',
        charset: '',
        paths: {},
        shim: {}
    };
    var MODULES = {};
    // url to SHIM name
    var SHIMMAP = {};
    var cache = {
        modules: MODULES,
        config: CONFIG
    };
    var noop = function() {};//NOTE:表示no operation，不做任何事的空函数
    var document = root.document;
    var head = document.head;
    var baseElement = document.getElementsByTagName('base')[0];
    //currentlyAddingScript表示正在添加到script中的
    //TODO: interactiveScript是什么意思？
    var currentlyAddingScript, interactiveScript, anonymousMeta;

    // utils
    function isType(type) {
        return function(obj) {
            return Object.prototype.toString.call(obj) === '[object ' + type + ']';
        }
    }

    var isFunction = isType('Function');
    var isString = isType('String');
    var isArray = isType('Array');


    function hasProp(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    function each(arr, callback) {
        if (!isArray(arr)) return;
        for (var i = 0, len = arr.length; i < len; i++) {
            if (callback(arr[i], i, arr)) break;
        }
    }

    /**
     * reverse each
     */
    function eachReverse(arr, callback) {
        if (!isArray(arr)) return;
        for (var i = arr.length - 1; i >= 0; i--) {
            if (callback(arr[i], i, arr)) break;
        }
    }

    function eachProp(obj, callback) {
        for (var prop in obj) {
            if (hasProp(obj, prop)) {
                if (callback(obj[prop], prop)) break;
            }
        }
    }

// 如果有属性就表示非plain
    function isPlainObject(obj) {
        var isPlain = true;
        eachProp(obj, function() {
            isPlain = false;
            return true;
        });
        return isPlain;
    }

    /**
     * get property of global recurively
     * @param  {String} path path, like 'name.length'
     * @return {Any}         value of the path
     */
    //  取类似a.b.c最后的c
    function getGlobal(path) {
        if (!path) return path;

        var g = root;//TODO:root是外部function传入，一般是什么值？
        each(path.split('.'), function(part) {
            g = (g != null) && g[part];
        });
        return g;
    }

    /**
     * mixin source object to target
     */
    function mixin(target, source) {
        if (source) {
            eachProp(source, function(value, prop) {
                target[prop] = value;
            });
        }
        return target;
    }

    var dotReg = /\/\.\//g;
    var doubleDotReg = /\/[^/]+\/\.\.\//;
    var multiSlashReg = /([^:/])\/+\//g;
    var ignorePartReg = /[?#].*$/;
    var suffixReg = /\.js$/;
    var dirnameReg = /[^?#]*\//;

    function fixPath(path) {
        // /a/b/./c/./d --> /a/b/c/d
        // 将a.b.c转成/a/b/c
        path = path.replace(dotReg, "/");

        // a//b/c --> a/b/c
        // a///b////c --> a/b/c
        path = path.replace(multiSlashReg, "$1/");

        // a/b/c/../../d --> a/b/../d --> a/d
        while (path.match(doubleDotReg)) {
            path = path.replace(doubleDotReg, "/");
        }

        // main/test?foo#bar  -->  main/test
        path = path.replace(ignorePartReg, '');

        if (!suffixReg.test(path)) {
            path += '.js';
        }

        return path;
    }

// 取路径的文件夹名字
    function dirname(path) {
        var m = path.match(dirnameReg);
        return m ? m[0] : "./";
    }

// url是id
    function id2Url(url, baseUrl) {
        url = fixPath(url);//fixPath会将a.b.c这样的路径转换成a/b/c之类的
        if (baseUrl) {
            url = fixPath(dirname(baseUrl) + url);
        }
        if (CONFIG.urlArgs) {
            url += CONFIG.urlArgs;
        }
        return url;
    }

    /**
     * load script
     * @param  {String}   url      script path
     * @param  {Function} callback function called after loaded
     */
    //  加载url的script，并在document上创建script节点，一般外域用script节点，如果是域内，则可以用ajax异步加载
    function loadScript(url, callback) {
        var node = document.createElement('script');
        var supportOnload = 'onload' in node;

        node.charset = CONFIG.charset || 'utf-8';
        node.setAttribute('data-module', url);

        // bind events
        if (supportOnload) {
            node.onload = function() {
                onload();
            };
            node.onerror = function() {
                onload(true);
            };
        } else {
            // https://github.com/requirejs/requirejs/blob/master/require.js#L1925-L1935
            node.onreadystatechange = function() {
                if (/loaded|complete/.test(node.readyState)) {
                    onload();
                }
            }
        }

        node.async = true;
        node.src = url;

        // For some cache cases in IE 6-8, the script executes before the end
        // of the appendChild execution, so to tie an anonymous define
        // call to the module name (which is stored on the node), hold on
        // to a reference to this node, but clear after the DOM insertion.
        currentlyAddingScript = node;

        // ref: #185 & http://dev.jquery.com/ticket/2709
        baseElement ? head.insertBefore(node, baseElement) : head.appendChild(node);

        currentlyAddingScript = null;

        function onload(error) {
            // ensure only execute once
            node.onload = node.onerror = node.onreadystatechange = null;
            // remove node
            head.removeChild(node);//TODO:这里无法理解，为何要remove呢？
            node = null;
            callback(error);
        }
    }

    function getScripts() {
        return document.getElementsByTagName('script');
    }

    /**
     * get the current running script
     script.readyState可以是如下值
     “uninitialized” – 原始状态
“loading” – 下载数据中..
“loaded” – 下载完成
“interactive” – 还未执行完毕.
“complete” – 脚本执行完毕.
     */
    //  获取当前正在运行的脚本
    function getCurrentScript() {
        if (currentlyAddingScript) {
            return currentlyAddingScript;
        }

// 在IE6-8浏览器中，某些缓存会导致结点一旦插入就立即执行脚本
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

// document.currentScript returns the <script> element whose script is currently being processed.
        if (document.currentScript) {
            return (interactiveScript = document.currentScript);
        }

// 寻找到那个当前状态是interactive的为currentScript----->document.currentScript有可能返回不到吗？
        eachReverse(getScripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    /// check deps and make it valid
    /// Where do we need to check:
    /// 1. Constructor
    /// 2. Instance.save(deps)
    var rUrl = /\//; // /^\.{0,2}\//;
    var rAbsoluteUrl = /^\/|^https?:\/\//;
    function getValidDeps(deps, baseUrl) {
        var validDeps = [];
        each(deps, function(d) {
            validDeps.push(genValidUrl(d, dirname(baseUrl)));//获取url是valid的deps
        });
        return validDeps;
    }

    // CONFIG对应require.config
    function genValidUrl(url, baseUrl) {//url是个id吧，不一定是url
        var shim = CONFIG.shim[url], inPaths;
        if (CONFIG.paths[url]) {
            url = CONFIG.paths[url];
            inPaths = true;
        }
        if (rAbsoluteUrl.test(url)) {//如果url是http开头的absolute url
            url = id2Url(url); // prevent use baseUrl
        } else if (rUrl.test(url)) {//相对路径
            url = id2Url(url, inPaths ? CONFIG.baseUrl : baseUrl);
        }
        /*
        http://www.ruanyifeng.com/blog/2012/11/require_js.html
        理论上，require.js加载的模块，必须是按照AMD规范、用define()函数定义的模块。但是实际上，虽然已经有一部分流行的函数库（比如jQuery）符合AMD规范，更多的库并不符合。那么，require.js是否能够加载非规范的模块呢？
        回答是可以的。
        这样的模块在用require()加载之前，要先用require.config()方法，定义它们的一些特征。
        */
        if (shim && !SHIMMAP[url]) {//NOTE: SHIMMAP是干嘛用的？shim专门用来定义不规范的模块
            SHIMMAP[url] = shim;//TODO:临时存url和不规范的url吗？
        }
        return url;
    }

// 定义Module类
    function Module(url, deps) {
        this.url = url;
        this.dependencies = [];                    // dependencies instance list
        this.refs = [];                            // ref/dependents list, when the module loaded, notify them
        this.deps = getValidDeps(deps || [], url); // dependencies (ids) list

        this.exports = {};//TODO:exports一般用来干嘛的？
        this.status = Module.STATUS.INITIAL;//初始状态
    }

    // status of module
    var STATUS = Module.STATUS = {
        // init, moudle created
        INITIAL: 0,
        // fetch, when fetch source code
        FETCH: 1,
        // save, save dependencies info
        SAVE: 2,
        // load, parse dependencies info, resolve dependencies
        LOAD: 3,
        // executing moudle, exports still unusable
        EXECUTING: 4,
        // executed, exports is ready to use
        EXECUTED: 5,
        // error, module is invalid
        ERROR: 6
    };

// 定义Module的成员函数——采用prototype方式
    Module.prototype = {
        constructor: Module,

// 加载mod相关的deps，并各自生成完整的mod对象
        load: function() {
            var mod = this;
            var args = [];//TODO:存储了什么？

            if (mod.status >= STATUS.LOAD) return mod;

            mod.status = STATUS.LOAD;
            // instantiate module's dependencies
            mod.resolve();//实例化所有dependencies——生成Module实例
            // set every dependency's ref, so dependency can notify the module when dependency loaded
            mod.setDependents();//将当前mod作为其所有depndencies的ref，以便于后期notification
            // try to resolve circular dependency
            mod.checkCircular();//循环引用解决

            // about to execute/load dependencies
            each(mod.dependencies, function(dep) {
                if (dep.status < STATUS.FETCH) {
                    dep.fetch();
                } else if (dep.status === STATUS.SAVE) {
                    dep.load();
                } else if (dep.status >= STATUS.EXECUTED) {
                    args.push(dep.exports);//TODO:args用来干嘛？
                }
            });

            mod.status = STATUS.EXECUTING;

            // means load all dependencies
            if (args.length === mod.dependencies.length) {
                args.push(mod.exports);
                mod.makeExports(args);//makeExports将module的函数执行一遍，如此导出了module中exports的对象
                mod.status = STATUS.EXECUTED;
                // the current module is ready, notify its dependents (other module depend on the module)
                mod.notifyDependents();
            }
        },

        /**
         * init/instantiate module's dependencies
         */
        resolve: function() {
            var mod = this;
            // we must check deps here.
            // 遍历deps的url，并根据url生成mod作为dep放入mod的dependencies的依赖数组中
            each(mod.deps, function(url) {
                var m = Module.get(url);//retrive module of url, create it if not exists根据url懒加载获取mod
                mod.dependencies.push(m);
            });
        },

        /**
         * set the module itself as every dependency's dependent
         *
         * push the module self to every dependency's ref list
         */
        setDependents: function() {
            var mod = this;
            each(mod.dependencies, function(dep) {
                var exist = false;
                each(dep.refs, function(ref) {
                    if (ref === mod.url) return (exist = true);
                });
                // if dependency's ref doesn't include the module, include it.
                if (!exist) dep.refs.push(mod.url);
            });
        },

        /**
         * try to resolve circular dependency
         */
        checkCircular: function() {
            var mod = this;
            var isCircular = false, args = [];
            each(mod.dependencies, function(dep) {
                if (dep.status !== STATUS.EXECUTING) return;

                // check circular dependency
                isCircular = false;
                each(dep.dependencies, function(m) {
                    // exist circular dependency
                    if (m.url === mod.url) return (isCircular = true);
                });
                if (!isCircular) return;
                // try to resolve circular dependency
                each(dep.dependencies, function(m) {
                    if (m.url !== mod.url && m.status >= STATUS.EXECUTED) {
                        args.push(m.exports);
                    } else if (m.url === mod.url) {
                        args.push(undefined);
                    }
                });
                if (args.length !== dep.dependencies.length) return;
                // pass exports as the last argument
                args.push(dep.exports);
                try {
                    // in fact, sometimes we just can run factory without certain dependency's exports
                    // so we just make it undefined.
                    dep.exports = isFunction(dep.factory) ? dep.factory.apply(root, args) : dep.factory;
                    dep.status = STATUS.EXECUTED;
                } catch (e) {
                    dep.exports = undefined;
                    dep.status = STATUS.ERROR;
                    makeError("Can't fix circular dependency", mod.url + " --> " + dep.url);
                }
            });
        },

        /**
         * generate exports for the module
         *
         * @param  {Array} args arguments for module's factory (dependencies' exports and the module's own exports)
         */
        makeExports: function(args) {
            var mod = this;
            var result = isFunction(mod.factory) ? mod.factory.apply(root, args) : mod.factory;
            // as we know, the default `mod.exports` is `{}`
            mod.exports = isPlainObject(mod.exports) ? result : mod.exports;
        },

        /**
         * notify the module's dependents after the module is executed
         */
        notifyDependents: function() {
            var mod = this;

            each(mod.refs, function(ref) {
                var args = [];
                ref = Module.get(ref);

                each(ref.dependencies, function(m) {
                    if (m.status >= STATUS.EXECUTED) args.push(m.exports);
                });

                if (args.length === ref.dependencies.length) {
                    args.push(ref.exports);//将exports的对象作为ref的callback（factory）回调的参数
                    ref.makeExports(args);
                    ref.status = STATUS.EXECUTED;
                    ref.notifyDependents();
                } else {
                    ref.load();
                }
            });
        },

        /**
         * request the module's source code (<script>)
         */
        fetch: function() {
            var mod = this;

            if (mod.status >= STATUS.FETCH) return mod;
            mod.status = STATUS.FETCH;

// 加载script，并生成document.script对象
            loadScript(mod.url, function(error) {
                mod.onload(error);//脚本下载成功后回调onload成员函数
            });
        },

        /**
         * callback for source code loaded脚本下载成功后的回调
         * @param  {Boolean} error whether failed when load module
         */
        onload: function(error) {
            var mod = this;
            var shim, shimDeps;

// TODO:失败后的处理。mod.exports = undefined会有何影响呢？
            if (error) {
                mod.exports = undefined;
                mod.status = STATUS.ERROR;
                mod.notifyDependents();
                return mod;
            }

            // not standard amd module
            shim = SHIMMAP[mod.url];
            if (shim) {
                shimDeps = shim.deps || [];//shim也是有依赖的
                ///
                ///
                /// should verify shimDeps
                ///
                ///
                mod.save(shimDeps);//将shimDeps保存至mod.dependencies中
                // TODO:factory是用来干嘛的?
                // 整个流程其实就是加载主模块（data-main指定的模块，里面有require调用），
                // 然后加载require的依赖模块，当所有的模块及其依赖模块都已加载完毕，执行require调用中的factory方法。
                mod.factory = function() {
                    return getGlobal(shim.exports);//TODO:获取a.b.c中的c?有何意义？
                };
                //NOTE: 先fetch后load，fetch后先生成dep的mod实例，然后分别load其deps
                // in fact the module source is loaded, next is resolve dependencies and more
                mod.load();
            }

            // anonymous module
            // TODO:匿名模块，这是用来干嘛的？
            if (anonymousMeta) {
                mod.factory = anonymousMeta.factory;
                mod.save(anonymousMeta.deps);
                mod.load();
                anonymousMeta = null;
            }
        },

        /**
         * save/update deps
         * @param  {Array} deps the dependencies for the module
         */
        //  保存deps至当前的mod.dependencies中
        save: function(deps) {
            var mod = this;
            if (mod.status >= STATUS.SAVE) return mod;

            mod.status = STATUS.SAVE;
            deps = getValidDeps(deps, this.url);
            each(deps, function(d) {
                var exist = false;
                // 判断需要保存的deps是否已经在当前mod的deps中了
                each(mod.dependencies, function(d2) {
                    if (d === d2.url) return (exist = true);
                });

                if (!exist) {
                    mod.deps.push(d);//如果不是exist，则保存
                }
            });
        }
    };

    /**
     * retrive module of url, create it if not exists
     *
     * @param  {String} url  url of the module
     * @param  {Array}  deps dependencies list
     * @return {Object}      the created module
     */
    Module.get = function(url, deps) {
        return MODULES[url] || (MODULES[url] = new Module(url, deps));
    };
    // Module.get = function(id, deps) {
    //     return MODULES[id] || (MODULES[id] = new Module(id, deps));
    // };

    /**
     * generate unique id
     */
    Module.guid = function() {
        return 'uid_' + (+new Date()) + (Math.random() + '').slice(-4);
    };

    /**
     * load module
     *
     * @param {Array}    ids      dependencies list
     * @param {Function} callback callback after load all dependencies
     * @param {String}   id       id for the module
     */
    Module.use = function(ids, callback, id) {
        var url = id2Url(id, CONFIG.baseUrl);
        var mod = Module.get(url, isString(ids) ? [ids] : ids);//构建当前module（url是模块的url，ids是其deps）
        mod.id = id;
        mod.factory = callback;//TODO:factory在何时会被使用呢？
        // after prepare, really load the script/module
        mod.load();
    };

    /**
     * initial amd loader
     *
     * 1. get <script> element of currently executing script, aka script of this file
     * 2. retrive src, data-main attrs
     * 3. init main module
     */
    Module.init = function() {
        var script, scripts, initMod, url;

        if (document.currentScript) {
            script = document.currentScript;
        } else {
            // in normal case, current script should be the last script element of all scripts
            scripts = getScripts();
            script = scripts[scripts.length - 1];
        }

/*
data-main属性的作用是，指定网页程序的主模块。在上例中，就是js目录下面的main.js，这个文件会第一个被require.js加载。
由于require.js默认的文件后缀名是js，所以可以把main.js简写成main。
main函数一般写法，参考http://www.ruanyifeng.com/blog/2012/11/require_js.html
require()函数接受两个参数。第一个参数是一个数组，表示所依赖的模块，上例就是['moduleA', 'moduleB', 'moduleC']，即主模块依赖这三个模块；第二个参数是一个回调函数，当前面指定的模块都加载成功后，它将被调用。加载的模块会以参数形式传入该函数，从而在回调函数内部就可以使用这些模块。
require()异步加载moduleA，moduleB和moduleC，浏览器不会失去响应；它指定的回调函数，只有前面的模块都加载成功后，才会运行，解决了依赖性的问题。
*/
        initMod = script.getAttribute('data-main');
        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        url = script.hasAttribute ? script.src : script.getAttribute('src', 4);
        CONFIG.baseUrl = dirname(initMod || url);
        // load Main Module
        if (initMod) {
            // When main module exists, we retrive basedir from it (and set CONFIG.baseUrl), and then
            // `id2Url` will duplicate the basedir. Just fix by pre-remove it.
            // noop不做任何事情的callback
            // 这里构建当前module，并且加载其所有的deps，这个函数调用结束后则真个module都已经加载了
            Module.use(initMod.replace(new RegExp(CONFIG.baseUrl), '').split(','), noop, Module.guid());
        }
        scripts = script = null;
    };

// 定义一个模块的写法，模块定义好后，通过require来加载
    /**
     * define an amd module
     * @param  {String}   id      id
     * @param  {Array}    deps    dependencies
     * @param  {Function} factory factory function
    //  factory表示module中真正export的功能模块，其实是代码
     */
    var define = function(id, deps, factory) {
        var currentScript, mod, url;
        // define(factory)
        if (isFunction(id)) {
            factory = id;
            deps = [];
            id = undefined;
        }
        // define(deps, factory)
        else if (isArray(id)) {
            factory = deps;
            deps = id;
            id = undefined;
        }

        if ((currentScript = getCurrentScript())) {
            url = currentScript.getAttribute('data-module');
        }

        if (url) {
            mod = Module.get(url);//构建当前module
            if (!mod.id) {
                mod.id = id || url;
            }
            mod.factory = factory;
            mod.save(deps);
            mod.load();//当前模块会被加载
        } else {
            // anonymouse module, set anonymousMeta for MoudleInstance.onload execute
            anonymousMeta = {
                deps: deps,
                factory: factory
            };
        }
    };

    // amd flag
    define.amd = {};

    /**
     * require
     * implictly create a module
     *
     * @param  {Array}    ids      dependencies
     * @param  {Function} callback callback
     例子：
     // main.js
　　require(['moduleA', 'moduleB', 'moduleC'], function (moduleA, moduleB, moduleC){
　　　　// some code here
　　});
     */
    //  callback就是factory，会在makeExports函数中通过apply来调用
    var require = function(ids, callback) {
        if (isString(ids)) {
            makeError('Invalid', 'ids can\'t be string');
        }

        if (isFunction(ids)) {
            callback = ids;
            ids = [];
        }

        Module.use(ids, callback, Module.guid());
    };

// NOTE:这个函数在何处被调用？在main中被执行，见test-main.js
    require.config = function(config) {
        if (!config) return;
        // ensure baseUrl end with slash
        if (config.baseUrl) {
            if (config.baseUrl.charAt(config.baseUrl.length - 1) !== '/') config.baseUrl += '/';
        }
        mixin(CONFIG, config);
    };

    // export to root
    root.define = define;//root就是this
    root.require = require;//导出define和require两个函数给全局使用

    // start amd loader
    Module.init();
})(this);
