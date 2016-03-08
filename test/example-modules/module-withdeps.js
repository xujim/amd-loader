// define standard amd module
// 1. with dependency
// 2. multiple dependencies

define(['/test/example-modules/module-nodeps', '/test/example-modules/module-nodeps-useexports'], function(nodedeps, useexports) {
    return {
        say: function() {
            return 'module-withdeps say: ' + nodedeps + useexports.value;
        },
        deps: [nodedeps, useexports]
    }
});
