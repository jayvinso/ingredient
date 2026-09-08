const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-typescript.cjs')
const { createRecipeClient, waitFor } = load('recipeClient')
const item = { id: 'tomato', type: 'ingredient', name: 'Tomato & basil' }

test('GET adapter encodes names and accepts the Swagger JSON-string response', async () => {
  const signal = new AbortController().signal
  const client = createRecipeClient('https://recipes.example.test/api/', async (url, options) => {
    const parsed = new URL(url)
    assert.equal(parsed.pathname, '/api/recipes')
    assert.equal(parsed.searchParams.get('query'), 'Ingredients: Tomato & basil. Appliances: none selected.')
    assert.equal(options.signal, signal)
    assert.equal(options.headers.Accept, 'application/json')
    return { ok: true, json: async () => 'Recipe\nDirections' }
  })
  assert.equal(client.isDemo, false)
  assert.deepEqual(await client.requestRecipe([item], signal), { text: 'Recipe\nDirections', isDemo: false })
})
test('HTTP failures, empty strings and unexpected JSON shapes fail clearly', async () => {
  const signal = new AbortController().signal
  const failing = createRecipeClient('/api', async () => ({ ok: false, status: 503 }))
  await assert.rejects(failing.requestRecipe([item], signal), /503/)
  for (const value of ['', ' ', {}, ['recipe'], null]) {
    const client = createRecipeClient('/api', async () => ({ ok: true, json: async () => value }))
    await assert.rejects(client.requestRecipe([item], signal), /unexpected response/)
  }
  const malformed = createRecipeClient('/api', async () => ({ ok: true, json: async () => {
    throw new SyntaxError('Malformed JSON')
  } }))
  await assert.rejects(malformed.requestRecipe([item], signal), /unreadable data/)
})
test('cancellation reaches fetch and aborts both existing and pending delays', async () => {
  const controller = new AbortController()
  const client = createRecipeClient('/api', async (_url, { signal }) => {
    await waitFor(10000, signal)
    throw new Error('Should have been canceled')
  })
  const request = client.requestRecipe([item], controller.signal)
  controller.abort()
  await assert.rejects(request, { name: 'AbortError' })
  await assert.rejects(waitFor(10000, controller.signal), { name: 'AbortError' })
})
test('demo is labeled, makes no network call and offers a test error', async () => {
  const client = createRecipeClient('', async () => { throw new Error('Unexpected network request') })
  assert.equal(client.isDemo, true)
  const signal = new AbortController().signal
  const result = await client.requestRecipe([item], signal)
  assert.equal(result.isDemo, true)
  assert.match(result.text, /not generated from your selection/)
  await assert.rejects(client.requestRecipe([item], signal, 'error'), /Simulated/)
})
