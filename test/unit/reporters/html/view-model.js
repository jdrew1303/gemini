'use strict';

const _ = require('lodash');
const ViewModel = require('lib/reporters/html/view-model');

describe('ViewModel', () => {
    const sandbox = sinon.sandbox.create();

    const mkViewModel_ = () =>{
        const config = {forBrowser: sandbox.stub().returns({})};
        return new ViewModel(config);
    };

    const getModelResult_ = (model) => model.getResult().suites[0].children[0].browsers[0].result;

    const stubTest_ = (opts) => {
        opts = opts || {};

        return _.defaultsDeep(opts, {
            state: {name: 'name-default'},
            suite: {
                path: ['suite'],
                metaInfo: {sessionId: 'sessionId-default'},
                file: 'default/path/file.js'
            }
        });
    };

    it('should contain "file" in "metaInfo"', () => {
        const model = mkViewModel_();

        model.addSuccess(stubTest_({
            suite: {file: '/path/file.js'}
        }));

        const metaInfo = JSON.parse(getModelResult_(model).metaInfo);

        assert.equal(metaInfo.file, '/path/file.js');
    });

    it('should contain "url" in "metaInfo"', () => {
        const model = mkViewModel_();

        model.addSuccess(stubTest_({
            suite: {fullUrl: '/test/url'}
        }));

        const metaInfo = JSON.parse(getModelResult_(model).metaInfo);

        assert.equal(metaInfo.url, '/test/url');
    });
});
