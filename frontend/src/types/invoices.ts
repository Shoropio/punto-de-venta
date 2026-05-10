export type InvoiceRow = {
  id: number
  folio: string
  document_type?: string
  schema_version?: string
  clave?: string | null
  numero_consecutivo?: string | null
  tax_id: string
  legal_name: string
  status: string
  hacienda_status?: string
  xml_path?: string | null
  signed_xml_path?: string | null
  hacienda_response_path?: string | null
  metadata?: {
    auto_process?: {
      steps?: Record<string, string>
      message?: string
      stopped_at?: string
    }
  } | null
  submitted_at?: string | null
  accepted_at?: string | null
  rejected_at?: string | null
  sale?: { folio?: string; total?: string } | null
}
