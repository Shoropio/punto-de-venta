export type NamedCatalog = {
  id: number
  name: string
  code?: string
  phone?: string | null
}

export type SettingRow = {
  id: number
  key: string
  group: string
  value: unknown
}

export type PaymentMethodRow = {
  id: number
  code: string
  name: string
  type: 'cash' | 'card' | 'transfer' | 'credit' | 'other'
  requires_reference: boolean
  affects_cash_drawer: boolean
  is_active: boolean
}

export type PromotionRow = {
  id: number
  name: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: string
  min_sale_amount: string
  is_active: boolean
}
