import { useRef } from 'react'
import './App.css'
import RecipeWorkspace from './components/recipe-bowl/RecipeWorkspace'
import BowlSelectionProvider from './components/recipe-bowl/BowlSelectionProvider'
import SelectionDevTools from './components/recipe-bowl/SelectionDevTools'
import ThemeControls from './components/kitchen/ThemeControls'
import { IngredientSearch } from './components/recipe-bowl/IngredientSearch'
import KitchenBanner from './components/kitchen/KitchenBanner'
import { useKitchenFloat } from './components/kitchen/useKitchenFloat'
import './components/kitchen/KitchenRoom.css'
import './components/kitchen/KitchenDetails.css'
import './components/kitchen/KitchenInteractions.css'

function App() {
  const kitchenRef = useRef<HTMLDivElement>(null)
  useKitchenFloat(kitchenRef)

  return (
    <BowlSelectionProvider>
      <div ref={kitchenRef} className="kitchen-page">
        <KitchenBanner />

        <div className="kitchen-room">
          <main className="layout">
            <section className="main" aria-label="Recipe workspace">
              <RecipeWorkspace />
            </section>

            <aside
              className="right"
              aria-label="Things to add to your bowl"
            >
              <ThemeControls />

              <section className="source-panel source-panel--tools">
                <p className="source-panel__eyebrow">
                  A little kitchen help
                </p>

                <h2>Utensil drawer</h2>

                {import.meta.env.DEV ? (
                  <SelectionDevTools type="appliance" />
                ) : (
                  <div className="source-panel__empty">
                    Actions and tools are coming soon.
                  </div>
                )}
              </section>

              <section className="source-panel source-panel--pantry">
                <p className="source-panel__eyebrow">
                  Open the cupboard
                </p>

                <h2>The pantry</h2>
                <p>Find something good to put in your bowl.</p>

                <IngredientSearch />
              </section>
            </aside>
          </main>
        </div>
      </div>
    </BowlSelectionProvider>
  )
}

export default App