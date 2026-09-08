import './App.css'
import RecipeWorkspace from './components/recipe-bowl/RecipeWorkspace'
import BowlSelectionProvider from './components/recipe-bowl/BowlSelectionProvider'

function App() {
  return (
    <BowlSelectionProvider>
      <main className="layout">
        <section className="main">
          <RecipeWorkspace />
        </section>
        <aside className="right">
          <section className ="" />
          <section className = "" />
        </aside>
      </main>
    </BowlSelectionProvider>
  )
}

export default App
