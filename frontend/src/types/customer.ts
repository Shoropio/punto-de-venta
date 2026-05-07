export type Customer = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  balance?: string
  loyalty_points?: number
}

export type CreditPaymentRow = {
  id: number
  amount: string
  method: string
  reference?: string | null
  customer?: { name?: string } | null
  created_at: string
}
