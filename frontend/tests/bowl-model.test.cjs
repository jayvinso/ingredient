const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-typescript.cjs')
const { selectionReducer: reduce, initialSelection, itemKey } = load('selection')
const { insideEllipse, dropAction } = load('dragGeometry')
const { advanceSpoon, spoonTransform, RESTING_SPOON } = load('spoonMotion')
const item = { id: 'tomato', type: 'ingredient', name: 'Tomato' }

test('duplicate identities do not change counts or trigger another drop animation', () => {
  const once = reduce(initialSelection, { type: 'add', item })
  assert.equal(reduce(once, { type: 'add', item: { ...item, name: 'Renamed' } }), once)
  assert.equal(once.pulse, 1)
  assert.equal(once.lastAddedKey, itemKey(item))
})
test('same ID in another category remains independently removable', () => {
  let state = reduce(initialSelection, { type: 'add', item })
  state = reduce(state, { type: 'add', item: { ...item, type: 'appliance' } })
  state = reduce(state, { type: 'remove', item })
  assert.equal(state.items.length, 1)
  assert.equal(state.items[0].type, 'appliance')
})
test('selection copies its input, rejects empty identities, and keeps overflow items', () => {
  assert.equal(reduce(initialSelection, { type: 'add', item: { ...item, id: ' ' } }), initialSelection)
  const external = { ...item }
  let state = reduce(initialSelection, { type: 'add', item: external })
  external.name = 'Changed elsewhere'
  assert.equal(state.items[0].name, 'Tomato')
  for (let i = 0; i < 20; i++) state = reduce(state, { type: 'add', item: { ...item, id: String(i) } })
  assert.equal(state.items.length, 21)
  state = reduce(state, { type: 'clear' })
  assert.deepEqual(state.items, [])
  assert.equal(state.lastAddedKey, null)
})
test('drop hit area rejects rectangular corners and empty bounds', () => {
  const bounds = { left: 100, top: 100, width: 200, height: 100 }
  assert.equal(insideEllipse(200, 150, bounds), true)
  assert.equal(insideEllipse(100, 100, bounds), false)
  assert.equal(insideEllipse(300, 150, bounds), true)
  assert.equal(insideEllipse(200, 150, { ...bounds, width: 0 }), false)
  assert.equal(insideEllipse(200, 150, undefined), false)
})
test('drop-back keeps the item; removal requires an uncanceled release in the viewport', () => {
  assert.equal(dropAction('bowl', true, false, true), null)
  assert.equal(dropAction('bowl', false, false, true), 'remove')
  assert.equal(dropAction('bowl', false, false, false), null)
  assert.equal(dropAction('bowl', false, true, true), null)
  assert.equal(dropAction('source', true, false, true), 'add')
  assert.equal(dropAction('source', false, false, true), null)
})
test('spoon starts at rest, ramps up, and settles exactly back to rest', () => {
  let state = RESTING_SPOON
  assert.equal(spoonTransform(state), 'translate(0 0) rotate(0 768 523)')
  state = advanceSpoon(state, 16, true)
  assert.ok(state.strength > 0 && state.strength < 0.2)
  for (let i = 0; i < 120; i++) state = advanceSpoon(state, 16, true)
  assert.ok(state.strength > 0.99)
  const stopping = advanceSpoon(state, 16, false)
  assert.ok(stopping.strength > 0 && stopping.strength < state.strength)
  for (let i = 0; i < 120; i++) state = advanceSpoon(state, 16, false)
  assert.deepEqual(state, RESTING_SPOON)
})
test('motion timing is consistent at 60/120 FPS and bounds long background-tab gaps', () => {
  const advance = (steps, dt) => {
    let state = RESTING_SPOON
    for (let i = 0; i < steps; i++) state = advanceSpoon(state, dt, true)
    return state
  }
  const a = advance(60, 1000 / 60), b = advance(120, 1000 / 120)
  assert.ok(Math.abs(a.phase - b.phase) < 1e-10)
  assert.ok(Math.abs(a.strength - b.strength) < 1e-10)
  assert.deepEqual(advanceSpoon(a, 10000, true), advanceSpoon(a, 40, true))
  assert.ok(!spoonTransform(a).includes('NaN'))
})
