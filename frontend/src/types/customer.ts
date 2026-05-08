export type Customer = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  credit_limit?: string
  balance?: string
  loyalty_points?: number
  identification_type?: string | null
  identification_number?: string | null
}

export type CustomerForm = {
  id?: number
  name: string
  email: string
  phone: string
  address: string
  credit_limit: string
  identification_type: string
  identification_number: string
}

export const emptyCustomerForm: CustomerForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  credit_limit: '0',
  identification_type: '01',
  identification_number: '',
}

export type CreditPaymentRow = {
  id: number
  amount: string
  method: string
  reference?: string | null
  customer?: { name?: string } | null
  created_at: string
}
