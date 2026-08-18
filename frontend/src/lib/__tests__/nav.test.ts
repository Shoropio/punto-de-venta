import { describe, it, expect } from 'vitest'
import { nav, modulePermissions } from '../nav'

describe('nav', () => {
  it('has 17 items', () => {
    expect(nav).toHaveLength(17)
  })

  it('each item has key, label, and icon', () => {
    for (const item of nav) {
      expect(item.key).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.icon).toBeDefined()
    }
  })
})

describe('modulePermissions', () => {
  it('has a key for every nav item', () => {
    const navKeys = nav.map((n) => n.key)
    for (const key of navKeys) {
      expect(modulePermissions).toHaveProperty(key)
    }
  })

  it('has the same keys as nav', () => {
    const permKeys = Object.keys(modulePermissions).sort()
    const navKeys = nav.map((n) => n.key).sort()
    expect(permKeys).toEqual(navKeys)
  })

  it('every permission list is a non-empty array of strings', () => {
    for (const [key, perms] of Object.entries(modulePermissions)) {
      expect(Array.isArray(perms)).toBe(true)
      expect(perms.length).toBeGreaterThan(0)
      for (const p of perms) {
        expect(typeof p).toBe('string')
      }
    }
  })
})
