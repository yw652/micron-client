'use strict';

let _ = require('lodash');
let request = require('co-request');
let helpers = require('../helpers');
let path = require('path');

let checkpoint = helpers.checkpoint;

module.exports = function (config) {
  let client = {};

  checkpoint(config, 'Config is required for micron http client')
    .and(config.host, 'Host is required for micron http client')
    .and(config.port, 'Port is required for micron http client');

  let baseUrl = (config.ssl ? 'https://' : 'http://') + config.host;
  if (config.port) baseUrl = baseUrl + ':' + config.port;

  let standardizeReqOpts = helpers.standardizeReqOpts(config);

  let buildOpts = function (method, path, opts) {
    checkpoint(path, 'Path/Namespace is required for request');
    opts = standardizeReqOpts.prime(opts);
    opts.path = path;
    opts.method = method;
    return opts;
  };

  //
  // Core request
  //

  client.request = function *(opts) {
    opts = standardizeReqOpts.finalize(opts);

    opts.url = baseUrl + path.join('/' + opts.path);
    let response = yield request(opts);
    let result = {};
    if (response.body) {
      result.status = response.body.status || response.statusCode;
      result.success = response.body.success || (result.status >= 200 && result.status < 300);
      result.data = response.body.data || response.body;
    } else {
      result = {
        success: (response.statusCode >= 200 && response.status < 300),
        status: response.status || 500,
        data: {}
      };
    }

    return result;
  };

  //
  // Create/Post
  //

  client.create = client.post = function *(path, opts) {
    return yield client.request(buildOpts('post', path, opts));
  };

  //
  // Read/Get
  //

  client.read = client.get = function *(path, opts) {
    return yield client.request(buildOpts('get', path, opts));
  };

  //
  // Update/Put
  //

  client.update = client.put = function *(path, opts) {
    return yield client.request(buildOpts('put', path, opts));
  };

  //
  // Destroy/Delete
  //

  client.create = client.put = function *(path, opts) {
    return yield client.request(buildOpts('delete', path, opts));
  };

  return client;

};
