'use strict';

let format = require('string-template');
let _ = require('lodash');
let uuid = require('uuid');

const PATH = require('path');

const TEN_SECONDS = 10000;
const EXTENSIONS = /\.(json|xml|html|js)$/;

let toss = module.exports.toss = function (message) {
  let e = Error(message);
  throw e;
};

module.exports.checkpoint = function (condition, error) {
  if (!condition) toss(error);
  return {
    and: module.exports.checkpoint
  };
};

module.exports.standardizeReqOpts = function (config) {
  return {
    prime: function (opts, method) {
      opts = opts || {};

      if (!(opts.headers || opts.body || opts.qs || opts.parameters)) {
        let newOpts = {};
        if (method === 'get') {
          newOpts.qs = _.clone(opts);
        } else {
          newOpts.body = _.clone(opts);
        }

        opts = newOpts;
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


        opts.path = _.clone(opts.namespace = opts.path || opts.namespace);

        // support `.` delimited
        let pathSplit = opts.path.split('.');
        if (config.prefix) pathSplit.unshift(config.prefix);
        if (EXTENSIONS.test(opts.path)) {
          let extension = pathSplit.pop();
          opts.path = pathSplit.join('/');
          opts.path = opts.path + '.' + extention;
        } else {
          opts.path = pathSplit.join('/');
        }
        opts.path = opts.path.replace(/\/\//, '/')
      }

      return opts;
    }
  };
};

module.exports.PromiseManager = function (opts) {
  opts = opts || {};
  opts.timeout = opts.timeout || {};
  this.promises = {};
  this.timeout = {};
  this.timeout.duration = opts.timeout.duration || TEN_SECONDS;
  this.timeout.message = opts.timeout.message || 'Request Timeout';
};

module.exports.PromiseManager.prototype = {
  manage: function (resolve, reject, timeoutMessage) {
    let manager = this;
    let id = uuid.v4();
    manager.promises[id] = {
      resolve: resolve,
      reject: reject,
      isResolved: false,
      timeoutId: setTimeout(function () {
        if (manager.promises[id] && !manager.promises[id].isResolved) {
          reject(Error(timeoutMessage || this.timeout.message));
        }
      }, manager.timeout.duration)
    };
    return {
      id: id,
      resolve: function (data) {
        manager.resolve(id, data);
      },
      reject: function (error) {
        manager.reject(id, error);
      },
    };
  },
  lookup: function (id) {
    let promise = this.promises[id] || {};
    return promise.resolve && promise.reject ? promise : false;
  },
  resolve: function (id, data) {
    let promise = this.lookup(id);
    clearTimeout(promise.timeoutId);
    let result = promise ? promise.resolve(data) : false;
    delete this.promises[id];
    return result || false;
  },
  reject: function (id, error) {
    let promise = this.lookup(id);
    clearTimeout(promise.timeoutId);
    let result = promise ? promise.reject(error) : false;
    delete this.promises[id];
    return result || false;
  }
};
