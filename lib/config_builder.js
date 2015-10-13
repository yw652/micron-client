'use strict';

let _ = require('lodash');

module.exports = function (config) {
  config = config || {};
  config.resources = config.resources || _.clone(config);
  return config;
};
