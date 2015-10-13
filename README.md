# Micron Client

Client for interaction between micron-based microservices

`$ npm install --save micron-client`

# TODO

- use `parameters` rather than `reqOpts`
- support `/` as a primary delimeter

# Key

- [Usage](#usage)
- [Contributing](#contibuting)
- [Authors](#authors)

# Usage

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
