const pull = require('pull-stream')
const test = require('tape')
const router = require('..')

test('even & odd', t => {
  t.plan(4)

  const r = router()

  r.addRoute(x => x % 2 === 0, pull.collect((err, nums) => {
    t.error(err)
    t.deepEquals(nums, [0,2])
  }))

  r.addRoute(x => x % 2 === 1, pull.collect((err, nums) => {
    t.error(err)
    t.deepEquals(nums, [1,3])
  }))

  pull(
    pull.values([0,1,2,3]),
    r
  )
})

test('use through instead of sink', t => {
  t.plan(2)

  const r = router()
  const thru = pull.through()

  const sink = r.addRoute(x => x % 2 === 0, thru)

  pull(
    sink,
    pull.collect((err, nums) => {
      t.error(err)
      t.deepEquals(nums, [0,2])
    })
  )

  r.addRoute(x => x % 2 === 1, pull.drain())

  pull(
    pull.values([0,1,2,3]),
    r
  )
})

test('have sink abort', t => {
  t.plan(2)

  const r = router()

  r.addRoute(x => x % 2 === 0, function (read) {
    read(null, function next (abort, data) {
      read('i am good thanks', next)
    })
  })

  r.addRoute(x => x % 2 === 1, pull.collect((err, nums) => {
    t.error(err)
    t.deepEquals(nums, [1,3,5])
  }))

  pull(
    pull.values([0,1,3,5]),
    r
  )
})

