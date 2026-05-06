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

export const demoProducts: Product[] = [
  { id: 1, sku: 'CAF-AME', barcode: '750000000001', name: 'Cafe americano', category: 'Bebidas', costPrice: 12, salePrice: 28, taxRate: 16, stock: 100, minStock: 10 },
  { id: 2, sku: 'PAN-CHO', barcode: '750000000002', name: 'Pan de chocolate', category: 'Panaderia', costPrice: 15, salePrice: 32, taxRate: 16, stock: 18, minStock: 8 },
  { id: 3, sku: 'ENS-CES', barcode: '750000000003', name: 'Ensalada cesar', category: 'Comida', costPrice: 48, salePrice: 95, taxRate: 16, stock: 12, minStock: 6 },
  { id: 4, sku: 'BOT-AGU', barcode: '750000000004', name: 'Agua mineral', category: 'Bebidas', costPrice: 11, salePrice: 24, taxRate: 16, stock: 8, minStock: 10 },
]

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
