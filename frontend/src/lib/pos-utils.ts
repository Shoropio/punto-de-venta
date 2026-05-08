import type { ToastTone } from '../types'

const statusLabels: Record<string, string> = {
  completed: 'Completada',
  refunded: 'Devuelta',
  approved: 'Aprobada',
  cancelled: 'Cancelada',
  pending: 'Pendiente',
  draft: 'Borrador',
  issued: 'Emitida',
  generated: 'Generada',
  pending_xml: 'XML pendiente',
  xml_generated: 'XML generado',
  signed: 'Firmada',
  submitted: 'Enviada',
  received: 'Recibida',
  processing: 'Procesando',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  submit_failed: 'Envio fallido',
  error: 'Error',
  open: 'Abierta',
  closed: 'Cerrada',
}

const settingLabels: Record<string, string> = {
  business_name: 'Nombre del negocio',
  currency: 'Moneda',
  auto_print: 'Impresion automatica',
  printer_name: 'Impresora',
  receipt_width: 'Ancho del ticket',
  default_tax: 'Impuesto predeterminado',
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function translateStatus(status: string) {
  return statusLabels[status] ?? status
}

export function translateSettingKey(key: string) {
  return settingLabels[key] ?? key
}

export function translateSettingValue(key: string, value: unknown) {
  if (key === 'auto_print') return value === 'yes' || value === true ? 'Si' : 'No'
  if (key === 'currency') {
    const currencyNames: Record<string, string> = {
      CRC: 'Colon costarricense (CRC)',
      USD: 'Dolar estadounidense (USD)',
      MXN: 'Peso mexicano (MXN)',
      EUR: 'Euro (EUR)',
    }
    const code = String(value ?? '').toUpperCase()
    return currencyNames[code] ?? code
  }
  if (key === 'receipt_width') return `${String(value ?? '')} mm`
  if (key === 'default_tax') return `${String(value ?? '')}%`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value ?? '')
}

export function getToastTone(message: string): ToastTone {
  const normalized = message.toLowerCase()
  if (normalized.includes('no fue posible') || normalized.includes('falta') || normalized.includes('captura') || normalized.includes('selecciona') || normalized.includes('expirada')) return 'error'
  if (normalized.includes('correctamente') || normalized.includes('registrad') || normalized.includes('guardad') || normalized.includes('cobrada') || normalized.includes('aplicad')) return 'success'
  return 'info'
}
