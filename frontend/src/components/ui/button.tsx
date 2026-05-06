import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-[#202020] text-white hover:bg-[#303030] dark:bg-[#0088cc] dark:hover:bg-[#0077b3]',
    secondary: 'border border-stone-300 bg-white text-slate-900 hover:bg-stone-100 dark:border-[#575757] dark:bg-[#2b2b2b] dark:text-white dark:hover:bg-[#383838]',
    ghost: 'text-slate-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-[#303030] dark:hover:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  return (
    <button
      className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-none px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50', variants[variant], className)}
      {...props}
    />
  )
}
