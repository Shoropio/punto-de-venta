import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function SelectBox({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        className="
          h-10
          w-full
          appearance-none
          border
          border-stone-300
          bg-white
          py-0
          pl-3
          pr-12
          text-sm
          outline-none
          dark:border-[#4b4b4b]
          dark:bg-[#1f1f1f]
          dark:text-stone-100
        "
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>

      <ChevronDown
        size={16}
        className="
          pointer-events-none
          absolute
          right-3
          top-1/2
          -translate-y-1/2
          text-stone-500
          dark:text-stone-400
        "
      />
    </div>
  )
}
