const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-typescript.cjs')

test('animation settles on cancel, respects live reduced motion and cancels frames on unmount', () => {
  let id = 0, timestamp = 0, cleanup, listener, state, transform = ''
  const queue = new Map()
  const preference = {
    matches: false,
    addEventListener: (_event, fn) => { listener = fn },
    removeEventListener: () => { listener = undefined },
  }
  const oldWindow = global.window, oldRequest = global.requestAnimationFrame, oldCancel = global.cancelAnimationFrame
  global.window = { matchMedia: () => preference }
  global.requestAnimationFrame = fn => { queue.set(++id, fn); return id }
  global.cancelAnimationFrame = key => queue.delete(key)
  const react = { useRef: initial => state ??= { current: initial }, useEffect: fn => { cleanup = fn() } }
  const { useSpoonMotion } = load('useSpoonMotion', { react, './spoonMotion': load('spoonMotion') })
  const ref = { current: {
    setAttribute: (_name, value) => { transform = value }, removeAttribute: () => { transform = '' },
  } }
  const frame = () => {
    const pending = [...queue.values()]; queue.clear(); timestamp += 16
    for (const fn of pending) fn(timestamp)
  }
  try {
    useSpoonMotion(ref, true)
    for (let i = 0; i < 25; i++) frame()
    const moving = transform
    assert.notEqual(moving, 'translate(0 0) rotate(0 768 523)')
    cleanup(); useSpoonMotion(ref, false)
    assert.equal(transform, moving) // Stopping must not immediately snap to rest.
    for (let i = 0; i < 90; i++) frame()
    assert.equal(transform, 'translate(0 0) rotate(0 768 523)')
    assert.equal(queue.size, 0)
    cleanup(); useSpoonMotion(ref, true); frame(); frame()
    preference.matches = true; listener()
    assert.equal(transform, ''); assert.equal(queue.size, 0)
    preference.matches = false; listener(); frame(); frame()
    assert.equal(queue.size, 1)
    cleanup(); assert.equal(queue.size, 0); assert.equal(listener, undefined)
  } finally {
    global.window = oldWindow; global.requestAnimationFrame = oldRequest; global.cancelAnimationFrame = oldCancel
  }
})
