'use strict';

let _ = require('lodash');
let request = require('request');
let helpers = require('../helpers');
let path = require('path');

let checkpoint = helpers.checkpoint;

module.exports = function (config) {
  let client = {};

  checkpoint(config, 'Config is required for micron http client')
    .and(config.host, 'Host is required for micron http client')
    .and(config.port, 'Port is required for micron http client');

  let baseUrl = (config.ssl  || (config.protocol === 'https') ? 'https://' : 'http://') + config.host;
  if (config.port) baseUrl = baseUrl + ':' + config.port;

  let standardizeReqOpts = helpers.standardizeReqOpts(config);

  let buildOpts = function (method, path, opts) {
    checkpoint(path, 'Path/Namespace is required for request');
    opts = standardizeReqOpts.prime(opts, method);
    opts.path = path;
    opts.method = method;
    return opts;
  };

  //
  // Core request
  //

  client.request = function (opts) {
    return new Promise(function (resolve, reject) {
      opts = standardizeReqOpts.finalize(opts);

      opts.url = baseUrl + path.join('/', opts.path);
      request(opts, function (err, response, body) {
        if (err) return reject(err);

        let result = {};
        if (body) {
          // result.status = body.status || response.statusCode;
          // result.success = body.success || (result.status >= 200 && result.status < 300);
          // result.data = body.data || body;
	  result = body;
        } else {
          result = {
            success: (response.statusCode >= 200 && response.statusCode < 300),
            status: response.statusCode || 500,
            data: {}
          };
        }

        resolve(result);
      });
    });
  };

  //
  // Status
  //

  client.status = function (opts) {
    return client.request(buildOpts('get', 'status', _.defaultsDeep(opts, {
      qs: {
        shallow: true
      }
    })));
  };

  //
  // Create/Post
  //

  client.create = client.post = function (path, opts) {
    return client.request(buildOpts('post', path, opts));
  };

  //
  // Read/Get
  //

  client.read = client.get = function (path, opts) {
    return client.request(buildOpts('get', path, opts));
  };

  //
  // Update/Put
  //

  client.update = client.put = function (path, opts) {
    return client.request(buildOpts('put', path, opts));
  };

  //
  // Destroy/Delete
  //

  client.destroy = client.delete = function (path, opts) {
    return client.request(buildOpts('delete', path, opts));
  };

  return client;
};
