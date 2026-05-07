export type InvoiceRow = {
  id: number
  folio: string
  tax_id: string
  legal_name: string
  status: string
  sale?: { folio?: string; total?: string } | null
}
