import type { ComponentType } from 'react'

export function PosAction({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  muted,
  active,
  className = '',
  onBlocked,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
  muted?: boolean
  active?: boolean
  className?: string
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
      className={`relative h-full min-h-[68px] border bg-[#2b2b2b] text-[13px] font-semibold text-white transition hover:bg-[#383838] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 ${active ? 'border-[#0088cc] bg-[#333]' : 'border-[#575757]'} ${muted ? 'text-stone-400' : ''} ${className}`}
      onClick={handleClick}
      aria-disabled={disabled || undefined}
    >
      {shortcut && <span className="absolute left-2 top-1.5 text-[11px] text-stone-300">{shortcut}</span>}
      <Icon className="mx-auto mb-1.5" size={24} />
      {label}
    </button>
  )
}
