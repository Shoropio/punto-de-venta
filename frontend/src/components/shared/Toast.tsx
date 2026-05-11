import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import type { ToastMessage } from '../../types'

export function ToastViewport({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-50 grid w-[min(420px,calc(100vw-2rem))] gap-2 print:hidden">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const toneClass = toast.tone === 'success'
    ? 'border-[#0088cc] bg-[#0b2a3a] text-white'
    : toast.tone === 'error'
      ? 'border-red-700 bg-red-950 text-red-50'
      : 'border-[#575757] bg-[#2b2b2b] text-white'
  const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertTriangle : Info
  const title = toast.tone === 'success' ? 'Correcto' : toast.tone === 'error' ? 'Error' : 'Informacion'

  return (
    <div className={`grid grid-cols-[auto_1fr_auto] items-start gap-3 border px-4 py-3 shadow-lg ${toneClass}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 shrink-0" size={19} />
      <div>
        <p className="text-xs font-bold uppercase opacity-75">{title}</p>
        <p className="text-sm font-medium leading-5">{toast.text}</p>
      </div>
      <button className="grid h-6 w-6 place-items-center text-white/80 hover:bg-white/10 hover:text-white" aria-label="Cerrar aviso" onClick={() => onDismiss(toast.id)}>
        <X size={16} />
      </button>
    </div>
  )
}
