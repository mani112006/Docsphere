import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { cn } from './ui'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
          theme === 'light'
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line bg-surface text-muted hover:bg-paper',
        )}
      >
        <Sun size={16} />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('oled')}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
          theme === 'oled'
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line bg-surface text-muted hover:bg-paper',
        )}
      >
        <Moon size={16} />
        Dark
      </button>
    </div>
  )
}

export function ThemeIconButton() {
  const { theme, setTheme } = useTheme()
  const next = theme === 'oled' ? 'light' : 'oled'

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-paper"
      aria-label={theme === 'oled' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'oled' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
