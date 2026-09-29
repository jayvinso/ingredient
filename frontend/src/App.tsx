import './App.css'
import RecipeWorkspace from './components/recipe-bowl/RecipeWorkspace'
import BowlSelectionProvider from './components/recipe-bowl/BowlSelectionProvider'
import SelectionDevTools from './components/recipe-bowl/SelectionDevTools'

function App() {
  return (
    <BowlSelectionProvider>
      <main className="layout">
        <section className="main" aria-label="Recipe workspace">
          <RecipeWorkspace />
        </section>

        <aside className="right" aria-label="Things to add to your bowl">
          <section className="source-panel">
            <p className="source-panel__eyebrow">01 / Choose</p>
            <h2>Ingredients</h2>
            <p>Find ingredients and add them to your bowl.</p>

            {import.meta.env.DEV ? (
              <SelectionDevTools type="ingredient" />
            ) : (
              <div className="source-panel__empty">
                Ingredient browsing is coming soon.
              </div>
            )}
          </section>

          <section className="source-panel">
            <p className="source-panel__eyebrow">02 / Prepare</p>
            <h2>Actions &amp; tools</h2>
            <p>Add what you can use to prepare your recipe.</p>

            {import.meta.env.DEV ? (
              <SelectionDevTools type="appliance" />
            ) : (
              <div className="source-panel__empty">
                Actions and tools are coming soon.
              </div>
            )}
          </section>
        </aside>
      </main>
    </BowlSelectionProvider>
  )
}

export default App