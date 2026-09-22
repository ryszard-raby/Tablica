import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/app.tsx', import.meta.url), 'utf8')
const core = source.slice(source.indexOf('type Config'), source.indexOf('const time='))
const compiled = ts.transpile(core, { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.None })
function setup(seed = 42) {
  const randomMath = Object.create(Math)
  randomMath.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  return vm.runInNewContext(compiled + '; ({ generate, defaults, createPositions, normalizeConfig })', { Math: randomMath })
}

// Replay every movement against an independent occupancy ledger.
function replay(config, rows, positions) {
  for (const row of rows) {
    const origin = positions.get(row.train)
    assert.equal(row.route[0], origin.station)
    assert.equal(row.platform, origin.platform)
    assert.notEqual(row.route.at(-1), origin.station)
    for (let i = 1; i < row.route.length; i++) {
      const station = row.route[i]
      assert.ok(config.links.some(link => link.includes(row.route[i - 1]) && link.includes(station)))
      const occupants = [...positions.values()].filter(p => p.station === station)
      assert.ok(occupants.length < config.platforms[station], `Full station: ${station}`)
    }
    positions.set(row.train, { station: row.route.at(-1), platform: row.arrivalPlatform })
    const occupied = new Set()
    for (const p of positions.values()) {
      assert.ok(p.platform >= 1 && p.platform <= config.platforms[p.station])
      const key = JSON.stringify([p.station, p.platform])
      assert.ok(!occupied.has(key), `Duplicate berth: ${key}`)
      occupied.add(key)
    }
  }
}

test('platform limits and route continuity hold over 500 refills and all trains run', () => {
  const { generate, defaults, createPositions } = setup()
  const positions = createPositions(defaults)
  const actual = new Map(positions)
  let rows = generate(defaults, 0, 9, positions)
  replay(defaults, rows, actual)
  const used = new Set()
  for (let i = 0; i < 500; i++) {
    const rest = rows.slice(1)
    const fresh = generate(defaults, rest.at(-1).time, 1, positions)
    assert.equal(fresh.length, 1)
    assert.equal(fresh[0].time - rest.at(-1).time, 300000)
    replay(defaults, fresh, actual)
    used.add(fresh[0].train)
    rows = [...rest, ...fresh]
    assert.equal(rows.length, 9)
  }
  assert.deepEqual([...used].sort(), ['DB', 'ICE', 'SWI'])
})

test('an occupied single-platform destination is unavailable until its train leaves', () => {
  const { generate, defaults, createPositions } = setup()
  const positions = createPositions(defaults)
  const actual = new Map(positions)
  const rows = generate(defaults, 0, 100, positions)
  const single = defaults.stations.find(s => defaults.platforms[s] === 1)
  assert.equal([...actual.values()].filter(p => p.station === single).length, 1)
  replay(defaults, rows, actual)
})

test('full intermediate stations must be cleared before a train can pass', () => {
  const { generate, defaults, createPositions } = setup()
  const config = { ...defaults, stations: ['A','B','C'], links: [['A','B'],['B','C']], trains: ['ICE','DB'], platforms: {A:1,B:1,C:1} }
  const positions = createPositions(config)
  const actual = new Map(positions)
  const rows = generate(config, 0, 100, positions)
  assert.equal(rows[0].train, 'DB')
  assert.equal(rows.length, 100)
  replay(config, rows, actual)
})

test('one spare platform is enough, including after a long pause', () => {
  const { generate, defaults, createPositions } = setup()
  const config = { ...defaults, trains: ['A','B','C','D','E'] }
  const positions = createPositions(config)
  const actual = new Map(positions)
  for (const start of [0,3600000]) {
    const rows = generate(config, start, 100, positions)
    assert.equal(rows.length, 100)
    assert.ok(rows.every(r => r.time > start))
    replay(config, rows, actual)
  }
})

test('legacy settings retain the fleet and receive station platform defaults', () => {
  const { defaults, normalizeConfig } = setup()
  const { platforms, ...legacy } = defaults
  assert.deepEqual(JSON.parse(JSON.stringify(normalizeConfig(legacy).platforms)), JSON.parse(JSON.stringify(platforms)))
  const expanded = normalizeConfig({ ...legacy, trains: Array.from({ length: 8 }, (_,i) => `T${i}`) })
  assert.ok(Object.values(expanded.platforms).reduce((a,b)=>a+b,0) > expanded.trains.length)
})

test('a completely occupied network does not create conflicting departures', () => {
  const { generate, defaults, createPositions } = setup()
  const config = { ...defaults, stations: ['A','B'], links: [['A','B']], trains:['ICE','DB'], platforms:{A:1,B:1} }
  assert.equal(generate(config,0,9,createPositions(config)).length,0)
})
