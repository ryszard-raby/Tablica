import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

// Exercise the actual generator with reproducible random values.
const source = fs.readFileSync(new URL('../src/app.tsx', import.meta.url), 'utf8')
const core = source.slice(source.indexOf('type Config'), source.indexOf('const time='))
const compiled = ts.transpile(core, { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.None })
function setup() {
  let calls = 0
  const randomMath = Object.create(Math)
  // Each departure draws a train, then a route. Cover every train repeatedly.
  randomMath.random = () => (Math.floor(calls++ / 2) % 3 + 0.5) / 3
  return vm.runInNewContext(compiled + '; ({ generate, defaults })', { Math: randomMath })
}

test('successive single-row refills use the whole fleet, even after the initial board expires', () => {
  const { generate, defaults } = setup()
  const positions = new Map()
  let rows = generate(defaults, 0, 9, positions)
  const added = []
  for (let i = 0; i < 90; i++) {
    const now = rows[0].time
    const rest = rows.filter(row => row.time > now)
    const previousPositions = new Map(positions)
    const fresh = generate(defaults, rest.at(-1)?.time || now, 9 - rest.length, positions)
    assert.equal(fresh.length, 1)
    assert.equal(fresh[0].route[0], previousPositions.get(fresh[0].train))
    assert.notEqual(fresh[0].route.at(-1), previousPositions.get(fresh[0].train))
    assert.equal(fresh[0].time - rest.at(-1).time, 300000)
    added.push(fresh[0].train)
    rows = [...rest, ...fresh]
    assert.equal(rows.length, 9)
  }
  assert.deepEqual([...new Set(added)].sort(), ['DB', 'ICE', 'SWI'])
  for (const train of defaults.trains) assert.equal(added.filter(t => t === train).length, 30)
})

test('single-train fleets and rebuilding after a long pause remain valid', () => {
  const { generate, defaults } = setup()
  const config = { ...defaults, trains: ['DB'] }
  const rows = generate(config, 3600000, 9)
  assert.equal(rows.length, 9)
  assert.ok(rows.every(row => row.train === 'DB' && row.time > 3600000))
  for (const row of rows) {
    assert.ok(row.route.length >= 2)
    for (let i = 1; i < row.route.length; i++) {
      assert.ok(config.links.some(link => link.includes(row.route[i - 1]) && link.includes(row.route[i])))
    }
  }
  for (let i = 1; i < rows.length; i++) {
    assert.equal(rows[i].route[0], rows[i - 1].route.at(-1))
    assert.notEqual(rows[i].route.at(-1), rows[i - 1].route.at(-1))
  }
})

test('each train continues its route across other trains and long pauses', () => {
  const { generate, defaults } = setup()
  const positions = new Map()
  const first = generate(defaults, 0, 9, positions)
  const afterPause = generate(defaults, 3600000, 9, positions)
  const lastStops = new Map()
  for (const row of [...first, ...afterPause]) {
    if (lastStops.has(row.train)) {
      assert.equal(row.route[0], lastStops.get(row.train))
      assert.notEqual(row.route.at(-1), lastStops.get(row.train))
    }
    lastStops.set(row.train, row.route.at(-1))
  }
})

test('a train absent for a whole board keeps its last destination', () => {
  const { generate, defaults } = setup()
  const positions = new Map()
  const original = generate({ ...defaults, trains: ['ICE'] }, 0, 1, positions)[0]
  generate({ ...defaults, trains: ['DB'] }, original.time, 20, positions)
  const returning = generate({ ...defaults, trains: ['ICE'] }, 9000000, 1, positions)[0]
  assert.equal(returning.route[0], original.route.at(-1))
  assert.notEqual(returning.route.at(-1), original.route.at(-1))
})
