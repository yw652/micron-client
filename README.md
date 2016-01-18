# Micron Client

[![npm](https://img.shields.io/npm/l/express.svg)](https://github.com/johnhof/micron-client/blob/master/LICENSE)  [![Dependencies](https://img.shields.io/david/johnhof/micron-client.svg)](https://david-dm.org/johnhof/micron-client) [![Join the chat at https://gitter.im/johnhof/micron-client](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/johnhof/micron-client?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Client for interaction between [micron](https://github.com/johnhof/micron) based microservices.

The goal of micron is to simplify construction and communication between micro-services, regardless of the communication method. The client and service currently support communication over [REST/HTTP](http://www.restapitutorial.com/lessons/whatisrest.html), [ØMQ](http://zeromq.org/), and others.

`$ npm install --save micron-client`

<img src="http://i.imgur.com/fm46NVd.png?1" width="400">

# Key

- [Usage](#usage)
  - [Spot](#spot)
  - [Middleware](#middleware)
- [Operations](#operations)
  - [.request](#request)
  - [.create/.post](#create/post)
  - [.read/.get](#read/get)
  - [.update/.put](#update)
  - [.destroy/.delete](#destroy/delete)
- [Contributing](#contibuting)
- [Authors](#authors)

# Usage

## Spot

- should be used in a shared fashion to prevent constant socket connection overhead

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

let result = yield client.userService.post('user/create', {ß
  email: 'test@tester.com',
  password: 'Tester@1'
});
```

## Middleware

- Allows sockets to stay open for server duration

```javascript
let micron = require('micron-client');
let config = require('./services.json');

// koa

let koa = require('koa');
let koaApp = koa();

koaApp.use(micron.middleware.koa());
koaApp.listen(8000)


// express

Â express = require('express');
let expressApp = express();

expressApp.use(micron.middleware.express());
expressApp.listen(8000)
```

# Operations

## .request

- Follows the object structure of the [request](https://www.npmjs.com/package/request#request-options-callback) module's base request builder
  - The only major change is that the url and host are pulled from the config. The `opts.path` method should be used instead
- All other operations are simply wrappers of this function
- Important notes
  - `opts.path` should be used instead of `opts.url` (the host and port are added from the resource config)
  - No `opts.method` defaults to `GET`
  - the `opts.path` string can use templates using keys on from the `opts.parameters` object
  - `form` is aliased as `body`
  - All requests default to type JSON

```javascript
yield client.someMicronService.request({
  method: 'post',
  path: '/foo/{foo_id}',
  parameters: {
    foo_id: 'FooId12345'
  },
  body: {
    foo_property: 'bar'
  },
  qs: {
    foo_query: 'bar'
  }
});
```

## .create/.post

- Wraps [.request](#request)
- Takes arguments `(path, opts)`
  - `path`
    - Prefixed with the `host`, `port`, and `prefix` from the resource config
    - Supports templating with `{KEY}` against `opts.parameters`
  - `opts`
    - If no `parameters`, `body`, `qs`, or `headers` param exists, the object will be set as the body/form

```javascript
yield client.someMicronService.post('/foo/FooId12345', {
  foo_property: 'bar'
});

// OR

yield client.someMicronService.post('/foo/{foo_id}', {
  parameters: {
    foo_id: 'FooId12345'
  },
  body: {
    foo_property: 'bar'
  }
});
```

## .read/.get

- Wraps [.request](#request)
- Takes arguments `(path, opts)`
  - `path`
    - Prefixed with the `host`, `port`, and `prefix` from the resource config
    - Supports templating with `{KEY}` against `opts.parameters`
  - `opts`
    - If no `parameters`, `body`, `qs`, or `headers` param exists, the object will be set as the body/form

```javascript
yield client.someMicronService.get('/foo/FooId12345?foo_query=bar');

// OR

yield client.someMicronService.get('/foo/{foo_id}', {
  parameters: {
    foo_id: 'FooId12345'
  },
  qs: {
    foo_query: 'bar'
  }
});
```

## .update/.put

- Wraps [.request](#request)
- Takes arguments `(path, opts)`
  - `path`
    - Prefixed with the `host`, `port`, and `prefix` from the resource config
    - Supports templating with `{KEY}` against `opts.parameters`
  - `opts`
    - If no `parameters`, `body`, `qs`, or `headers` param exists, the object will be set as the body/form

```javascript
yield client.someMicronService.put('/foo/FooId12345', {
  foo_property: 'bar'
});

// OR

yield client.someMicronService.put('/foo/{foo_id}', {
  parameters: {
    foo_id: 'FooId12345'
  },
  body: {
    foo_property: 'bar'
  }
});
```

## .destroy/.delete

- Wraps [.request](#request)
- Takes arguments `(path, opts)`
  - `path`
    - Prefixed with the `host`, `port`, and `prefix` from the resource config
    - Supports templating with `{KEY}` against `opts.parameters`
  - `opts`
    - If no `parameters`, `body`, `qs`, or `headers` param exists, the object will be set as the body/form

```javascript
yield client.someMicronService.delete('/foo/FooId12345', {
  foo_property: 'bar'
});

// OR

yield client.someMicronService.delete('/foo/{foo_id}', {
  parameters: {
    foo_id: 'FooId12345'
  },
  body: {
    foo_property: 'bar'
  }
});
```

## .status

- Performs a `GET /status` on the service
- The service will perform a `GET /status` on all of its dependent services
- All ternary dependencies will be ignored to prevent a loop back  
- Calling `Status` directly on micron-client will get the status of all registered services
- Takes arguments [`timeout`]
  - `timeout`
    - timeout in milliseconds for each status request

```javascript
// singular status
yield client.someMicronService.status();

// all status's
yield client.status();
```
# Contributing

Add new clients to the `./lib/clients` directory as an independant file. Each client should support all operations above

#### Requirements

- the `opts` patameter of each request should follow the [request module](https://www.npmjs.com/package/request) structure
  - rather than `url`, a `path` parameter is expected
  - the path parameter should be used to map functionality of the service client being written
- the `path` parameter should template properties of `opts.pathOpts` matching`{OPT_NAME}`

# Authors

- [John Hofrichter](https://github.com/johnhof)
