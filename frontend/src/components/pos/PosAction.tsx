import type { ComponentType } from 'react'

export function PosAction({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  muted,
  onBlocked,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
  muted?: boolean
  onBlocked?: () => void
}) {
  const handleClick = () => {
    if (disabled) {
      onBlocked?.()
      return
    }

    onClick?.()
  }

  return (
    <button
      className={`relative h-20 border border-[#575757] bg-[#2b2b2b] text-sm font-semibold text-white transition hover:bg-[#383838] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 ${muted ? 'text-stone-400' : ''}`}
      onClick={handleClick}
      aria-disabled={disabled || undefined}
    >
      {shortcut && <span className="absolute left-2 top-2 text-xs text-stone-300">{shortcut}</span>}
      <Icon className="mx-auto mb-2" size={28} />
      {label}
    </button>
  )
}
