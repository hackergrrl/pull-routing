# pull-router

> A through pull-stream that multiplexes to several sinks based on router rules.

## Usage

```js
var Router = require('pull-router')
const pull = require('pull-stream')

const router = Router()

router.addRoute(
  x => x % 2 === 0,
  pull.drain(x => console.log('EVEN', x))
)

router.addRoute(
  x => x % 2 === 1,
  pull.drain(x => console.log('ODD', x))
)

pull(
  pull.values([0,1,2,3]),
  router
)
```

outputs

```
EVEN 0
ODD 1
EVEN 2
ODD 3
```

## API

```js
const Router = require('pull-router')
```

### `const router = Router()`

Create a new router. Acts like a pull-stream sink.

### `router.addRoute(fn, sink)`

Adds a route to the router. For data received by the router, if `fn(data)`
returns `true`, the data will go to `sink` (which can be a sink OR through
stream). 

## Behaviour Notes

- If a sink attached to a route ends or errors, that route is removed from the router.
- If the source feeding the router ends or errors, it is propagated to all sinks attached to the router.
- If more than one route matches incoming data, the route that was added earlier wins.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install pull-router
```

## License

MIT

