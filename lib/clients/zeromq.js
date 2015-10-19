'use strict';

let _ = require('lodash');
let request = require('request');
let helpers = require('../helpers');
let path = require('path');
let zmq = require('zmq');

let checkpoint = helpers.checkpoint;
let toss = helpers.toss;

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

    return new Promise(function (resolve, reject) {
      socket.bindSync('tcp://' + config.host + ':' + (config.port || 80));

      opts = standardizeReqOpts.finalize(opts);
      opts.path;

      socket.send(JSON.stringify(opts));
      socket.on('message', function (message) {
        try {
          message = JSON.parse(message.toString('utf8'));
        } catch (e) {
          toss(e);
        }

        let response = {};
        let result = message || {};
        resolve({
          success: (result.status >= 200 && result.status < 300),
          status: result.status || 500,
          data: result.data
        });
        try { socket.close(); } catch (e) {}

      });

      socket.on('error', function (e) {
        try { socket.close(); } catch (e) {}

        reject(e);
      });

      setTimeout(function () {
        try { socket.close(); } catch (e) {}

        let prettyPrint = '[' + opts.method.toUpperCase() + '] ' + config.host + ':' + config.port;
        reject(new Error('ZeroMQ Request Timeout - ' + prettyPrint + path.join('/', opts.path)));
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

  client.destroy = client.delete = function (path, opts) {
    return client.request(buildOpts('delete', path, opts));
  };

  return client;
};
