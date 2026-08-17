import { useState } from 'react'
import { MessageCircle, Loader2, Save } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { SelectBox } from './SelectBox'

export type WhatsAppSettings = {
  id?: number
  driver: 'meta' | 'baileys'
  phone_number_id: string
  access_token: string
  baileys_endpoint: string
  is_active: boolean
}

export function WhatsAppConfig({
  settings,
  loading,
  onSave,
}: {
  settings: WhatsAppSettings
  loading: boolean
  onSave: (settings: WhatsAppSettings) => void
}) {
  const [form, setForm] = useState(settings)

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle size={18} className="text-[#25D366]" />
        <p className="text-sm font-bold uppercase text-slate-500">Configuracion WhatsApp</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Driver</label>
          <SelectBox value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value as 'meta' | 'baileys' })}>
            <option value="meta">Meta Cloud API</option>
            <option value="baileys">Baileys Gateway (QR)</option>
          </SelectBox>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Estado</label>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${form.is_active ? 'bg-[#25D366]' : 'bg-slate-300'}`} />
            <span className="text-sm">{form.is_active ? 'Activo' : 'Inactivo'}</span>
          </div>
        </div>
      </div>

      {form.driver === 'meta' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Phone Number ID</label>
            <Input value={form.phone_number_id} onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })} placeholder="ID del numero de WhatsApp" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Access Token</label>
            <Input type="password" value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} placeholder="Token de acceso permanente" />
          </div>
        </div>
      )}

      {form.driver === 'baileys' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Baileys Gateway Endpoint</label>
          <Input value={form.baileys_endpoint} onChange={(e) => setForm({ ...form, baileys_endpoint: e.target.value })} placeholder="http://localhost:3000/send" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={() => onSave(form)} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar configuracion
        </Button>
      </div>
    </Card>
  )
}
