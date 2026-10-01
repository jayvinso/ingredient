const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-typescript.cjs')
const { createRecipeClient, waitFor } = load('recipeClient')

const item = {
  id: 'tuna',
  type: 'ingredient',
  name: 'Tuna',
}

function recipe(overrides = {}) {
  return {
    title: 'Tuna Macaroni Casserole',
    text: 'Tuna Macaroni Casserole',
    match_level: 'partial',
    matched_ingredients: ['tuna'],
    approximate_matches: [],
    missing_ingredients: ['macaroni', 'onion', 'pimentos'],
    unmatched_ingredients: [],
    ...overrides,
  }
}

test('GET encodes ingredient names, preserves word boundaries and excludes appliances', async () => {
  const signal = new AbortController().signal
  const expected = recipe()

  const client = createRecipeClient(
    'https://recipes.example.test/api/',
    async (url, options) => {
      const parsed = new URL(url)

      assert.equal(parsed.pathname, '/api/recipes')
      assert.equal(
        parsed.searchParams.get('query'),
        'cream style corn,tuna',
      )
      assert.equal(options.signal, signal)
      assert.equal(options.headers.Accept, 'application/json')

      return {
        ok: true,
        json: async () => expected,
      }
    },
  )

  const result = await client.requestRecipe([
    {
      id: 'corn',
      type: 'ingredient',
      name: 'Cream-style corn',
    },
    item,
    {
      id: 'oven',
      type: 'appliance',
      name: 'Oven',
    },
    item,
  ], signal)

  assert.equal(client.isDemo, false)
  assert.deepEqual(result, {
    ...expected,
    isDemo: false,
  })
})

test('weak-match details pass through without being presented as exact matches', async () => {
  const expected = recipe({
    match_level: 'weak',
    matched_ingredients: [],
    approximate_matches: [
      {
        selected: 'onion rings',
        recipe_ingredient: 'onion',
      },
    ],
    unmatched_ingredients: ['cornmint'],
  })

  const client = createRecipeClient('/api', async () => ({
    ok: true,
    json: async () => expected,
  }))

  assert.deepEqual(await client.requestRecipe([item]), {
    ...expected,
    isDemo: false,
  })
})

test('legacy JSON-string responses remain supported', async () => {
  const client = createRecipeClient('/api', async () => ({
    ok: true,
    json: async () => ' Legacy recipe ',
  }))

  assert.deepEqual(await client.requestRecipe([item]), {
    title: 'Legacy recipe',
    text: 'Legacy recipe',
    isDemo: false,
  })
})

test('blank or appliance-only selections do not make a network request', async () => {
  let calls = 0

  const client = createRecipeClient('/api', async () => {
    calls++
    throw new Error('Unexpected network request')
  })

  for (const items of [
    [],
    ['   '],
    [{ id: 'oven', type: 'appliance', name: 'Oven' }],
  ]) {
    await assert.rejects(
      client.requestRecipe(items),
      /at least one ingredient/,
    )
  }

  assert.equal(calls, 0)
})

test('HTTP failures and no-match responses produce readable errors', async () => {
  const failing = createRecipeClient('/api', async () => ({
    ok: false,
    status: 503,
  }))

  await assert.rejects(
    failing.requestRecipe([item]),
    /HTTP 503/,
  )

  const noMatch = createRecipeClient('/api', async () => ({
    ok: false,
    status: 404,
    json: async () => ({
      error: { code: 'no_recipe_match' },
    }),
  }))

  await assert.rejects(
    noMatch.requestRecipe([item]),
    /No matching recipe/,
  )

  const other404 = createRecipeClient('/api', async () => ({
    ok: false,
    status: 404,
    json: async () => {
      throw new SyntaxError('Not JSON')
    },
  }))

  await assert.rejects(
    other404.requestRecipe([item]),
    /HTTP 404/,
  )
})

test('empty responses and invalid match details are rejected', async () => {
  for (const value of [
    '',
    ' ',
    {},
    [],
    null,
    42,
    recipe({ title: ' ' }),
    recipe({ text: '' }),
    recipe({ match_level: 'unknown' }),
    recipe({ matched_ingredients: [42] }),
    recipe({ missing_ingredients: null }),
    recipe({ unmatched_ingredients: [''] }),
    recipe({
      approximate_matches: [{ selected: 'onion rings' }],
    }),
  ]) {
    const client = createRecipeClient('/api', async () => ({
      ok: true,
      json: async () => value,
    }))

    await assert.rejects(
      client.requestRecipe([item]),
      /unexpected response/,
    )
  }
})

test('malformed JSON produces a readable error', async () => {
  const client = createRecipeClient('/api', async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError('Malformed JSON')
    },
  }))

  await assert.rejects(
    client.requestRecipe([item]),
    /unreadable data/,
  )
})

test('cancellation reaches fetch and aborts pending delays', async () => {
  const controller = new AbortController()

  const client = createRecipeClient('/api', async (_url, { signal }) => {
    assert.equal(signal, controller.signal)

    await waitFor(10000, signal)

    throw new Error('Should have been canceled')
  })

  const request = client.requestRecipe([item], controller.signal)
  controller.abort()

  await assert.rejects(request, { name: 'AbortError' })
  await assert.rejects(
    waitFor(10000, controller.signal),
    { name: 'AbortError' },
  )
})

test('a previously aborted request does not call fetch', async () => {
  const controller = new AbortController()
  controller.abort()

  let calls = 0

  const client = createRecipeClient('/api', async () => {
    calls++
    throw new Error('Unexpected network request')
  })

  await assert.rejects(
    client.requestRecipe([item], controller.signal),
    { name: 'AbortError' },
  )

  assert.equal(calls, 0)
})

test('cancellation while reading JSON remains an abort, not a data error', async () => {
  const controller = new AbortController()

  const client = createRecipeClient('/api', async () => ({
    ok: true,
    json: async () => {
      await waitFor(10000, controller.signal)
      return recipe()
    },
  }))

  const request = client.requestRecipe([item], controller.signal)

  await Promise.resolve()
  controller.abort()

  await assert.rejects(request, { name: 'AbortError' })
})

test('completed delays remove their abort listener', async () => {
  const controller = new AbortController()
  const signal = controller.signal
  const originalRemove = signal.removeEventListener.bind(signal)

  let removed = 0

  signal.removeEventListener = (...args) => {
    removed++
    return originalRemove(...args)
  }

  await waitFor(1, signal)

  assert.equal(removed, 1)

  controller.abort()
})