import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

interface ConfirmDialogProps {
  isDarkTheme: boolean
  loading: boolean
  title: string
  message: string
  tone?: 'danger' | 'primary'
  confirmLabel?: string
  onConfirm: () => void
  onDismiss: () => void
}

export function ConfirmDialog({ isDarkTheme, loading, title, message, tone, confirmLabel, onConfirm, onDismiss }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 print:hidden">
      <Card className={isDarkTheme ? 'w-full max-w-md border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'w-full max-w-md p-5'}>
        <p className={tone === 'danger' ? 'text-sm font-semibold text-red-400' : 'text-sm font-semibold text-[#0088cc]'}>Confirmacion requerida</p>
        <h2 className="mt-1 text-2xl font-bold">{title}</h2>
        <p className={isDarkTheme ? 'mt-2 text-sm text-stone-300' : 'mt-2 text-sm text-stone-600'}>{message}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onDismiss} disabled={loading}>Cancelar</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {confirmLabel ?? 'Confirmar'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
