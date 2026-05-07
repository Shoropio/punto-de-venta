import { beforeEach, describe, expect, it } from 'vitest'
import { usePosStore, type Product } from './usePosStore'

const product: Product = {
  id: 1,
  sku: 'SKU-1',
  barcode: '123',
  name: 'Cafe',
  category: 'General',
  costPrice: 10,
  salePrice: 25,
  taxRate: 13,
  stock: 10,
  minStock: 2,
}

describe('usePosStore', () => {
  beforeEach(() => {
    usePosStore.getState().clearCart()
    usePosStore.getState().setPaymentMethod('cash')
    usePosStore.getState().setCashSession(false)
  })

  it('adds products and increments quantity for duplicates', () => {
    usePosStore.getState().addItem(product)
    usePosStore.getState().addItem(product)

    expect(usePosStore.getState().cart).toHaveLength(1)
    expect(usePosStore.getState().cart[0].quantity).toBe(2)
  })

  it('does not allow quantity below one', () => {
    usePosStore.getState().addItem(product)
    usePosStore.getState().updateQuantity(product.id, -5)

    expect(usePosStore.getState().cart[0].quantity).toBe(1)
  })

  it('caps line discount to line subtotal', () => {
    usePosStore.getState().addItem(product)
    usePosStore.getState().updateDiscount(product.id, 1000)

    expect(usePosStore.getState().cart[0].discount).toBe(25)
  })

  it('applies percentage discounts to all cart items', () => {
    usePosStore.getState().addItem(product)
    usePosStore.getState().applyDiscountPercent(10)

    expect(usePosStore.getState().cart[0].discount).toBe(2.5)
  })

  it('stores payment method and cash session state', () => {
    usePosStore.getState().setPaymentMethod('credit')
    usePosStore.getState().setCashSession(true, 7)

    expect(usePosStore.getState().paymentMethod).toBe('credit')
    expect(usePosStore.getState().cashSessionOpen).toBe(true)
    expect(usePosStore.getState().cashSessionId).toBe(7)
  })
})
