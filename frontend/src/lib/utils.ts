import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let activeCurrency = 'MXN'

const localeByCurrency: Record<string, string> = {
  CRC: 'es-CR',
  USD: 'en-US',
  MXN: 'es-MX',
  EUR: 'es-ES',
}

export function configureCurrency(currencyCode: string) {
  activeCurrency = currencyCode.trim().toUpperCase() || 'MXN'
}

export const currency = {
  format(value: number) {
    return new Intl.NumberFormat(localeByCurrency[activeCurrency] ?? 'es-MX', {
      style: 'currency',
      currency: activeCurrency,
    }).format(value)
  },
}
