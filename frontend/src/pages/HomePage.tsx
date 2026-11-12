import ThemeControls from '../components/kitchen/ThemeControls'
import './HomePage.css'

export default function HomePage() {
  return (
    <main className="home-page" tabIndex={-1}>
      <div className="home-page__content">
        <div className="home-page__toolbar">
          <ThemeControls />
        </div>

        <header className="home-page__header">
          <p className="home-page__brand">Ingredient</p>
          <h1>All experiences</h1>
          <p>Choose a recipe experience.</p>
        </header>

        <section
          className="home-page__card"
          aria-labelledby="kitchen-experience-title"
        >
          <p className="home-page__eyebrow">The recipe kitchen</p>
          <h2 id="kitchen-experience-title">Domestic Bliss</h2>

          <p>
            Step into the retro kitchen, pick your ingredients, and give
            the bowl a stir.
          </p>

          <a className="home-page__link" href="#/kitchen">
            Enter the kitchen
            <span aria-hidden="true">→</span>
          </a>
        </section>

        <section
          className="home-page__card"
          aria-labelledby="contexto-experience-title"
        >
          <p className="home-page__eyebrow">Coming soon</p>
          <h2 id="contexto-experience-title">Recipatico</h2>
          <p>Find the secret recipe, one guess at a time.</p>

          <a className="home-page__link" href="#/recipatico">
            Explore Recipatico
            <span aria-hidden="true">→</span>
          </a>
        </section>
      </div>
    </main>
  )
}
