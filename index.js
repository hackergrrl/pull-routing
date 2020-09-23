// This sink only reads from ITS source when ALL routes are ready & able
// to read.
//
// As in: backpressure from ANY route will cause backpressure here.
//
// If a message has no route, it will block the router until a viable route is
// added. If you don't want this, you can add a catch-all route and discard
// them.

// TODO: way to control which streams ending/erroring should end the whole
// router.

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
    console.log(id, 'checking all', predicates.length, 'routes:', allRoutesReady())
    if (!allRoutesReady()) {
      console.log(id, 'routes aint ready!')
      pendingRead = () => {
        pendingRead = null
        console.log(id, 'calling mah kid delayed')
        read(null, next)
      }
    } else {
      console.log(id, 'calling mah kid immediatement')
      read(null, next)
    }

    function next (abort, data) {
      // TODO: handle abort; this means passing the 'abort' value to ALL sink routes & ending
      if (abort) {
        console.log('src wanted to abort: shut er down boys!')
        end = abort
        predicates.forEach(route => {
          if (route.cb) route.cb(abort)
        })
        predicates = null
        return
      }

      console.log('ROUTER: got', data)

      // check routes for a match
      let found = false
      for (var i=0; i < predicates.length; i++) {
        const route = predicates[i]
        if (route.fn(data)) {
          found = true
          pendingRead = () => {
            console.log('ROUTER: pendingRead called! now reading from our source!')
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
        pendingRead = () => {
          console.log('ROUTER: pendingRead called! now reading from our source!')
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
        return
      }

      route.cb = cb
      console.log(id, 'ROUTER: route called its virtual router sink!', allRoutesReady(), !!pendingRead)
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
