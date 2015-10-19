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

      if (!(opts.headers || opts.body || opts.qs)) {
        if (opts.method === 'get') {
          opts.qs = _.clone(opts);
        } else {
          opts.body = _.clone(opts);
        }
      }

      if (config.headers) opts.headers = _.defaults(opts.headers || {}, config.headers);
      if (config.body) opts.body = _.defaults(opts.body || {}, config.body);
      if (config.qs) opts.qs = _.defaults(opts.qs || {}, config.qs);

      if (config.timeout && !opts.timeout) opts.timeout = config.timeout;
      if (config.json !== false) opts.json = true;

      opts.headers = opts.headers || {};
      opts.form = opts.body || {};
      opts.qs = opts.qs || {};

      if (opts.body) {
        delete opts.body;
      }

      return opts;
    },
    finalize: function (opts) {

      if (opts.body) {
        opts.form = opts.body;
        delete opts.body;
      }

      if (opts.path) {
        if (opts.path.indexOf('{') >= 0) {
          // verify that all parameters are accounted for
          let validate = _.clone(opts.path);
          _.each(opts.parameters, (value, key) => {
            if (!_.isUndefined(value)) {
              let regex = new RegExp('{' + key + '}');
              validate = validate.replace(regex, '');
            }
          });

          if (validate.indexOf('{') >= 0) {
            let missing = validate.match(/{.+?}/g);
            missing = (missing.join(', ')).replace(/{/g, '').replace(/}/g, '');
            toss('Path template missing parameters [' + missing + ']');
          }

          opts.path = format(opts.path, opts.parameters);
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
