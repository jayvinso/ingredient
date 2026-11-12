import { useEffect, useSyncExternalStore } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import KitchenPage from './pages/KitchenPage'
import ContextoPage from './pages/ContextoPage'

function subscribeToNavigation(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getCurrentPage() {
  if (window.location.hash === '#/kitchen') return 'kitchen'
  if (window.location.hash === '#/contexto') return 'contexto'
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
      : page === 'contexto'
        ? 'Recipatico | Ingredient'
        : 'All experiences | Ingredient'

    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('main')?.focus({
      preventScroll: true,
    })
  }, [page])

  if (page === 'kitchen') return <KitchenPage />
  if (page === 'contexto') return <ContextoPage />
  return <HomePage />
}

export default App
