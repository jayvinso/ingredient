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
          <p>Choose a kitchen and make something good.</p>
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
      </div>
    </main>
  )
}