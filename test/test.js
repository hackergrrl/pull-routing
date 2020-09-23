const pull = require('pull-stream')
const test = require('tape')
const router = require('..')

// TODO: test a sink aborting + make sure route is removed

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

  r.addRoute(x => x % 2 === 1, pull.log())

  pull(
    pull.values([0,1,2,3]),
    r
  )
})
