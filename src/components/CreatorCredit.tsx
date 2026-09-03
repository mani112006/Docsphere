export function CreatorCredit({
  className = '',
  variant = 'created',
}: {
  className?: string
  variant?: 'created' | 'designed'
}) {
  if (variant === 'designed') {
    return (
      <p className={`text-center text-xs text-muted ${className}`}>
        Designed &amp; Developed by <span className="font-medium text-ink/80">MANIKANDAN S</span>
      </p>
    )
  }
  return (
    <p className={`text-center text-xs text-muted ${className}`}>
      Created by <span className="font-medium text-ink/80">MANIKANDAN S</span>
    </p>
  )
}
