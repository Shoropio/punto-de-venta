import { describe, expect, it } from 'vitest'
import { configureCurrency, currency } from './utils'

describe('currency formatter', () => {
  it('formats MXN by default', () => {
    configureCurrency('MXN')
    expect(currency.format(1234.5)).toContain('$')
    expect(currency.format(1234.5)).toContain('1,234.50')
  })

  it('formats CRC with the colon symbol', () => {
    configureCurrency('CRC')
    expect(currency.format(1234.5)).toContain('₡')
  })

  it('falls back safely when currency code is empty', () => {
    configureCurrency('')
    expect(currency.format(10)).toContain('$')
  })
})
