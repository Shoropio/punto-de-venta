import { ReceiptText, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ToastViewport } from '../components/shared'
import type { ToastMessage } from '../types'

interface LoginScreenProps {
  isDarkTheme: boolean
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  loading: boolean
  login: () => void
  loginWithGoogle: () => void
  message: string
  toasts: ToastMessage[]
  dismissToast: (id: number) => void
}

export function LoginScreen({
  isDarkTheme, email, setEmail, password, setPassword,
  loading, login, loginWithGoogle, message, toasts, dismissToast,
}: LoginScreenProps) {
  return (
    <main className={isDarkTheme ? 'grid min-h-screen place-items-center bg-[#202020] p-5 text-white' : 'grid min-h-screen place-items-center bg-stone-100 p-5 text-stone-950'}>
      <Card className={isDarkTheme ? 'w-full max-w-md border-[#4b4b4b] bg-[#2d2d2d] p-6 text-white' : 'w-full max-w-md p-6'}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-none bg-[#202020] text-white">
            <ReceiptText size={24} />
          </div>
          <div>
            <p className={isDarkTheme ? 'text-sm font-semibold text-stone-300' : 'text-sm font-semibold text-stone-700'}>POS profesional</p>
            <h1 className="text-2xl font-bold">Iniciar sesion</h1>
          </div>
        </div>
        <div className="space-y-3">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contrasena" type="password" />
          <Button className="w-full" onClick={login} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            Entrar
          </Button>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-stone-300 dark:border-[#4b4b4b]"></div>
            <span className="flex-shrink mx-4 text-stone-500 text-xs uppercase">o</span>
            <div className="flex-grow border-t border-stone-300 dark:border-[#4b4b4b]"></div>
          </div>
          <Button
            className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-white flex items-center justify-center gap-2"
            onClick={() => loginWithGoogle()}
            disabled={loading}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" style={{ minWidth: '16px' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </Button>
        </div>
        <p className={isDarkTheme ? 'mt-4 bg-[#242424] p-3 text-sm text-stone-300' : 'mt-4 bg-stone-50 p-3 text-sm text-stone-600'}>{message}</p>
      </Card>
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}
