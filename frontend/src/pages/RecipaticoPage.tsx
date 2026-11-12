import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import ThemeControls from '../components/kitchen/ThemeControls'
import { chooseRecipe, loadRecipeCatalog, scoreRecipe, suggestRecipes, type CatalogRecipe } from '../components/recipatico/recipeCatalog'
import './RecipaticoPage.css'



function recipeKey(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

type Guess = {
  correct: boolean
  recipe: string
  similarity: number
}

function ServingStation({ label, guess, solvedIn }: {
  label: string
  guess: Guess | null
  solvedIn?: number
}) {
  return (
    <section className="rec-serving" aria-label={label}>
      <div className="rec-cloche" aria-hidden="true">
        {guess?.correct && (
          <span className={`rec-reveal-name${solvedIn ? ' rec-reveal-count' : ''}`}>
            {solvedIn
              ? <>Solved in <strong>{solvedIn} {solvedIn === 1 ? 'guess' : 'guesses'}</strong></>
              : guess.recipe}
          </span>
        )}
        <span className="rec-cloche__knob" />
        <span className="rec-cloche__dome" />
        <span className="rec-cloche__plate" />
      </div>
      <div className="rec-slip">
        <h2>{label}</h2>
        <p aria-live="polite">
          {guess?.correct ? `Correct! ${guess.recipe} · 100%` : guess ? `${guess.recipe} · ${guess.similarity}%` : 'No guesses yet'}
        </p>
      </div>
    </section>
  )
}

function HeatLamp() {
  return (
    <div className="rec-lamp" aria-hidden="true">
      <div className="rec-lamp__pendant">
        <div className="rec-lamp__cord" />
        <div className="rec-lamp__shade" />
      </div>
    </div>
  )
}

export default function RecipaticoPage() {
  const [recipe, setRecipe] = useState('')
  const [catalog, setCatalog] = useState<CatalogRecipe[]>([])
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    loadRecipeCatalog().then(
      (recipes) => {
        if (active) {
          if (!recipes.length) {
            setCatalogStatus('error')
            return
          }
          setCatalog(recipes)
          setTarget(chooseRecipe(recipes))
          setCatalogStatus('ready')
        }
      },
      () => {
        if (active) setCatalogStatus('error')
      },
    )
    return () => { active = false }
  }, [])

  const suggestions = suggestRecipes(catalog, recipe)
  const [target, setTarget] = useState<CatalogRecipe | null>(null)
  const [guessError, setGuessError] = useState('')
  const [gaveUp, setGaveUp] = useState(false)
  const [hintCount, setHintCount] = useState(0)

  const hintIngredients = target
    ? Object.keys(target.ingredients).sort(
        (a, b) => target.ingredients[b] - target.ingredients[a] || a.localeCompare(b),
      )
    : []
  const [tickets, setTickets] = useState<(Guess & { id: number })[]>([])
  const railRef = useRef<HTMLDivElement>(null)
  const nextTicketId = useRef(1)
  const latest = tickets[0] ?? null
  const won = latest?.correct === true
  const latestId = latest?.id
  const rankedTickets = [...tickets].sort(
    (a, b) => Number(b.correct) - Number(a.correct) || b.similarity - a.similarity || a.id - b.id,
  )

  useEffect(() => {
    const rail = railRef.current
    if (!rail || latestId === undefined) return

    const slot = rail.querySelector<HTMLElement>(`[data-ticket-id="${latestId}"]`)
    if (!slot) return

    function revealTicket() {
      if (!rail || !slot) return
      const viewport = rail.getBoundingClientRect()
      const ticket = slot.getBoundingClientRect()
      if (ticket.left < viewport.left) rail.scrollLeft += ticket.left - viewport.left
      else if (ticket.right > viewport.right) rail.scrollLeft += ticket.right - viewport.right
    }

    revealTicket()
    slot.addEventListener('animationend', revealTicket)
    return () => slot.removeEventListener('animationend', revealTicket)
  }, [latestId])
  const [closest, setClosest] = useState<Guess | null>(null)

  const lightStyle = {
    '--preview-heat': (latest?.similarity ?? 0) / 100,
    '--closest-heat': (closest?.similarity ?? 0) / 100,
  } as CSSProperties

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    let frame = 0
    let target = rail.scrollLeft
    let previousTime = 0

    function stopGlide() {
      cancelAnimationFrame(frame)
      frame = 0
    }

    function glide(time: number) {
      if (!rail) return
      const elapsed = Math.min(time - previousTime, 64)
      previousTime = time
      const remaining = target - rail.scrollLeft

      if (Math.abs(remaining) < 1) {
        rail.scrollLeft = target
        frame = 0
        return
      }

      const fraction = 1 - Math.exp(-elapsed / 75)
      const before = rail.scrollLeft
      rail.scrollLeft += remaining * fraction

      // Some browsers round scroll positions to whole pixels.
      if (rail.scrollLeft === before) rail.scrollLeft += Math.sign(remaining)
      frame = requestAnimationFrame(glide)
    }

    function scrollTickets(event: WheelEvent) {
      if (!rail || event.defaultPrevented || !event.cancelable) return
      if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
        stopGlide()
        return
      }

      const maxLeft = rail.scrollWidth - rail.clientWidth
      if (maxLeft <= 1) return

      let distance = event.deltaY
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) distance *= 16
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) distance *= rail.clientWidth

      const currentTarget = frame ? target : rail.scrollLeft
      target = Math.max(0, Math.min(maxLeft, currentTarget + distance))

      // Hand the wheel back to the page when the rail reaches its edge.
      if (target === currentTarget && Math.abs(target - rail.scrollLeft) < 1) return
      event.preventDefault()

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        stopGlide()
        rail.scrollLeft = target
      } else if (!frame) {
        previousTime = performance.now()
        frame = requestAnimationFrame(glide)
      }
    }

    rail.addEventListener('wheel', scrollTickets, { passive: false })
    rail.addEventListener('pointerdown', stopGlide)
    return () => {
      stopGlide()
      rail.removeEventListener('wheel', scrollTickets)
      rail.removeEventListener('pointerdown', stopGlide)
    }
  }, [])

  function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = recipe.trim()
    if (!name || won || gaveUp || !target) return

    const key = recipeKey(name)
    const selected = catalog.find((item) => recipeKey(item.title) === key)
    if (!selected) {
      setGuessError('Choose a recipe from the suggestions or enter its full title.')
      return
    }
    setGuessError('')

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const board = event.currentTarget
      for (const animation of board.getAnimations()) {
        if (animation.id === 'rec-clipboard-rock') animation.cancel()
      }

      board.animate(
        [
          { rotate: '0deg', offset: 0 },
          { rotate: '1.6deg', offset: 0.22 },
          { rotate: '-0.8deg', offset: 0.52 },
          { rotate: '0.3deg', offset: 0.76 },
          { rotate: '0deg', offset: 1 },
        ],
        { id: 'rec-clipboard-rock', duration: 720, easing: 'ease-in-out' },
      )
    }

    const correct = selected.id === target.id
    const guess: Guess = {
      recipe: selected.title,
      similarity: scoreRecipe(selected, target),
      correct,
    }
    const ticket = { ...guess, id: nextTicketId.current++ }
    setTickets((previous) => [ticket, ...previous])

    setClosest((best) => {
      if (correct || best === null || guess.similarity > best.similarity) return guess
      return best
    })
    setRecipe('')
  }

  function resetRound() {
    setGaveUp(false)
    setHintCount(0)
    setTickets([])
    setClosest(null)
    setRecipe('')
    setGuessError('')
    if (target) setTarget(chooseRecipe(catalog, target))
    nextTicketId.current = 1
  }

  return (
    <main className="rec-page" data-won={won} tabIndex={-1} style={lightStyle}>
      <header className="rec-header">
        <div className="rec-toolbar">
          <a className="rec-back" href="#/">← All experiences</a>
          <ThemeControls />
        </div>
        <h1>Recipatico</h1>
        <p>Find the secret recipe, one guess at a time.</p>
      </header>

      <div className="rec-facade">
        <div className="rec-pass">
          <div className="rec-window">
            <div className="rec-opening">
              <HeatLamp />
              <HeatLamp />
            </div>
          </div>

          <div className="rec-countertop">
            <ServingStation label="Latest guess" guess={latest} />
            <ServingStation label="Closest so far" guess={closest} solvedIn={won ? tickets.length : undefined} />

            <form className="rec-clipboard" onSubmit={submitGuess}>
              <div className="rec-clipboard__paper">
                {gaveUp && target ? (
                  <div className="rec-win-check">
                    <p>Secret recipe</p>
                    <strong className="rec-answer-name" role="status">{target.title}</strong>
                    <button className="rec-clipboard__submit" type="button" onClick={resetRound}>
                      Play again
                    </button>
                  </div>
                ) : won ? (
                  <div className="rec-win-check">
                    <p>Order complete</p>
                    <span className="rec-sr-only" role="status">Solved in {tickets.length} {tickets.length === 1 ? 'guess' : 'guesses'}.</span>
                    <button className="rec-clipboard__submit" type="button" onClick={resetRound}>
                      Play again
                    </button>
                  </div>
                ) : (
                  <>
                <label htmlFor="rec-recipe">Recipe guess</label>
                <input
                  id="rec-recipe"
                  list="rec-recipe-titles"
                  type="text"
                  placeholder="Write a recipe…"
                  autoComplete="off"
                  value={recipe}
                  onChange={(event) => {
                    setRecipe(event.target.value)
                    setGuessError('')
                  }}
                  aria-invalid={Boolean(guessError)}
                  aria-describedby={guessError ? 'rec-guess-error' : undefined}
                />
                {guessError && <small id="rec-guess-error" role="alert">{guessError}</small>}
                <datalist id="rec-recipe-titles">
                  {suggestions.map((item) => (
                    <option key={item.id} value={item.title} />
                  ))}
                </datalist>
                {catalogStatus === 'loading' && <small role="status">Loading recipes…</small>}
                {catalogStatus === 'error' && <small role="alert">Recipe suggestions could not load. Refresh to retry.</small>}
                <button
                  className="rec-clipboard__submit"
                  type="submit"
                  disabled={!recipe.trim() || catalogStatus !== 'ready' || !target}
                >
                  Submit guess
                </button>
                <div className="rec-round-actions">
                  <button
                    type="button"
                    disabled={!target || hintCount >= hintIngredients.length}
                    onClick={() => setHintCount((count) => Math.min(count + 1, hintIngredients.length))}
                  >
                    {target && hintCount >= hintIngredients.length ? 'All hints shown' : 'Get a hint'}
                  </button>
                  <button
                    type="button"
                    disabled={!target}
                    onClick={() => {
                      setGuessError('')
                      setGaveUp(true)
                    }}
                  >
                    Give up
                  </button>
                </div>
                <div aria-live="polite" aria-relevant="additions">
                  {hintCount > 0 && (
                    <ol className="rec-hints" aria-label="Ingredient hints">
                      {hintIngredients.slice(0, hintCount).map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ol>
                  )}
                </div>
                  </>
                )}
              </div>
              <span className="rec-clipboard__clip" aria-hidden="true" />
            </form>
          </div>

          <section className="rec-counterfront" aria-label="Guess history">
            <div className="rec-rail" aria-hidden="true" />
            <div
                className="rec-ticket-viewport"
                ref={railRef}
                role="region"
                aria-label="Guess tickets, highest similarity first"
                tabIndex={tickets.length ? 0 : undefined}
              >
                {tickets.length === 0 ? (
                  <p className="rec-ticket-empty">Your guess tickets will hang here.</p>
                ) : (
                  <ol className="rec-tickets">
                    {rankedTickets.map((ticket) => (
                      <li className="rec-ticket-slot" key={ticket.id} data-ticket-id={ticket.id}>
                        <article className="rec-ticket" data-correct={ticket.correct}>
                          <span className="rec-ticket__clip" aria-hidden="true" />
                          <div className="rec-ticket__number">
                            Order № {String(ticket.id).padStart(3, '0')}
                          </div>
                          <h3>{ticket.recipe}</h3>
                          {ticket.correct && <span className="rec-served-stamp">Served</span>}
                          <p>Similarity <strong>{ticket.similarity}%</strong></p>
                          <div className="rec-ticket__track" aria-hidden="true">
                            <span style={{ width: `${ticket.similarity}%` }} />
                          </div>
                        </article>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
          </section>
        </div>
      </div>
    </main>
  )
}
