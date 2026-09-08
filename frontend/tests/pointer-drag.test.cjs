const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-typescript.cjs')

// Simulated pointer events exercise cancellation and post-drag click handling.
const geometry = load('dragGeometry')
const tomato = { id: 'tomato', type: 'ingredient', name: 'Tomato', emoji: '🍅' }
function check(name, run) { test(name, run) }
function PointerTestHost(origin = 'source', unavailable = false) {
  const listeners = new Map(), cleanups = [], calls = []
  let latest = null, covered = false
  const scene = { contains: hit => hit === scene }
  global.window = {
    innerWidth: 800, innerHeight: 600,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
  }
  global.document = {
    hidden: false, elementFromPoint: () => covered ? null : scene,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
  }
  const fakeReact = {
    useRef: current => ({ current }),
    useState: value => [value, next => { latest = next }],
    useCallback: fn => fn,
    useEffect: fn => { cleanups.push(fn()) },
  }
  const { usePointerDrag } = load('usePointerDrag', { react: fakeReact, './dragGeometry': geometry })
  const hook = usePointerDrag(item => calls.push(['add', item]), item => calls.push(['remove', item]))
  hook.bowlRef.current = {
    ownerSVGElement: scene,
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 100 }),
  }
  const bindings = hook.bindItem(tomato, origin, unavailable)
  const captured = new Set()
  const button = {
    setPointerCapture: id => captured.add(id),
    hasPointerCapture: id => captured.has(id),
    releasePointerCapture: id => {
      captured.delete(id)
      bindings.onLostPointerCapture({ pointerId: id })
    },
  }
  function pointer(kind, x, y, extra = {}) {
    bindings['onPointer' + kind]({
      clientX: x, clientY: y, pointerId: 1, isPrimary: true,
      button: 0, currentTarget: button, ...extra,
    })
  }
  return {
    calls, captured, pointer,
    move: (x, y) => pointer('Move', x, y),
    start: () => pointer('Down', origin === 'source' ? 400 : 200, origin === 'source' ? 300 : 150),
    end: (x, y) => pointer('Up', x, y),
    click: (detail = 1) => bindings.onClick({ detail, currentTarget: button, preventDefault() {} }),
    escape: () => listeners.get('keydown')({ key: 'Escape', preventDefault() {} }),
    blur: () => listeners.get('blur')(),
    hide: () => { document.hidden = true; listeners.get('visibilitychange')() },
    cover: () => { covered = true },
    latest: () => latest,
    cleanup: () => cleanups.forEach(fn => fn?.()),
  }
}
check('all drop-action combinations obey cancellation and viewport rules', () => {
  for (const origin of ['source', 'bowl']) for (const over of [true, false])
    for (const cancel of [true, false]) for (const viewport of [true, false]) {
      const expected = cancel || !viewport ? null : origin === 'source' && over ? 'add' : origin === 'bowl' && !over ? 'remove' : null
      assert.equal(geometry.dropAction(origin, over, cancel, viewport), expected)
    }
})
check('source drop adds once despite following browser click', () => {
  const h = PointerTestHost(); h.start(); h.move(200, 150)
  assert.equal(h.latest().overBowl, true)
  h.end(200, 150); h.click()
  assert.deepEqual(h.calls, [['add', tomato]]); assert.equal(h.captured.size, 0)
})
check('source release outside opening does not add', () => {
  const h = PointerTestHost(); h.start(); h.move(450, 300); h.end(450, 300); h.click()
  assert.deepEqual(h.calls, [])
})
check('bowl drop back inside does not remove', () => {
  const h = PointerTestHost('bowl'); h.start(); h.move(450, 300); h.move(200, 150); h.end(200, 150); h.click()
  assert.deepEqual(h.calls, [])
})
check('bowl drop outside removes exactly once', () => {
  const h = PointerTestHost('bowl'); h.start(); h.move(450, 300); h.end(450, 300); h.click()
  assert.deepEqual(h.calls, [['remove', tomato]])
})
check('release outside browser cancels removal', () => {
  const h = PointerTestHost('bowl'); h.start(); h.move(-10, 300); h.end(-10, 300); h.click()
  assert.deepEqual(h.calls, [])
})
for (const cancel of ['escape', 'blur', 'hide']) check(cancel + ' cancels without later activation', () => {
  const h = PointerTestHost('bowl'); h.start(); h.move(450, 300); h[cancel](); h.end(450, 300); h.click()
  assert.deepEqual(h.calls, []); assert.equal(h.captured.size, 0); assert.equal(h.latest(), null)
})
check('pointer cancellation preserves selection', () => {
  const h = PointerTestHost('bowl'); h.start(); h.move(450, 300); h.pointer('Cancel', 450, 300); h.click()
  assert.deepEqual(h.calls, [])
})
check('Escape before drag threshold also suppresses click', () => {
  const h = PointerTestHost(); h.start(); h.escape(); h.end(400, 300); h.click()
  assert.deepEqual(h.calls, [])
})
check('normal click and keyboard activation remain usable after cancellation', () => {
  const h = PointerTestHost(); h.start(); h.move(200, 150); h.escape(); h.click(0)
  h.start(); h.end(400, 300); h.click()
  assert.deepEqual(h.calls, [['add', tomato], ['add', tomato]])
})
check('occluded opening rejects source drop', () => {
  const h = PointerTestHost(); h.cover(); h.start(); h.move(200, 150); h.end(200, 150); h.click()
  assert.deepEqual(h.calls, [])
})
check('unavailable items cannot be added by drag or keyboard', () => {
  const h = PointerTestHost('source', true); h.start(); h.move(200, 150); h.end(200, 150); h.click(0)
  assert.deepEqual(h.calls, [])
})
check('secondary pointer cannot interfere with active drag', () => {
  const h = PointerTestHost(); h.start(); h.pointer('Cancel', 0, 0, { pointerId: 2 })
  h.move(200, 150); h.end(200, 150); h.click()
  assert.deepEqual(h.calls, [['add', tomato]])
})
check('effect cleanup releases capture', () => {
  const h = PointerTestHost(); h.start(); h.move(200, 150); h.cleanup()
  assert.equal(h.captured.size, 0); assert.deepEqual(h.calls, [])
})
