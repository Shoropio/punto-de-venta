import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn('h-10 w-full rounded-none border border-stone-300 bg-white px-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/15 dark:border-[#4b4b4b] dark:bg-[#1f1f1f] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#0088cc] dark:focus:ring-[#0088cc]/25', className)}
      {...props}
    />
  )
})
