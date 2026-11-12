import catalogUrl from './data/recipe-catalog.json?url'
import vectorsUrl from './data/recipe-vectors.bin?url'
import metadataUrl from './data/recipe-vectors.meta.json?url'
import type { CatalogRecipe } from './recipeCatalog'

type Metadata = {
  rows: number
  dimensions: number
  catalogSha256: string
  vectorsSha256: string
  idf: Record<string, number>
  checks: { a: string; b: string; score: number }[]
}

type Model = {
  metadata: Metadata
  vectors: Float32Array
  rows: Map<string, number>
}

let activeModel: Model | undefined
let pending: Promise<CatalogRecipe[]> | undefined

async function fetchAsset(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Recipe asset failed to load (${response.status}).`)
  return response
}

async function sha256(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function rawScore(model: Model, guess: CatalogRecipe, target: CatalogRecipe) {
  const guessRow = model.rows.get(guess.id)
  const targetRow = model.rows.get(target.id)
  if (guessRow === undefined || targetRow === undefined) {
    throw new Error('Recipe is missing from the scoring model.')
  }

  const { dimensions, idf } = model.metadata
  const guessStart = guessRow * dimensions
  const targetStart = targetRow * dimensions
  let learned = 0
  for (let i = 0; i < dimensions; i++) {
    learned += model.vectors[guessStart + i] * model.vectors[targetStart + i]
  }

  let dot = 0
  let guessSquared = 0
  let targetSquared = 0

  for (const [name, quantity] of Object.entries(guess.ingredients)) {
    const weight = quantity * idf[name]
    guessSquared += weight * weight
    if (Object.prototype.hasOwnProperty.call(target.ingredients, name)) {
      dot += weight * target.ingredients[name] * idf[name]
    }
  }
  for (const [name, quantity] of Object.entries(target.ingredients)) {
    const weight = quantity * idf[name]
    targetSquared += weight * weight
  }

  const denominator = Math.sqrt(guessSquared * targetSquared)
  const direct = denominator ? dot / denominator : 0
  return 0.6 * learned + 0.4 * direct
}

async function loadAssets() {
  const [text, binary, metadata] = await Promise.all([
    fetchAsset(catalogUrl).then(response => response.text()),
    fetchAsset(vectorsUrl).then(response => response.arrayBuffer()),
    fetchAsset(metadataUrl).then(response => response.json() as Promise<Metadata>),
  ])

  const catalogText = text.trim().replace(/\r\n/g, '\n')
  const [catalogHash, vectorsHash] = await Promise.all([
    sha256(new TextEncoder().encode(catalogText).buffer),
    sha256(binary),
  ])
  if (catalogHash !== metadata.catalogSha256 || vectorsHash !== metadata.vectorsSha256) {
    throw new Error('Recipe catalog and scoring model are from different builds.')
  }

  const recipes: CatalogRecipe[] = JSON.parse(catalogText)
  if (recipes.length !== metadata.rows || binary.byteLength !== metadata.rows * metadata.dimensions * 4) {
    throw new Error('Recipe scoring assets have inconsistent dimensions.')
  }

  const rows = new Map(recipes.map((recipe, index) => [recipe.id, index] as const))
  const model = { metadata, vectors: new Float32Array(binary), rows }
  for (const check of metadata.checks) {
    const a = rows.get(check.a)
    const b = rows.get(check.b)
    if (a === undefined || b === undefined) throw new Error('Missing recipe in model self-check.')
    const actual = rawScore(model, recipes[a], recipes[b])
    if (!Number.isFinite(actual) || Math.abs(actual - check.score) > 0.0001) {
      throw new Error('Browser recipe score differs from the trainer.')
    }
  }

  activeModel = model
  return recipes
}

export function loadRecipeCatalog(): Promise<CatalogRecipe[]> {
  if (!pending) {
    pending = loadAssets().catch((error: unknown) => {
      pending = undefined
      throw error
    })
  }
  return pending
}

export function scoreRecipe(guess: CatalogRecipe, target: CatalogRecipe) {
  if (!activeModel) throw new Error('Recipe scoring model is still loading.')
  if (guess.id === target.id) return 100
  return Math.max(0, Math.min(99, Math.round(100 * rawScore(activeModel, guess, target))))
}
