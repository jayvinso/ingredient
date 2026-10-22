export function createIngredientClient(baseUrl = '', transport: typeof fetch = fetch) {
  const apiBase = baseUrl.trim().replace(/\/+$/, '')
  const isDemo = !apiBase

  async function searchIngredients(searchTerm: string, signal?: AbortSignal): Promise<string[]> {
    if (!searchTerm.trim()) return []

    if (isDemo) {
      const mockList = ['Tomato', 'Pasta', 'Olive Oil', 'Garlic', 'Onion', 'Basil', 'Cheese']
      return mockList.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    const query = new URLSearchParams({ query: searchTerm })
    const response = await transport(`${apiBase}/ingredients?${query}`, { signal })

    if (!response.ok) throw new Error(`Ingredient search failed (HTTP ${response.status}).`)

    const rawText = await response.text()
    if (!rawText.trim()) return []

    try {
      const parsed = JSON.parse(rawText)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
      if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()]
    } catch {
      // Fallback for unquoted plain text
    }

    const cleaned = rawText.trim().replace(/^"|"$/g, '')
    return cleaned ? [cleaned] : []
  }

  return { isDemo, searchIngredients }
}