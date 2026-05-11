import { describe, expect, it } from 'vitest'
import { getToastTone, roundMoney, translateSettingKey, translateSettingValue, translateStatus } from './pos-utils'

describe('pos-utils', () => {
  it('rounds monetary values to two decimals', () => {
    expect(roundMoney(10.235)).toBe(10.24)
    expect(roundMoney(10.234)).toBe(10.23)
  })

  it('translates backend statuses for the UI', () => {
    expect(translateStatus('completed')).toBe('Completada')
    expect(translateStatus('refunded')).toBe('Devuelta')
    expect(translateStatus('approved')).toBe('Aprobada')
    expect(translateStatus('unknown')).toBe('unknown')
  })

  it('translates settings keys and values', () => {
    expect(translateSettingKey('business_name')).toBe('Nombre del negocio')
    expect(translateSettingKey('receipt_width')).toBe('Ancho del ticket')
    expect(translateSettingValue('auto_print', 'yes')).toBe('Si')
    expect(translateSettingValue('auto_print', 'no')).toBe('No')
    expect(translateSettingValue('receipt_width', 80)).toBe('80 mm')
    expect(translateSettingValue('default_tax', 13)).toBe('13%')
    expect(translateSettingValue('currency', 'CRC')).toBe('Colon costarricense (CRC)')
  })

  it('classifies toast tones from messages', () => {
    expect(getToastTone('Producto guardado correctamente.')).toBe('success')
    expect(getToastTone('Papel higienico agregado.')).toBe('success')
    expect(getToastTone('Caja abierta correctamente. Listo para iniciar ventas.')).toBe('success')
    expect(getToastTone('Factura rechazada por Hacienda.')).toBe('error')
    expect(getToastTone('No tienes permisos para cerrar caja.')).toBe('error')
    expect(getToastTone('No fue posible guardar producto.')).toBe('error')
    expect(getToastTone('Validando credenciales...')).toBe('info')
  })
})
