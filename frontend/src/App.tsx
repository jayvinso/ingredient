import './App.css'
import RecipeWorkspace from './components/recipe-bowl/RecipeWorkspace'
import BowlSelectionProvider from './components/recipe-bowl/BowlSelectionProvider'
import SelectionDevTools from './components/recipe-bowl/SelectionDevTools'
import ThemeControls from './components/recipe-bowl/ThemeControls'
import { IngredientSearch } from './components/recipe-bowl/IngredientSearch'

function App() {
  return (
    <BowlSelectionProvider>
      <main className="layout">
        <section className="main" aria-label="Recipe workspace">
          <RecipeWorkspace />
        </section>

        <aside className="right" aria-label="Things to add to your bowl">
          <ThemeControls />

          {/* Section 01: Ingredients Search */}
          <section className="source-panel">
            <p className="source-panel__eyebrow">01 / Choose</p>
            <h2>Ingredients</h2>
            <p>Find ingredients and add them to your bowl.</p>

            <IngredientSearch />
          </section>

          {/* Section 02: Appliances / Tools */}
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