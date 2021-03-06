'use strict';

const testsAPI = require('lib/tests-api');
const Suite = require('lib/suite');

describe('tests-api', () => {
    let rootSuite;

    beforeEach(() => {
        rootSuite = Suite.create('');
    });

    describe('.suite method', () => {
        let gemini;

        beforeEach(() => {
            gemini = testsAPI(rootSuite);
        });

        it('should throw an error if first argument is not a string', () => {
            assert.throws(() => gemini.suite(123, () => {}), TypeError);
        });

        it('should throw an error if second argument is not a function', () => {
            assert.throws(() => gemini.suite('name'), TypeError);
        });

        it('should create new suite with corresponding name', () => {
            gemini.suite('name', () => {});

            assert.equal(rootSuite.children[0].name, 'name');
        });

        it('should call callback', () => {
            const spy = sinon.spy();
            gemini.suite('name', spy);
            assert.called(spy);
        });

        it('should created nested suites when called nestedly', () => {
            gemini.suite('name', () => gemini.suite('child', () => {}));

            assert.equal(rootSuite.children[0].children[0].name, 'child');
        });

        describe('child suites of the same name', () => {
            beforeEach(() => {
                gemini = testsAPI(rootSuite, ['browser1']);
            });

            it('should not allow to create with intersect browsers', () => {
                assert.throws(() => {
                    gemini.suite('name', () => {
                        gemini.suite('child', () => {});
                        gemini.suite('child', () => {});
                    });
                });
            });

            it('should allow to create with not intersecting browser sets', () => {
                gemini.suite('name', () => gemini.suite('child', () => {}));

                gemini = testsAPI(rootSuite, ['browser2']);

                assert.doesNotThrow(() => {
                    gemini.suite('name', () => {
                        gemini.suite('child', () => {});
                    });
                });
            });
        });

        it('should create non-nested suite at the root level', () => {
            gemini.suite('first', () => {});
            gemini.suite('second', () => {});

            assert.equal(rootSuite.children[1].name, 'second');
        });

        it('should throw when suite has states but does not has URL', () => {
            assert.throws(() => {
                gemini.suite('first', (suite) => {
                    suite.setCaptureElements('.element')
                         .capture('plain');
                });
            });
        });

        it('should throw when suite has no states nor URL', () => {
            assert.doesNotThrow(() => {
                gemini.suite('first', (suite) => {
                    suite.setCaptureElements('.element');
                });
            });
        });

        it('should not throw when suite has states and url is inherited from parent', () => {
            assert.doesNotThrow(() => {
                gemini.suite('first', (suite) => {
                    suite.setUrl('/url');
                    gemini.suite('child', (suite) => {
                        suite.setCaptureElements('.element')
                             .capture('plain');
                    });
                });
            });
        });

        it('should throw if suite has states but does not has captureSelectors', () => {
            assert.throws(() => {
                gemini.suite('first', (suite) => {
                    suite.setUrl('/url')
                         .capture('plain');
                });
            });
        });

        it('should not throw if suite has no states nor captureSelectors', () => {
            assert.doesNotThrow(() => {
                gemini.suite('first', (suite) => {
                    suite.setUrl('/url');
                });
            });
        });

        it('should not throw when suite has states and captureSelectors are inherited from parent', () => {
            assert.doesNotThrow(() => {
                gemini.suite('first', (suite) => {
                    suite.setCaptureElements('.element');
                    gemini.suite('child', (suite) => {
                        suite.setUrl('/url')
                             .capture('plain');
                    });
                });
            });
        });

        it('should assign suite ids', () => {
            gemini.suite('suite', () => {});
            assert.equal(rootSuite.children[0].id, 1);
        });

        it('should assign incrementing suite ids for following suites', () => {
            gemini.suite('suite', () => {});
            gemini.suite('suite2', () => {});
            assert.equal(rootSuite.children[1].id, 2);
        });

        it('should assign incrementing suite ids for child suites', () => {
            gemini.suite('suite', () => {
                gemini.suite('suite2', () => {});
            });
            assert.equal(rootSuite.children[0].children[0].id, 2);
        });

        it('should assign child suite ids before siblings', () => {
            gemini.suite('suite', () => {
                gemini.suite('suite2', () => {});
            });

            gemini.suite('suite3', () => {});

            assert.equal(rootSuite.children[0].children[0].id, 2);
            assert.equal(rootSuite.children[1].id, 3);
        });
    });

    describe('browsers', () => {
        const browsers = ['some-browser', 'other-browser'];
        let gemini;

        beforeEach(() => {
            gemini = testsAPI(rootSuite, browsers);
        });

        it('should be set for top level suite', () => {
            gemini.suite('suite', () => {});

            assert.equal(rootSuite.children[0].browsers, browsers);
            assert.isTrue(rootSuite.children[0].hasOwnProperty('browsers'));
        });

        it('should not be set for not top level suite', () => {
            gemini.suite('suite', () => {
                gemini.suite('child', () => {});
            });

            assert.equal(rootSuite.children[0].children[0].browsers, browsers);
            assert.isFalse(rootSuite.children[0].children[0].hasOwnProperty('browsers'));
        });
    });

    describe('file path', () => {
        const file = 'path/file.js';
        let gemini;

        beforeEach(() => {
            gemini = testsAPI(rootSuite, [], file);
        });

        it('should be set for suite', () => {
            gemini.suite('suite', () => {});

            assert.equal(rootSuite.children[0].file, file);
            assert.isTrue(rootSuite.children[0].hasOwnProperty('file'));
        });

        it('should not be set for not top level suite', () => {
            gemini.suite('suite', () => {
                gemini.suite('child', () => {});
            });

            assert.equal(rootSuite.children[0].children[0].file, file);
            assert.isFalse(rootSuite.children[0].children[0].hasOwnProperty('file'));
        });
    });
});
