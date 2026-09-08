const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-typescript.cjs')
const item = { id: 'tomato', type: 'ingredient', name: 'Tomato' }
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

// Exercise async ownership with deferred services and a minimal hook-state host.
// Browser rendering/focus checks remain in the manual checklist.
function harness(items = [item]) {
  const slots = [], cleanups = [], requests = [], waits = [], locks = [], listeners = new Map()
  let cursor = 0
  const react = {
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useState(initial) {
      const i = cursor++; if (!(i in slots)) slots[i] = initial
      return [slots[i], value => { slots[i] = value }]
    },
    useCallback(fn) { const i = cursor++; return slots[i] ??= fn },
    useEffect(fn) { const i = cursor++; if (!(i in slots)) { slots[i] = true; cleanups.push(fn()) } },
  }
  global.window = {
    addEventListener: (key, fn) => listeners.set(key, fn),
    removeEventListener: key => listeners.delete(key),
  }
  const service = {
    requestRecipe(snapshot, signal) { const d = deferred(); requests.push({ ...d, snapshot, signal }); return d.promise },
    waitFor(ms, signal) { const d = deferred(); waits.push({ ...d, ms, signal }); return d.promise },
  }
  const { useRecipeFlow } = load('useRecipeFlow', { react, './recipeService': service })
  const lock = value => locks.push(value)
  const render = function TestHost() { cursor = 0; return useRecipeFlow(items, lock, () => {}) }
  return { render, requests, waits, locks, cleanup: () => cleanups.forEach(fn => fn?.()),
    escape: () => listeners.get('keydown')({ key: 'Escape', preventDefault() {} }),
  }
}
test('an appliance-only bowl cannot start a search', () => {
  const h = harness([{ ...item, type: 'appliance' }]); h.render().start()
  assert.equal(h.requests.length, 0); h.cleanup()
})
test('double activation starts once; result waits for the mixing duration', async () => {
  const h = harness(); const ui = h.render(); ui.start(); ui.start()
  assert.equal(h.requests.length, 1); assert.deepEqual(h.locks, [true])
  assert.notEqual(h.requests[0].snapshot[0], item)
  h.requests[0].resolve({ text: 'Recipe', isDemo: true }); await flush()
  assert.equal(h.render().result, null); assert.equal(h.render().busy, true)
  h.waits[0].resolve(); await flush()
  assert.equal(h.render().result.text, 'Recipe'); assert.equal(h.render().busy, false)
  assert.deepEqual(h.locks, [true, false]); h.render().close()
  assert.equal(h.render().result, null); h.cleanup()
})
test('canceled late response cannot overwrite a newer search', async () => {
  const h = harness(); h.render().start(); h.render().cancel()
  assert.equal(h.requests[0].signal.aborted, true)
  h.render().start(); h.requests[0].resolve({ text: 'Old', isDemo: true }); h.waits[0].resolve()
  await flush(); assert.equal(h.render().result, null); assert.equal(h.render().busy, true)
  h.requests[1].resolve({ text: 'New', isDemo: true }); h.waits[1].resolve(); await flush()
  assert.equal(h.render().result.text, 'New'); h.cleanup()
})
test('Escape unlocks selection without allowing a later result', async () => {
  const h = harness(); h.render().start(); h.escape()
  assert.equal(h.render().busy, false); assert.equal(h.locks.at(-1), false)
  h.requests[0].resolve({ text: 'Late', isDemo: true }); h.waits[0].resolve(); await flush()
  assert.equal(h.render().result, null); h.cleanup()
})
test('failure stops the sibling delay and permits retry', async () => {
  const h = harness(); h.render().start(); h.requests[0].reject(new Error('Unavailable'))
  await flush(); assert.equal(h.render().error, 'Unavailable')
  assert.equal(h.waits[0].signal.aborted, true); assert.equal(h.render().busy, false)
  h.render().start(); assert.equal(h.render().error, '')
  h.requests[1].resolve({ text: 'Retry', isDemo: false }); h.waits[1].resolve(); await flush()
  assert.equal(h.render().result.text, 'Retry'); h.cleanup()
})
test('unmount aborts and ignores late completion', async () => {
  const h = harness(); h.render().start(); h.cleanup()
  assert.equal(h.requests[0].signal.aborted, true)
  h.requests[0].resolve({ text: 'Late', isDemo: true }); h.waits[0].resolve(); await flush()
  assert.equal(h.render().result, null)
})
test('timeout rejects even a service that resolves after abort', async () => {
  const original = global.setTimeout; let timeout
  global.setTimeout = (fn, ms) => { assert.equal(ms, 30000); timeout = fn; return 0 }
  try {
    const h = harness(); h.render().start(); timeout()
    h.requests[0].resolve({ text: 'Late', isDemo: true }); h.waits[0].resolve(); await flush()
    assert.match(h.render().error, /too long/); assert.equal(h.render().result, null)
    assert.equal(h.render().busy, false); h.cleanup()
  } finally { global.setTimeout = original }
})
