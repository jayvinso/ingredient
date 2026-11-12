import ThemeControls from '../components/kitchen/ThemeControls'
import './RecipaticoPage.css'

function ServingStation({ label }: { label: string }) {
  return (
    <section className="rec-serving" aria-label={label}>
      <div className="rec-cloche" aria-hidden="true">
        <span className="rec-cloche__knob" />
        <span className="rec-cloche__dome" />
        <span className="rec-cloche__plate" />
      </div>
      <div className="rec-slip">
        <h2>{label}</h2>
        <p>No guesses yet</p>
      </div>
    </section>
  )
}

function HeatLamp() {
  return (
    <div className="rec-lamp" aria-hidden="true">
      <div className="rec-lamp__cord" />
      <div className="rec-lamp__shade" />
    </div>
  )
}

export default function ContextoPage() {
  return (
    <main className="rec-page" tabIndex={-1}>
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
            <ServingStation label="Latest guess" />
            <ServingStation label="Closest so far" />
          </div>

          <section className="rec-counterfront" aria-label="Guess history">
            <div className="rec-rail" aria-hidden="true" />
            <p>Your guess tickets will hang here.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
