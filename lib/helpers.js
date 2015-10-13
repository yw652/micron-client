'use strict';

let format = require('string-template');
let _ = require('lodash');

let toss = module.exports.toss = function (message) {
  let e = Error(message);
  throw e;
};

module.exports.checkpoint = function (condition, error) {
  if (!condition) toss(error);
  return { and : module.exports.checkpoint };
};

module.exports.standardizeReqOpts = function (opts) {
  opts = opts || {};

  opts.path = opts.namespace = opts.path || opts.namespace;

  if (!(opts.headers || opts.body || opts.query)) {
    if (opts.method === 'get') {
      opts.query = opts;
    } else {
      opts.body = opts;
    }
  }

  if (config.headers) opts = _.defaults(opts.headers || {}, config.headers);
  if (config.data) opts = _.defaults(opts.data || {}, config.data);
  if (config.query) opts = _.defaults(opts.query || {}, config.query);

  opts.headers = opts.headers || {};
  opts.data = opts.data || {};
  opts.query = opts.query || {};

  if (~opts.path.indexOf('{')) {
    opts.path = format(opts.path, opts.pathOpts);
    if (~opts.path.indexOf('{')) toss('Path template missing properties: ' + opts.path);
  }

  return opts;
};
