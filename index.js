// This sink only reads from ITS source when ALL routes are ready & able
// to read.
//
// As in: backpressure from ANY route will cause backpressure here.
//
// If a message has no route, it will block the router until a viable route is
// added. If you don't want this, you can add a catch-all route and discard
// them.

module.exports = function () {
  let predicates = []
  let pendingRead = null

  function allRoutesReady () {
    for (var i=0; i < predicates.length; i++) {
      const route = predicates[i]
      if (!route.cb) return false
    }
    return true
  }

  const stream = function (read) {
    if (!allRoutesReady()) {
      pendingRead = () => {
        pendingRead = null
        read(null, next)
      }
    } else {
      read(null, next)
    }

    function next (abort, data) {
      // TODO: handle abort

      console.log('ROUTER: got', data)

      // check routes for a match
      let found = false
      for (var i=0; i < predicates.length; i++) {
        const route = predicates[i]
        if (route.fn(data)) {
          found = true
          pendingRead = () => {
            pendingRead = null
            read(null, next)
          }
          const cb = route.cb
          route.cb = null
          cb(null, data)
          break
        }
      }

      if (!found) {
        console.log('ROUTER: no route for data')
      }
    }
  }

  stream.addRoute = function (predicateFn, sink) {
    const route = {
      fn: predicateFn,
      sink,
      cb: null
    }
    predicates.push(route)

    sink(function (abort, cb) {
      // TODO: handle abort

      route.cb = cb

      if (allRoutesReady() && pendingRead) {
        pendingRead()
      }
    })
  }

  return stream
}
