# Micron Client

Client for interaction between micron-based microservices.

The goal of micron is to simplify construction and communication between micro-services, regardless of the communication method. The client and service currently support communication over [REST/HTTP](http://www.restapitutorial.com/lessons/whatisrest.html), [ØMQ](http://zeromq.org/).

`$ npm install --save micron-client`

# TODO

- support `/` as a primary delimeter

# Key

- [Usage](#usage)
- [Contributing](#contibuting)
- [Authors](#authors)

# Usage

```javascript
let micron = require('micron-client');

let client = micron({
  userService : {
    micron: 'zeromq', // specify zeromq as the communication method
    // OR
    micron: 'http', // specify HTTP as the communication method

    prefix: 'v1', // prefix all request url's
    host: '127.0.0.1', /// host of the service
    port: 8001 // port of the service
  }
});

let result = yield client.userService.post('user/create', {
  email: 'test@tester.com',
  password: 'Tester@1'
});

```

# Contributing

Add new clients to the `./lib/clients` directory as an independant file. Each client should follow this structure

```javascript
'use strict';

module.exports = function (config) {

  // Core request
  client.request = function (opts) { /* MUST RETURN A PROMISE */ }

  // Create/Post
  client.create = client.post = function (path, opts) { /* MUST RETURN A PROMISE */ }

  // Read/Get
  client.read = client.get = function (path, opts) { /* MUST RETURN A PROMISE */ }

  // Update/Put
  client.update = client.put = function (path, opts) { /* MUST RETURN A PROMISE */ }

  // Destroy/Delete
  client.create = client.put = function (path, opts) { /* MUST RETURN A PROMISE */ }

  return client;
};
```

#### Requirements

- the `opts` patameter of each request should follow the [request module](https://www.npmjs.com/package/request) structure
  - rather than `url`, a `path` parameter is expected
  - the path parameter should be used to map functionality of the service client being written
- the `path` parameter should template properties of `opts.pathOpts` matching`{OPT_NAME}`

# Authors

- [John Hofrichter](https://github.com/johnhof)
