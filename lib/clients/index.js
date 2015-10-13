'use strict';

let _ = require('lodash');
let fs = require('fs');

let clients = {};

let clientDir = fs.readdirSync(__dirname);

_.each(clientDir, function (fileName) {
  if (/\.js$/.test(fileName) && fileName !== 'index.js') {
    clients[fileName.replace(/\.js$/, '')] = require('./' + fileName);
  }
});

module.exports = clients;
