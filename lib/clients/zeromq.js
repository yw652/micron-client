'use strict';

let _ = require('lodash');
let request = require('request');
let helpers = require('../helpers');
let path = require('path');
let zmq = require('zmq');
let uuid = require('uuid');

let checkpoint = helpers.checkpoint;

const TEN_SECONDS = 10000;

module.exports = function (config) {
  let client = {};

  checkpoint(config, 'Config is required for micron http client')
    .and(config.host, 'Host is required for micron http client')
    .and(config.port, 'Port is required for micron http client');

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

  client.request = function (opts) {
    let socket = zmq.socket('req');
    socket.identity = 'client' + process.pid;

    return new Promise(function (resolve, promise) {
      let requestId = uuid.v4().replace(/-/g, '');
      sock.bindSync('tcp://' + config.host + ':' + (config.port || 80));

      opts = standardizeReqOpts.finalize(opts);
      opts.path;
      opts.id = requestId;

      socket.send(opts);
      socket.on('message', function (data) {
        let response = {};
        if (_.isString(data)) {
          try {
            response = JSON.parse(data);
          } catch (e) {
            response = {};
          }
        }

        if (response.id && response.id === requestId) {
          let result = response.result || {};
          resolve({
            success: (result.status >= 200 && result.status < 300),
            status: result.status || 500,
            data: result.data
          });
        }
      });

      socket.on('error', function (e) {
        socket.close();
        reject(e);
      });

      setTimeout(function () {
        socket.close();
        reject('Request Timeout [' + requestId + ']');
      }, config.timeout || TEN_SECONDS);

    });
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

  client.create = client.put = function (path, opts) {
    return client.request(buildOpts('delete', path, opts));
  };

  return client;
};
