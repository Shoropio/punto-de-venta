import { create } from 'zustand'

export type Product = {
  id: number
  sku: string
  barcode?: string
  categoryId?: number | null
  brandId?: number | null
  supplierId?: number | null
  name: string
  category: string
  costPrice: number
  salePrice: number
  taxRate: number
  stock: number
  minStock: number
  unit?: string
}

export type CartItem = Product & {
  quantity: number
  discount: number
}

type PosState = {
  cart: CartItem[]
  paymentMethod: 'cash' | 'card' | 'mixed' | 'transfer' | 'credit'
  cashSessionOpen: boolean
  cashSessionId: number | null
  addItem: (product: Product) => void
  setCart: (cart: CartItem[]) => void
  updateQuantity: (productId: number, quantity: number) => void
  updateDiscount: (productId: number, discount: number) => void
  applyDiscountPercent: (percent: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  setPaymentMethod: (method: PosState['paymentMethod']) => void
  setCashSession: (open: boolean, id?: number | null) => void
}

export const usePosStore = create<PosState>((set) => ({
  cart: [],
  paymentMethod: 'cash',
  cashSessionOpen: false,
  cashSessionId: null,
  addItem: (product) => set((state) => {
    const existing = state.cart.find((item) => item.id === product.id)
    if (existing) {
      return { cart: state.cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) }
    }
    return { cart: [...state.cart, { ...product, quantity: 1, discount: 0 }] }
  }),
  setCart: (cart) => set({ cart }),
  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map((item) => item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item),
  })),
  updateDiscount: (productId, discount) => set((state) => ({
    cart: state.cart.map((item) => {
      if (item.id !== productId) return item
      const lineSubtotal = item.salePrice * item.quantity
      return { ...item, discount: Math.min(lineSubtotal, Math.max(0, discount)) }
    }),
  })),
  applyDiscountPercent: (percent) => set((state) => ({
    cart: state.cart.map((item) => {
      const lineSubtotal = item.salePrice * item.quantity
      return { ...item, discount: Math.round(lineSubtotal * (percent / 100) * 100) / 100 }
    }),
  })),
  removeItem: (productId) => set((state) => ({ cart: state.cart.filter((item) => item.id !== productId) })),
  clearCart: () => set({ cart: [] }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCashSession: (cashSessionOpen, cashSessionId = null) => set({ cashSessionOpen, cashSessionId }),
}))
