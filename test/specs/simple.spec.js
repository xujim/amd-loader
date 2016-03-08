define(['test/example-modules/app', 'jquery'], function (App, $) {
    describe('when the app starts', function () {
        it('outputs \'Amd Test!\' in the target', function () {
            var target = $('body');

            var app = new App(target);
            app.start();

            expect(target.html()).toEqual('Amd Test!');
        });
    });
});
