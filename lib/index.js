'use strict';

let buildConfig = require('./config_builder');
let clients = require('./clients');
let _ = require('lodash');
let helpers = require('./helpers');

let toss = helpers.toss;

module.exports = function (config) {
  config = buildConfig(config);
  let client = {};
  _.each(config.resources, function (settings, name) {
    settings.method = settings.method || 'http';
    if (!_.isFunction(clients[settings.method])) toss('Attempted to use unsupported method [' + settings.method + ']');
    client[name] = clients[settings.method](settings);
  });

  return client;
};
