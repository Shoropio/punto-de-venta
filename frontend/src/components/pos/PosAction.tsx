import type { ComponentType } from 'react'

export function PosAction({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  muted,
  active,
  isDarkTheme = true,
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
  isDarkTheme?: boolean
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

  const baseClass = isDarkTheme
    ? `bg-[#2b2b2b] text-white hover:bg-[#383838] ${active ? 'border-[#0088cc] bg-[#333]' : 'border-[#575757]'} ${muted ? 'text-stone-400' : ''}`
    : `bg-white text-stone-900 hover:bg-stone-100 ${active ? 'border-[#0088cc] bg-sky-50 text-[#005f8f]' : 'border-stone-300'} ${muted ? 'text-stone-500' : ''}`
  const shortcutClass = isDarkTheme ? 'text-stone-300' : 'text-stone-500'

  return (
    <button
      className={`relative h-full min-h-[60px] border text-xs font-semibold transition aria-disabled:cursor-not-allowed aria-disabled:opacity-45 ${baseClass} ${className}`}
      onClick={handleClick}
      aria-disabled={disabled || undefined}
    >
      {shortcut && <span className={`absolute left-2 top-1.5 text-[10px] ${shortcutClass}`}>{shortcut}</span>}
      <Icon className="mx-auto mb-1" size={22} />
      {label}
    </button>
  )
}
