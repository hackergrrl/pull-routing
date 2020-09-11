const pull = require('pull-stream')
// const hwm = require('pull-high-watermark')
const router = require('./router')

const r = router()

r.addRoute(
  x => x % 2 === 0,
  function (read) {
    read(null, function next (err, n) {
      console.log('EVEN', n)
      setTimeout(() => { read(err, next) }, 1000)
    })
  }
)

r.addRoute(
  x => x % 2 === 1,
  function (read) {
    read(null, function next (err, n) {
      console.log('ODD', n)
      setTimeout(() => { read(err, next) }, 100)
    })
  }
)

pull(
  pull.values([0,1,2,3]),
  r
)

