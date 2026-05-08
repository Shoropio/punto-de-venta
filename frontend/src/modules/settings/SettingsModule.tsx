import { Landmark, Printer, Settings } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import type { HaciendaSettingRow, NamedCatalog, SettingRow } from '../../types'
import { Empty } from '../../components/shared/Empty'
import { SelectBox } from '../../components/shared/SelectBox'
import { translateSettingKey, translateSettingValue } from '../../lib/pos-utils'

export function SettingsModule({
  businessName,
  currencyCode,
  defaultTax,
  branches,
  settings,
  loading,
  hasReceipt,
  haciendaSetting,
  onBusinessName,
  onCurrencyCode,
  onDefaultTax,
  onSave,
  onHaciendaChange,
  onSaveHacienda,
  onPrint,
}: {
  businessName: string
  currencyCode: string
  defaultTax: string
  branches: NamedCatalog[]
  settings: SettingRow[]
  loading: boolean
  hasReceipt: boolean
  haciendaSetting: HaciendaSettingRow
  onBusinessName: (value: string) => void
  onCurrencyCode: (value: string) => void
  onDefaultTax: (value: string) => void
  onSave: () => void
  onHaciendaChange: (value: HaciendaSettingRow) => void
  onSaveHacienda: () => void
  onPrint: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-lg font-bold">Negocio</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Input className="md:col-span-3" placeholder="Nombre comercial" value={businessName} onChange={(event) => onBusinessName(event.target.value)} />
            <Input placeholder="Moneda" value={currencyCode} onChange={(event) => onCurrencyCode(event.target.value)} />
            <Input placeholder="IVA predeterminado" type="number" value={defaultTax} onChange={(event) => onDefaultTax(event.target.value)} />
            <Button onClick={onSave} disabled={loading}>
              <Settings size={18} />
              Guardar
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-lg font-bold">Impresión</h2>
          <p className="text-sm text-slate-500">Recibo web listo para la impresora del navegador. ESC/POS queda preparado para servicio local.</p>
          <Button className="mt-4" variant="secondary" onClick={onPrint} disabled={!hasReceipt}>
            <Printer size={18} />
            Imprimir último recibo
          </Button>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Landmark size={20} /> Hacienda Costa Rica v4.4</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <SelectBox value={haciendaSetting.environment} onChange={(value) => onHaciendaChange({ ...haciendaSetting, environment: value as HaciendaSettingRow['environment'] })}>
            <option value="staging">Sandbox</option>
            <option value="production">Produccion</option>
          </SelectBox>
          <Input placeholder="Razon social" value={haciendaSetting.legal_name} onChange={(event) => onHaciendaChange({ ...haciendaSetting, legal_name: event.target.value })} />
          <Input placeholder="Nombre comercial" value={haciendaSetting.commercial_name ?? ''} onChange={(event) => onHaciendaChange({ ...haciendaSetting, commercial_name: event.target.value })} />
          <SelectBox value={haciendaSetting.identification_type} onChange={(value) => onHaciendaChange({ ...haciendaSetting, identification_type: value })}>
            <option value="01">Fisica</option>
            <option value="02">Juridica</option>
            <option value="03">DIMEX</option>
            <option value="04">NITE</option>
          </SelectBox>
          <Input placeholder="Identificacion" value={haciendaSetting.identification_number} onChange={(event) => onHaciendaChange({ ...haciendaSetting, identification_number: event.target.value })} />
          <Input placeholder="Actividad economica" value={haciendaSetting.economic_activity_code} onChange={(event) => onHaciendaChange({ ...haciendaSetting, economic_activity_code: event.target.value })} />
          <Input placeholder="Provincia" value={haciendaSetting.province} onChange={(event) => onHaciendaChange({ ...haciendaSetting, province: event.target.value })} />
          <Input placeholder="Canton" value={haciendaSetting.canton} onChange={(event) => onHaciendaChange({ ...haciendaSetting, canton: event.target.value })} />
          <Input placeholder="Distrito" value={haciendaSetting.district} onChange={(event) => onHaciendaChange({ ...haciendaSetting, district: event.target.value })} />
          <Input placeholder="Barrio" value={haciendaSetting.barrio ?? ''} onChange={(event) => onHaciendaChange({ ...haciendaSetting, barrio: event.target.value })} />
          <Input className="md:col-span-2" placeholder="Otras senas" value={haciendaSetting.other_signs} onChange={(event) => onHaciendaChange({ ...haciendaSetting, other_signs: event.target.value })} />
          <Input placeholder="Email emisor" value={haciendaSetting.email} onChange={(event) => onHaciendaChange({ ...haciendaSetting, email: event.target.value })} />
          <Input placeholder="Sucursal 001" value={haciendaSetting.branch_code} onChange={(event) => onHaciendaChange({ ...haciendaSetting, branch_code: event.target.value })} />
          <Input placeholder="Terminal 00001" value={haciendaSetting.terminal_code} onChange={(event) => onHaciendaChange({ ...haciendaSetting, terminal_code: event.target.value })} />
          <Input placeholder="Ruta certificado .p12" value={haciendaSetting.certificate_path ?? ''} onChange={(event) => onHaciendaChange({ ...haciendaSetting, certificate_path: event.target.value })} />
          <Input placeholder="PIN certificado" type="password" value={haciendaSetting.certificate_pin ?? ''} onChange={(event) => onHaciendaChange({ ...haciendaSetting, certificate_pin: event.target.value })} />
          <Input placeholder="Usuario ATV" value={haciendaSetting.api_username ?? ''} onChange={(event) => onHaciendaChange({ ...haciendaSetting, api_username: event.target.value })} />
          <Input placeholder="Password ATV" type="password" value={haciendaSetting.api_password ?? ''} onChange={(event) => onHaciendaChange({ ...haciendaSetting, api_password: event.target.value })} />
          <Input className="md:col-span-2" placeholder="Callback URL" value={haciendaSetting.callback_url ?? ''} onChange={(event) => onHaciendaChange({ ...haciendaSetting, callback_url: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={haciendaSetting.is_active} onChange={(event) => onHaciendaChange({ ...haciendaSetting, is_active: event.target.checked })} />
            Activa
          </label>
          <Button onClick={onSaveHacienda} disabled={loading}>
            <Landmark size={18} />
            Guardar Hacienda
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Sucursales</div>
          {branches.map((branch) => (
            <div key={branch.id} className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold">{branch.name}</span>
              <span className="text-slate-500">{branch.code}</span>
            </div>
          ))}
        </Card>
        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Configuraciones guardadas</div>
          {settings.map((setting) => (
            <div key={setting.id} className="grid grid-cols-[120px_1fr] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold">{translateSettingKey(setting.key)}</span>
              <span className="truncate text-slate-500">{translateSettingValue(setting.key, setting.value)}</span>
            </div>
          ))}
          {settings.length === 0 && <Empty text="Aún no hay configuraciones guardadas." />}
        </Card>
      </div>
    </div>
  )
}
