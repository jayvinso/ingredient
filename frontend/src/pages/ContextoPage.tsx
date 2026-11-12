import './HomePage.css'

export default function ContextoPage() {
  return (
    <main className="home-page recipatico-page" tabIndex={-1}>
      <div className="home-page__content">
        <header className="home-page__header">
          <p className="home-page__brand">Ingredient</p>
          <h1>Recipatico</h1>
          <p>Find the secret recipe, one guess at a time. Coming soon.</p>
        </header>

        <a className="home-page__link" href="#/">
          ← All experiences
        </a>
      </div>
    </main>
  )
}
