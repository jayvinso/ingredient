import { useEffect, useSyncExternalStore } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import KitchenPage from './pages/KitchenPage'

function subscribeToNavigation(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getCurrentPage() {
  return window.location.hash === '#/kitchen' ? 'kitchen' : 'home'
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
      : 'All experiences | Ingredient'

    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('main')?.focus({
      preventScroll: true,
    })
  }, [page])

  return page === 'kitchen' ? <KitchenPage /> : <HomePage />
}

export default App