import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X } from 'lucide-react'
import { Button } from '../ui/button'
import { api } from '../../lib/api'

type ChatMessage = {
  role: 'user' | 'model'
  text: string
}

const WELCOME_MESSAGE: ChatMessage = { role: 'model', text: 'Hola! Soy Facturito, tu asistente inteligente. Preguntame sobre ventas, inventario, facturacion o lo que necesites.' }

export function FacturitoChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }))
      const response = await api<{ reply: string }>('/facturito/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, history }),
      })
      setMessages((prev) => [...prev, { role: 'model', text: response.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: 'Lo siento, hubo un error al procesar tu consulta. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[500px] w-[380px] flex-col border-l border-t border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#0088cc] px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-white" />
          <span className="text-sm font-bold text-white">Facturito</span>
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">IA</span>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[#0088cc] text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800">
              <span className="animate-pulse">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0088cc] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="Escribe tu pregunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}><Send size={16} /></Button>
        </div>
      </div>
    </div>
  )
}
