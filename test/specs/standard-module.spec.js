define(['../example-modules/module-withdeps'], function (withdeps) {
    describe('Standard AMD module', function () {
        it('should load dependency successfully.', function () {
            expect(withdeps.deps).toEqual(['this is module-nodeps.', {
                value: 'this is module-nodeps-useexports.'
            }]);
        });
        it('should run export function successfully.', function () {
            expect(withdeps.say()).toEqual('module-withdeps say: this is module-nodeps.this is module-nodeps-useexports.');
        });
    });
});
