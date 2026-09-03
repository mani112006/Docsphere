import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'oled'

type ThemeValue = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined)
const STORAGE_KEY = 'docsphere-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'oled' ? 'oled' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('theme-oled', theme === 'oled')
    document.documentElement.classList.toggle('theme-light', theme === 'light')
    document.documentElement.style.colorScheme = theme === 'oled' ? 'dark' : 'light'
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore quota / private mode */
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'oled' ? '#000000' : '#0f4c5c')
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next: ThemeMode) => setThemeState(next),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
