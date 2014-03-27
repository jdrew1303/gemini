'use strict';

var url = require('url'),
    path = require('path'),
    fs = require('q-io/fs'),
    yaml = require('js-yaml'),
    inherit = require('inherit'),
    GeminiError = require('./gemini-error'),

    DEFAULT_SCREENSHOTS_DIR = 'gemini/screens';

var Config = module.exports = inherit({
    __constructor: function(configPath, configText) {
        var config;
        try {
            config = yaml.load(configText);
        } catch (e) {
            throw new GeminiError('Error while parsing a config file: ' + configPath + '\n' +
                    e.reason + ' ' + e.mark,
                    'Gemini config should be valid YAML file.'
            );
        }
        this.root = path.dirname(configPath);
        this.rootUrl = config.rootUrl;

        if (!this.rootUrl) {
            throw new GeminiError(
                'Required field "rootUrl" is not specified in config file: ' + configPath,
                '"rootUrl" should point to the root of website under test.\nPlans URLs are resolved relative to it.'
            );
        }
        this.gridUrl = config.gridUrl;
        this.browsers = config.browsers || ['phantomjs'];

        if (this._requiresGrid() && !this.gridUrl) {
            throw new GeminiError(
                'Field "gridUrl" is required for using non-phantomjs browsers',
                [
                    'Specify selenium grid URL in your config file or use only',
                    'phantomjs browser.',
                    'Selenium server installation instructions:',
                    '',
                    'https://code.google.com/p/selenium/wiki/Grid2'
                ].join('\n')
            );
        }

        this.screenshotsDir = path.resolve(this.root,
            config.screenshotsDir || DEFAULT_SCREENSHOTS_DIR);
    },

    _requiresGrid: function() {
        return this.browsers.some(function(browser) {
            return  browser !== 'phantomjs';
        });
    },

    getAbsoluteUrl: function getAbsoluteUrl(relUrl) {
        return url.resolve(this.rootUrl, relUrl);
    },

    getScreenshotsDir: function(name, state) {
        return path.resolve(this.screenshotsDir, name, state);
    },

    getScreenshotPath: function getScrenshotPath(name, state, browser) {
        return path.join(this.getScreenshotsDir(name, state), browser + '.png');
    }
}, {
    read: function read(configPath) {
        return fs.read(configPath)
            .then(function(content) {
                return new Config(configPath, content);
            })
            .fail(function(e) {
                if (e.code === 'ENOENT') {
                    throw new GeminiError(
                        'Config file does not exists: ' + configPath,
                        'Specify config file or configure your project by following\nthe instructions:\n\n' +
                        'https://github.com/SevInf/gemini#configuration'
                    );
                }
                throw e;
            });
    }
});