'use strict';

let _ = require('lodash');
let request = require('request');
let helpers = require('../helpers');
let path = require('path');
let zmq = require('zmq');

let checkpoint = helpers.checkpoint;
let toss = helpers.toss;
let PromiseManager = helpers.PromiseManager;

module.exports = function (config) {
  let client = {};
  let promiseManager = new PromiseManager(config);
  let responseHandlerMap = {};

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

  let autoReconnect = true;
  let errorHandler = config.catch || function (e) {
    console.error(e.stack);
  };

  //
  // Bind the socket
  //

  let socket = zmq.socket('req');
  socket.identity = 'client' + process.pid;
  socket.bindSync('tcp://' + config.host + ':' + (config.port || 80));
  socket.on('message', function (message) {
    let json;
    try {
      json = JSON.parse(message.toString('utf8')) || {};
    } catch (e) {
      errorHandler(e);
    }

    let handler = responseHandlerMap[json.id];
    if (_.isFunction(handler)) {
      delete json.id;
      handler(json);
    } else {
      errorHandler('Socket could not map response to request: ' + message);
    }
  });

  //
  // Core request
  //

  client.request = function (opts) {
    return new Promise(function (resolve, reject) {
      opts = standardizeReqOpts.finalize(opts);

      let timeoutMessage = '[' + opts.method.toUpperCase() + '] ' + config.host + ':' + config.port;
      let promise = promiseManager.manage(resolve, reject, ('ZeroMQ Request Timeout: ' + timeoutMessage + path.join('/', opts.path)));

      opts.id = promise.id;
      opts.query = opts.query || opts.qs;
      delete opts.qs;
      socket.send(JSON.stringify(opts));
      responseHandlerMap[promise.id] = function (response) {
        if (!promise.isResolved) {
          promise.resolve({
            success: (response.status >= 200 && response.status < 300),
            status: response.status || 500,
            data: response.data
          });
        }
      };
    });
  };

  //
  // Status
  //

  client.status = function (timeout) {
    return client.request(buildOpts('get', 'status', { qs: { shallow: true }, timeout: timeout }));
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

  //
  // Close
  //

  client.close = function () {
    autoReconnect = false;
    socket.close();
  };

  return client;
};
