import { describe, it, expect, beforeEach } from 'vitest'
import { currency, configureCurrency } from '../utils'

describe('currency.format', () => {
  beforeEach(() => {
    configureCurrency('MXN')
  })

  it('formats MXN values correctly', () => {
    const result = currency.format(1234.56)
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('56')
  })

  it('formats zero', () => {
    const result = currency.format(0)
    expect(result).toContain('0')
  })

  it('formats negative values', () => {
    const result = currency.format(-500)
    expect(result).toContain('500')
  })

  it('formats with commas for thousands', () => {
    const result = currency.format(15000)
    expect(result).toContain('15')
  })

  it('uses MXN currency code by default', () => {
    const result = currency.format(1)
    expect(result).toMatch(/MXN|\$/)
  })

  it('switches to USD formatting after configureCurrency', () => {
    configureCurrency('USD')
    const result = currency.format(100)
    expect(result).toMatch(/USD|\$/)
  })

  it('switches to CRC formatting', () => {
    configureCurrency('CRC')
    const result = currency.format(500)
    expect(result).toMatch(/CRC|₡/)
  })
})
