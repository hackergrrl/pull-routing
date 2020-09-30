// This sink only reads from ITS source when ALL routes are ready & able
// to read.
//
// As in: backpressure from ANY route will cause backpressure here.
//
// If a message has no route, it will block the router until a viable route is
// added. If you don't want this, you can add a catch-all route and discard
// them.

const pull = require('pull-stream')

module.exports = function () {
  let predicates = []
  let pendingRead = null

  const id = String(Math.random()).substring(10)

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
      // handle abort; this means passing the 'abort' value to ALL sink routes & ending
      if (abort) {
        end = abort
        predicates.forEach(route => {
          if (route.cb) route.cb(abort)
        })
        predicates = null
        return
      }

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
        pendingRead = () => {
          pendingRead = null
          read(null, next)
        }
      }
    }
  }

  function removeRoute (id) {
    predicates = predicates.filter(route => route.id !== id)
  }

  stream.addRoute = function (predicateFn, sink) {
    const fakeSource = function (abort, cb) {
      if (abort) {
        removeRoute(route.id)
        if (allRoutesReady() && pendingRead) {
          pendingRead()
        }
        return
      }

      route.cb = cb
      if (allRoutesReady() && pendingRead) {
        pendingRead()
      }
    }

    const route = {
      id: String(Math.random()).substring(8),
      fn: predicateFn,
      cb: null
    }
    predicates.push(route)

    const stream = pull(
      fakeSource,
      sink
    )

    return stream
  }

  return stream
}
