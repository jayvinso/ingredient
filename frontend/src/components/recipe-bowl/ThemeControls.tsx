import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark'
type ColorPalette = 'sage' | 'clay' | 'blue'

function getStartingMode(): ThemeMode {
  const savedMode = localStorage.getItem('recipe-theme')

  if (savedMode === 'light' || savedMode === 'dark') {
    return savedMode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function getStartingPalette(): ColorPalette {
  const savedPalette = localStorage.getItem('recipe-palette')

  if (
    savedPalette === 'sage' ||
    savedPalette === 'clay' ||
    savedPalette === 'blue'
  ) {
    return savedPalette
  }

  return 'sage'
}

export default function ThemeControls() {
  const [mode, setMode] = useState<ThemeMode>(getStartingMode)
  const [palette, setPalette] =
    useState<ColorPalette>(getStartingPalette)

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    localStorage.setItem('recipe-theme', mode)
  }, [mode])

  useEffect(() => {
    document.documentElement.dataset.palette = palette
    localStorage.setItem('recipe-palette', palette)
  }, [palette])

  function toggleMode() {
    setMode((currentMode) =>
      currentMode === 'light' ? 'dark' : 'light',
    )
  }

  return (
    <section className="theme-controls" aria-label="Appearance settings">
      <label className="theme-controls__palette">
        <span>Palette</span>

        <select
          value={palette}
          onChange={(event) =>
            setPalette(event.target.value as ColorPalette)
          }
        >
          <option value="sage">Sage</option>
          <option value="clay">Clay</option>
          <option value="blue">Blue</option>
        </select>
      </label>

      <button
        className="theme-controls__mode"
        type="button"
        onClick={toggleMode}
        aria-pressed={mode === 'dark'}
      >
        <span aria-hidden="true">{mode === 'light' ? '🌙' : '☀️'}</span>
        <span>{mode === 'light' ? 'Dark mode' : 'Light mode'}</span>
      </button>
    </section>
  )
}