import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'

interface DiscountDialogProps {
  isDarkTheme: boolean
  customDiscountValue: string
  setCustomDiscountValue: (v: string) => void
  confirmCustomDiscount: () => void
  onDismiss: () => void
}

export function DiscountDialog({ isDarkTheme, customDiscountValue, setCustomDiscountValue, confirmCustomDiscount, onDismiss }: DiscountDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
      <Card className={isDarkTheme ? 'w-full max-w-sm border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'w-full max-w-sm p-5'}>
        <div className="mb-4">
          <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Aplicar descuento</p>
          <h2 className="text-xl font-bold">Porcentaje de descuento</h2>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {['5', '10', '15', '20'].map((val) => (
              <Button key={val} variant={customDiscountValue === val ? 'primary' : 'secondary'} onClick={() => setCustomDiscountValue(val)} className="h-10">
                {val}%
              </Button>
            ))}
          </div>
          <Input
            autoFocus
            type="number"
            placeholder="Otro %"
            value={customDiscountValue}
            onChange={(event) => setCustomDiscountValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') confirmCustomDiscount()
              if (event.key === 'Escape') onDismiss()
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onDismiss}>Cancelar</Button>
            <Button onClick={confirmCustomDiscount}>Aplicar</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
