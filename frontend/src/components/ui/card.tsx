import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-none border border-stone-300 bg-white shadow-sm dark:border-[#4b4b4b] dark:bg-[#242424] dark:text-white dark:shadow-none', className)} {...props} />
}
