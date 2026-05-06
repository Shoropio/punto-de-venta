import { create } from 'zustand'

export type Product = {
  id: number
  sku: string
  barcode?: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  taxRate: number
  stock: number
  minStock: number
}

export type CartItem = Product & {
  quantity: number
  discount: number
}

type PosState = {
  cart: CartItem[]
  paymentMethod: 'cash' | 'card' | 'mixed'
  cashSessionOpen: boolean
  cashSessionId: number | null
  addItem: (product: Product) => void
  updateQuantity: (productId: number, quantity: number) => void
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
  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map((item) => item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item),
  })),
  removeItem: (productId) => set((state) => ({ cart: state.cart.filter((item) => item.id !== productId) })),
  clearCart: () => set({ cart: [] }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCashSession: (cashSessionOpen, cashSessionId = null) => set({ cashSessionOpen, cashSessionId }),
}))
