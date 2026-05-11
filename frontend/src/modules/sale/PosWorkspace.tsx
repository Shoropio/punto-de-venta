import { Banknote, CreditCard, Lock, MessageSquare, Minus, MoreHorizontal, PackageSearch, Percent, Plus, ReceiptText, RotateCcw, Search, Trash2, UserRound, X } from 'lucide-react'
import { currency } from '../../lib/utils'
import type { PaymentMethod } from '../../types'
import { type Product, usePosStore } from '../../store/usePosStore'
import { PosAction } from '../../components/pos/PosAction'

export function PosWorkspace({
  products,
  cart,
  subtotal,
  discount,
  tax,
  total,
  loading,
  isDarkTheme,
  statusMessage,
  selectedCustomerName,
  cashSessionOpen,
  paymentMethod,
  onAdd,
  onRefresh,
  onFocusSearch,
  onClear,
  onCharge,
  onRemove,
  onRemoveLast,
  onCancelOrder,
  onSetPayment,
  onUpdateQuantity,
  onIncrementLast,
  onApplyDiscount,
  onToggleCashSession,
  onSaveSale,
  onRestoreSale,
  onOpenCustomers,
  onClearCustomer,
  onOpenRefunds,
  onLock,
  onMessage,
  onBlocked,
}: {
  products: Product[]
  cart: ReturnType<typeof usePosStore.getState>['cart']
  subtotal: number
  discount: number
  tax: number
  total: number
  loading: boolean
  isDarkTheme: boolean
  statusMessage: string
  selectedCustomerName?: string
  cashSessionOpen: boolean
  paymentMethod: PaymentMethod
  onAdd: (product: Product) => void
  onRefresh: () => void
  onFocusSearch: () => void
  onClear: () => void
  onCharge: () => void
  onRemove: (productId: number) => void
  onRemoveLast: () => void
  onCancelOrder: () => void
  onSetPayment: (method: PaymentMethod) => void
  onUpdateQuantity: (productId: number, quantity: number) => void
  onIncrementLast: () => void
  onApplyDiscount: () => void
  onToggleCashSession: () => void
  onSaveSale: () => void
  onRestoreSale: () => void
  onOpenCustomers: () => void
  onClearCustomer: () => void
  onOpenRefunds: () => void
  onLock: () => void
  onMessage: (message: string) => void
  onBlocked: (message?: string) => void
}) {
  const methodLabels: Record<PaymentMethod, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    mixed: 'Mixto',
    transfer: 'Transfer',
    credit: 'Credito',
  }
  const handleSearch = () => {
    onRefresh()
    onFocusSearch()
  }

  return (
    <div className={isDarkTheme ? 'grid min-h-0 flex-1 overflow-hidden bg-[#202020] text-white xl:grid-cols-[minmax(0,1fr)_536px]' : 'grid min-h-0 flex-1 overflow-hidden bg-stone-50 text-stone-950 xl:grid-cols-[minmax(0,1fr)_536px]'}>
      <section className={isDarkTheme ? 'flex min-h-0 min-w-0 flex-col border-r border-[#4b4b4b]' : 'flex min-h-0 min-w-0 flex-col border-r border-stone-300'}>
        <div className={isDarkTheme ? 'grid grid-cols-[minmax(260px,1fr)_100px_108px_120px_48px] border-b border-[#4b4b4b] bg-[#1b1b1b] px-3 py-2 text-xs font-bold' : 'grid grid-cols-[minmax(260px,1fr)_100px_108px_120px_48px] border-b border-stone-300 bg-stone-200 px-3 py-2 text-xs font-bold'}>
          <span>Producto</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Precio</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className={isDarkTheme ? 'flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center text-stone-400' : 'flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center text-stone-500'}>
              <strong className={isDarkTheme ? 'text-2xl text-stone-300' : 'text-2xl text-stone-600'}>No hay articulos</strong>
              <span className="mt-2 max-w-2xl text-sm">Busca, escanea o selecciona un producto para iniciar la venta.</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className={isDarkTheme ? 'grid grid-cols-[minmax(260px,1fr)_100px_108px_120px_48px] items-center border-b border-[#333] px-3 py-2 text-[13px]' : 'grid grid-cols-[minmax(260px,1fr)_100px_108px_120px_48px] items-center border-b border-stone-200 px-3 py-2 text-[13px]'}>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className={isDarkTheme ? 'text-[11px] text-stone-500' : 'text-[11px] text-stone-500'}>{item.sku}</p>
                </div>
                <div className="flex justify-end">
                  <div className={isDarkTheme ? 'grid grid-cols-[28px_38px_28px] border border-[#4b4b4b]' : 'grid grid-cols-[28px_38px_28px] border border-stone-300'}>
                    <button className={isDarkTheme ? 'h-7 text-stone-300 hover:bg-[#303030]' : 'h-7 text-stone-600 hover:bg-stone-100'} onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} aria-label={`Restar ${item.name}`}>
                      <Minus className="mx-auto" size={12} />
                    </button>
                    <span className={isDarkTheme ? 'grid h-7 place-items-center border-x border-[#4b4b4b] font-bold' : 'grid h-7 place-items-center border-x border-stone-300 font-bold'}>{item.quantity}</span>
                    <button className={isDarkTheme ? 'h-7 text-stone-300 hover:bg-[#303030]' : 'h-7 text-stone-600 hover:bg-stone-100'} onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} aria-label={`Sumar ${item.name}`}>
                      <Plus className="mx-auto" size={12} />
                    </button>
                  </div>
                </div>
                <span className="text-right">{currency.format(item.salePrice)}</span>
                <span className="text-right font-bold">{currency.format(item.salePrice * item.quantity - item.discount)}</span>
                <button className={isDarkTheme ? 'grid h-8 place-items-center text-stone-400 hover:bg-red-900/40 hover:text-white' : 'grid h-8 place-items-center text-stone-500 hover:bg-red-50 hover:text-red-700'} onClick={() => onRemove(item.id)} aria-label={`Quitar ${item.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className={isDarkTheme ? 'shrink-0 border-t border-[#4b4b4b] bg-[#2a2a2a]' : 'shrink-0 border-t border-stone-300 bg-stone-100'}>
          <div className={isDarkTheme ? 'grid gap-1.5 border-b border-[#3b3b3b] p-2 md:grid-cols-3' : 'grid gap-1.5 border-b border-stone-300 p-2 md:grid-cols-3'}>
            {products.slice(0, 6).map((product) => {
              const outOfStock = product.stock <= 0
              return (
                <button
                  key={product.id}
                  className={outOfStock
                    ? isDarkTheme
                      ? 'cursor-not-allowed border border-red-700/70 bg-red-950/40 p-2 text-left text-red-100 opacity-90'
                      : 'cursor-not-allowed border border-red-300 bg-red-50 p-2 text-left text-red-800 opacity-90'
                    : isDarkTheme
                      ? 'border border-[#4b4b4b] bg-[#242424] p-2 text-left hover:bg-[#303030]'
                      : 'border border-stone-300 bg-white p-2 text-left hover:bg-stone-200'}
                  onClick={() => outOfStock ? onBlocked(`${product.name} no tiene stock disponible.`) : onAdd(product)}
                  aria-disabled={outOfStock || undefined}
                  title={outOfStock ? 'Sin stock disponible' : undefined}
                >
                  <span className="block truncate text-[13px] font-semibold">{product.name}</span>
                  <span className={outOfStock ? 'mt-0.5 block text-[11px] font-bold text-red-600 dark:text-red-300' : 'mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400'}>
                    {product.sku} - {outOfStock ? 'Sin stock' : currency.format(product.salePrice)}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-[1fr_200px] gap-3 p-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs uppercase text-slate-500">
                <span>Productos encontrados: {products.length}</span>
                {selectedCustomerName && (
                  <button className="text-[#38bdf8] hover:text-white" onClick={onClearCustomer} title="Quitar cliente de la venta">
                    Cliente: {selectedCustomerName}
                  </button>
                )}
              </div>
              <div className={isDarkTheme ? 'border border-[#454545] bg-[#242424] px-3 py-1.5 text-xs text-stone-300' : 'border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-600'}>{statusMessage}</div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span>{currency.format(subtotal)}</span></div>
              <div className="flex justify-between"><span>Descuentos</span><span>{currency.format(discount)}</span></div>
              <div className="flex justify-between"><span>Impuestos (IVA 13%)</span><span>{currency.format(tax)}</span></div>
              <div className={isDarkTheme ? 'flex justify-between border-t border-[#555] pt-1.5 text-xl font-bold' : 'flex justify-between border-t border-stone-300 pt-1.5 text-xl font-bold'}><span>Total</span><span>{currency.format(total)}</span></div>
            </div>
          </div>
        </div>
      </section>

      <aside className={isDarkTheme ? 'flex min-h-0 flex-col gap-1 overflow-y-auto bg-[#2d2d2d] p-1 print:hidden' : 'flex min-h-0 flex-col gap-1 overflow-y-auto bg-stone-200 p-1 print:hidden'}>
        <div className="grid shrink-0 grid-cols-4 auto-rows-[68px] gap-1">
          <PosAction icon={X} label="Eliminar" onClick={onRemoveLast} disabled={cart.length === 0} onBlocked={() => onBlocked('No hay articulos para eliminar.')} muted />
          <PosAction icon={Search} label="Buscar" shortcut="F3" onClick={handleSearch} />
          <PosAction icon={Plus} label="Cantidad" shortcut="F4" onClick={onIncrementLast} disabled={cart.length === 0} onBlocked={() => onBlocked('Agrega un producto antes de cambiar cantidad.')} />
          <PosAction icon={ReceiptText} label="Nueva venta" shortcut="F8" onClick={onClear} disabled={cart.length === 0} onBlocked={() => onBlocked('No hay una venta activa para limpiar.')} />
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-1">
          {(['cash', 'card', 'mixed'] as const).map((method) => (
            <button
              key={method}
              className={`h-12 border border-[#575757] bg-[#1f1f1f] text-xs font-semibold text-white hover:bg-[#333] ${paymentMethod === method ? 'border-b-2 border-b-[#0088cc]' : ''}`}
              onClick={() => onSetPayment(method)}
            >
              {methodLabels[method]}
            </button>
          ))}
        </div>

        <div className={isDarkTheme ? 'min-h-0 flex-1 border border-[#3b3b3b] bg-[#252525]' : 'min-h-0 flex-1 border border-stone-300 bg-stone-100'} />

        <div className="grid shrink-0 grid-cols-4 auto-rows-[68px] gap-1">
          <PosAction icon={Banknote} label={cashSessionOpen ? 'Cerrar caja' : 'Abrir caja'} onClick={onToggleCashSession} />
          <PosAction icon={Percent} label="Descuento" shortcut="F2" onClick={onApplyDiscount} disabled={cart.length === 0} onBlocked={() => onBlocked('Agrega productos antes de aplicar descuento.')} />
          <PosAction icon={UserRound} label="Cliente" onClick={onOpenCustomers} />
          <PosAction icon={RotateCcw} label="Devolución" onClick={onOpenRefunds} />

          <PosAction icon={MessageSquare} label="Nota" onClick={() => onMessage('Comentario agregado a la orden actual.')} />
          <PosAction icon={PackageSearch} label="En espera" shortcut="F9" onClick={onSaveSale} disabled={cart.length === 0} onBlocked={() => onBlocked('No hay articulos para guardar.')} />
          <PosAction icon={MoreHorizontal} label="Recuperar" onClick={onRestoreSale} />
          <button
            className="row-span-2 border border-[#0088cc] bg-[#0088cc] text-sm font-bold text-white hover:bg-[#0077b3] aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            aria-disabled={loading || !cashSessionOpen || cart.length === 0 || undefined}
            onClick={() => {
              if (loading || !cashSessionOpen || cart.length === 0) {
                onBlocked(!cashSessionOpen ? 'Abre caja antes de cobrar.' : 'Agrega productos antes de cobrar.')
                return
              }
              onCharge()
            }}
          >
            <span className="block text-lg">F10</span>
            {loading ? 'Procesando...' : 'Pago'}
          </button>

          <PosAction icon={Lock} label="Bloquear" onClick={onLock} />
          <PosAction icon={CreditCard} label="Transferir" shortcut="F7" active={paymentMethod === 'transfer'} onClick={() => onSetPayment('transfer')} />
          <button
            className="border border-red-700 bg-red-700 text-xs font-semibold text-white hover:bg-red-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            aria-disabled={cart.length === 0 || undefined}
            onClick={() => {
              if (cart.length === 0) {
                onBlocked('No hay una orden activa para anular.')
                return
              }
              onCancelOrder()
            }}
          >
            <Trash2 className="mx-auto mb-1" size={20} />
            Anular orden
          </button>
        </div>

      </aside>
    </div>
  )
}
