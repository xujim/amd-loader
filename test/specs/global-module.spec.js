define(['notAmd'], function (notAmd) {
    describe('Not standard module (export to global)', function () {
        it('should load dependency successfully.', function () {
            expect(notAmd()).toEqual('Not amd module!');
        });
    });
});
