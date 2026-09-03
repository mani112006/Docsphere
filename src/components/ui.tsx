import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-dark disabled:opacity-50',
    secondary: 'bg-surface text-ink border border-line hover:bg-brand-soft disabled:opacity-50',
    ghost: 'bg-transparent text-brand hover:bg-brand-soft disabled:opacity-50',
    danger: 'bg-danger text-white hover:opacity-90 disabled:opacity-50',
  } as const

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.99]',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && !error ? <span className="block text-xs text-muted">{hint}</span> : null}
      {error ? <span className="block text-xs text-danger">{error}</span> : null}
    </label>
  )
}

const controlClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 disabled:bg-paper'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, 'min-h-24 resize-y', className)} {...props} />
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-5 shadow-sm', className)}>{children}</div>
  )
}

export function Alert({
  children,
  tone = 'info',
}: {
  children: ReactNode
  tone?: 'info' | 'warn' | 'danger' | 'ok'
}) {
  const styles = {
    info: 'bg-brand-soft text-brand-dark',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
    ok: 'bg-emerald-500/10 text-emerald-800 theme-oled:text-emerald-200',
  } as const
  return <div className={cn('rounded-xl px-3 py-2.5 text-sm', styles[tone])}>{children}</div>
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'ok' | 'warn' | 'danger'
}) {
  const styles = {
    neutral: 'bg-paper text-muted',
    ok: 'bg-emerald-500/10 text-emerald-800 theme-oled:text-emerald-200',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
  } as const
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', styles[tone])}>
      {children}
    </span>
  )
}
