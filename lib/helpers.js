'use strict';

let format = require('string-template');
let _ = require('lodash');
let path = require('path');

const EXTENSIONS = /\.(json|xml|html|js)$/;

let toss = module.exports.toss = function (message) {
  let e = Error(message);
  throw e;
};

module.exports.checkpoint = function (condition, error) {
  if (!condition) toss(error);
  return { and : module.exports.checkpoint };
};

module.exports.standardizeReqOpts = function (config) {
  return {
    prime: function (opts) {
      opts = opts || {};

      if (!(opts.headers || opts.form || opts.query)) {
        if (opts.method === 'get') {
          opts.query = _.clone(opts);
        } else {
          opts.form = _.clone(opts);
        }
      }

      if (config.headers) opts.headers = _.defaults(opts.headers || {}, config.headers);
      if (config.data) opts.data = _.defaults(opts.data || {}, config.data);
      if (config.query) opts.query = _.defaults(opts.query || {}, config.query);

      if (config.timeout && !opts.timeout) opts.timeout = config.timeout;
      if (config.json !== false) opts.json = true;

      opts.headers = opts.headers || {};
      opts.data = opts.data || {};
      opts.query = opts.query || {};

      return opts;
    },
    finalize: function (opts) {

      if (opts.path) {
        if (~opts.path.indexOf('{')) {
          opts.path = format(opts.path, opts.pathOpts);
          if (~opts.path.indexOf('{')) toss('Path template missing properties: ' + opts.path);
        }

        if (config.prefix) opts.path = config.prefix + '.' + opts.path;

        opts.path = _.clone(opts.namespace = opts.path || opts.namespace);

        // support `.` delimited
        let pathSplit = opts.path.split('.');
        if (EXTENSIONS.test(opts.path)) {
          let extension = pathSplit.pop();
          opts.path = pathSplit.join('/');
          opts.path = opts.path + '.' + extention;
        } else {
          opts.path = pathSplit.join('/');
        }
      }

      return opts;
    }
  };
};
