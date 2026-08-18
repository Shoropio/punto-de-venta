import { useState } from 'react'
import { Printer, Settings, Wifi, WifiOff } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { SelectBox } from '../../components/shared/SelectBox'
import { StatusTile } from '../../components/shared/StatusTile'
import { thermalPrinter } from '../../lib/printer'

export function PrinterModule({ printerName, receiptWidth, autoPrint, loading, hasReceipt, onPrinterName, onReceiptWidth, onAutoPrint, onSave, onTest }: {
  printerName: string
  receiptWidth: string
  autoPrint: string
  loading: boolean
  hasReceipt: boolean
  onPrinterName: (value: string) => void
  onReceiptWidth: (value: string) => void
  onAutoPrint: (value: string) => void
  onSave: () => void
  onTest: () => void
}) {
  const [connected, setConnected] = useState(thermalPrinter.isConnected())
  const [connecting, setConnecting] = useState(false)
  const [connectMethod, setConnectMethod] = useState<'serial' | 'bluetooth'>('serial')

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const width = Number(receiptWidth) === 58 ? 58 : 80
      thermalPrinter.setPaperWidth(width)
      await thermalPrinter.connect(connectMethod)
      setConnected(true)
    } catch (err) {
      console.error('Connection failed:', err)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    await thermalPrinter.disconnect()
    setConnected(false)
  }

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_140px_160px_auto_auto]">
        <Input placeholder="Nombre de impresora" value={printerName} onChange={(event) => onPrinterName(event.target.value)} />
        <Input placeholder="Ancho mm" type="number" value={receiptWidth} onChange={(event) => onReceiptWidth(event.target.value)} />
        <SelectBox value={autoPrint} onChange={onAutoPrint}>
          <option value="no">Auto imprimir: no</option>
          <option value="yes">Auto imprimir: si</option>
        </SelectBox>
        <Button onClick={onSave} disabled={loading}><Settings size={18} /> Guardar</Button>
        <Button variant="secondary" onClick={onTest} disabled={!hasReceipt}><Printer size={18} /> Prueba</Button>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-bold">Conexion de impresora</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectBox value={connectMethod} onChange={(v) => setConnectMethod(v as 'serial' | 'bluetooth')}>
            <option value="serial">USB Serial (Web Serial API)</option>
            <option value="bluetooth">Bluetooth (Web Bluetooth API)</option>
          </SelectBox>
          {connected ? (
            <Button variant="danger" onClick={handleDisconnect}><WifiOff size={18} /> Desconectar</Button>
          ) : (
            <Button onClick={handleConnect} disabled={connecting}><Wifi size={18} /> {connecting ? 'Conectando...' : 'Conectar'}</Button>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-bold">Perfil ESC/POS</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <StatusTile label="Estado" value={connected ? 'Conectado' : 'Desconectado'} />
          <StatusTile label="Conector" value={connectMethod === 'serial' ? 'USB Serial' : 'Bluetooth'} />
          <StatusTile label="Ancho" value={`${receiptWidth} mm`} />
        </div>
      </Card>
    </div>
  )
}
