import { useEffect, useSyncExternalStore } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import KitchenPage from './pages/KitchenPage'
import RecipaticoPage from './pages/RecipaticoPage'

function subscribeToNavigation(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getCurrentPage() {
  if (window.location.hash === '#/kitchen') return 'kitchen'
  if (['#/recipatico', '#/contexto'].includes(window.location.hash)) return 'recipatico'
  return 'home'
}

function App() {
  const page = useSyncExternalStore(
    subscribeToNavigation,
    getCurrentPage,
    () => 'home',
  )

  useEffect(() => {
    document.title = page === 'kitchen'
      ? 'Domestic Bliss | Ingredient'
      : page === 'recipatico'
        ? 'Recipatico | Ingredient'
        : 'All experiences | Ingredient'

    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('main')?.focus({
      preventScroll: true,
    })
  }, [page])

  if (page === 'kitchen') return <KitchenPage />
  if (page === 'recipatico') return <RecipaticoPage />
  return <HomePage />
}

export default App
