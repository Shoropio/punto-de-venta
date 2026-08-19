import { useState } from 'react'
import { BookOpen, Building2, FileSpreadsheet, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import { SelectBox } from '../../components/shared/SelectBox'
import { currency } from '../../lib/utils'

export type AccountingAccount = {
  id: number
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  is_active: boolean
}

export type AccountingEntry = {
  id: number
  description: string
  entry_date: string
  reference?: string
  source_type?: string
}

export type AccountingItem = {
  id: number
  entry_id: number
  account_id: number
  debit: number
  credit: number
  description?: string
  code: string
  account_name: string
  account_type: string
}

export type TrialBalanceRow = {
  code: string
  name: string
  type: string
  total_debit: number
  total_credit: number
  balance: number
}

export type BankAccount = {
  id: number
  bank_name: string
  account_number?: string
  account_type?: string
  currency: string
  balance: number
  is_active: boolean
}

export type StatementLine = {
  id: number
  bank_account_id: number
  transaction_date: string
  description: string
  amount: number
  transaction_type: string
  reference?: string
  is_reconciled: boolean
}

export type EntryDetailResponse = {
  entry: AccountingEntry
  items: AccountingItem[]
}

export type TrialBalanceResponse = {
  rows: TrialBalanceRow[]
  total_debit: number
  total_credit: number
  balanced: boolean
}

type Tab = 'accounts' | 'entries' | 'balance' | 'banks'

const typeLabels: Record<string, string> = {
  asset: 'Activo',
  liability: 'Pasivo',
  equity: 'Capital',
  income: 'Ingreso',
  expense: 'Egreso',
}

const typeColors: Record<string, string> = {
  asset: 'text-emerald-600',
  liability: 'text-red-500',
  equity: 'text-blue-600',
  income: 'text-green-600',
  expense: 'text-orange-500',
}

export function AccountingModule({
  accounts,
  entries,
  entryDetail,
  trialBalance,
  bankAccounts,
  statementLines,
  newAccountCode,
  newAccountName,
  newAccountType,
  newBankName,
  newBankNumber,
  newBankType,
  loading,
  onNewAccountCode,
  onNewAccountName,
  onNewAccountType,
  onCreateAccount,
  onNewBankName,
  onNewBankNumber,
  onNewBankType,
  onCreateBank,
  onViewEntry,
  onImportStatement,
  onCreateEntry,
}: {
  accounts: AccountingAccount[]
  entries: AccountingEntry[]
  entryDetail: EntryDetailResponse | null
  trialBalance: TrialBalanceResponse | null
  bankAccounts: BankAccount[]
  statementLines: StatementLine[]
  newAccountCode: string
  newAccountName: string
  newAccountType: string
  newBankName: string
  newBankNumber: string
  newBankType: string
  loading: boolean
  onNewAccountCode: (v: string) => void
  onNewAccountName: (v: string) => void
  onNewAccountType: (v: string) => void
  onCreateAccount: () => void
  onNewBankName: (v: string) => void
  onNewBankNumber: (v: string) => void
  onNewBankType: (v: string) => void
  onCreateBank: () => void
  onViewEntry: (id: number) => void
  onImportStatement: (bankAccountId: number, file: File, format: string) => void
  onCreateEntry: (description: string, entryDate: string, items: { account_id: number; debit: number; credit: number }[]) => void
}) {
  const [tab, setTab] = useState<Tab>('accounts')
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [entryForm, setEntryForm] = useState({ description: '', entry_date: new Date().toISOString().slice(0, 10), items: [{ account_id: 0, debit: 0, credit: 0 }] })

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: 'accounts', label: 'Cuentas', icon: BookOpen },
    { key: 'entries', label: 'Diario', icon: FileSpreadsheet },
    { key: 'balance', label: 'Balance', icon: RefreshCw },
    { key: 'banks', label: 'Bancos', icon: Building2 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition ${tab === t.key ? 'border-b-2 border-[#0088cc] text-[#0088cc]' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' && (
        <div className="space-y-4">
          <Card className="grid gap-3 p-4 md:grid-cols-[100px_1fr_160px_auto]">
            <Input placeholder="Codigo" value={newAccountCode} onChange={(e) => onNewAccountCode(e.target.value)} />
            <Input placeholder="Nombre de la cuenta" value={newAccountName} onChange={(e) => onNewAccountName(e.target.value)} />
            <SelectBox value={newAccountType} onChange={(e) => onNewAccountType(e.target.value)}>
              <option value="">Tipo</option>
              <option value="asset">Activo</option>
              <option value="liability">Pasivo</option>
              <option value="equity">Capital</option>
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
            </SelectBox>
            <Button onClick={onCreateAccount} disabled={loading}><Plus size={16} /> Agregar</Button>
          </Card>

          <DataCard title="Catalogo de Cuentas" empty="No hay cuentas registradas.">
            {accounts.map((account) => (
              <div key={account.id} className="grid grid-cols-[80px_1fr_120px] items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm">
                <span className="font-mono font-bold">{account.code}</span>
                <span>{account.name}</span>
                <span className={`text-xs font-semibold ${typeColors[account.type] ?? 'text-slate-500'}`}>{typeLabels[account.type] ?? account.type}</span>
              </div>
            ))}
          </DataCard>
        </div>
      )}

      {tab === 'entries' && (
        <div className="space-y-4">
          {selectedEntryId && entryDetail ? (
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Asiento #{entryDetail.entry.id}</p>
                  <p className="text-lg font-bold">{entryDetail.entry.description}</p>
                  <p className="text-sm text-slate-500">{entryDetail.entry.entry_date}</p>
                </div>
                <Button variant="ghost" onClick={() => { setSelectedEntryId(null) }}>Volver</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-500">
                      <th className="px-3 py-2">Cuenta</th>
                      <th className="px-3 py-2">Descripcion</th>
                      <th className="px-3 py-2 text-right">Debito</th>
                      <th className="px-3 py-2 text-right">Credito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entryDetail.items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2"><span className="font-mono font-bold">{item.code}</span> {item.account_name}</td>
                        <td className="px-3 py-2 text-slate-500">{item.description || '-'}</td>
                        <td className="px-3 py-2 text-right font-mono">{item.debit > 0 ? currency.format(item.debit) : ''}</td>
                        <td className="px-3 py-2 text-right font-mono">{item.credit > 0 ? currency.format(item.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-bold">
                      <td className="px-3 py-2" colSpan={2}>Totales</td>
                      <td className="px-3 py-2 text-right font-mono">{currency.format(entryDetail.items.reduce((sum, i) => sum + i.debit, 0))}</td>
                      <td className="px-3 py-2 text-right font-mono">{currency.format(entryDetail.items.reduce((sum, i) => sum + i.credit, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          ) : (
            <>
              {!showEntryForm ? (
                <Card className="flex items-center justify-between p-4">
                  <p className="text-sm text-slate-500">Registrar un asiento contable manual de doble partida.</p>
                  <Button onClick={() => setShowEntryForm(true)}><Plus size={16} /> Nuevo asiento</Button>
                </Card>
              ) : (
                <Card className="p-4">
                  <h3 className="mb-3 font-bold">Nuevo Asiento Manual</h3>
                  <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                    <Input placeholder="Descripcion del asiento" value={entryForm.description} onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })} />
                    <Input type="date" value={entryForm.entry_date} onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {entryForm.items.map((item, idx) => (
                      <div key={idx} className="grid items-center gap-2 md:grid-cols-[1fr_120px_120px_40px]">
                        <SelectBox value={String(item.account_id)} onChange={(v) => { const items = [...entryForm.items]; items[idx] = { ...items[idx], account_id: Number(v) }; setEntryForm({ ...entryForm, items }) }}>
                          <option value="0">Seleccionar cuenta</option>
                          {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </SelectBox>
                        <Input placeholder="Debito" type="number" min="0" value={item.debit || ''} onChange={(e) => { const items = [...entryForm.items]; items[idx] = { ...items[idx], debit: Number(e.target.value) }; setEntryForm({ ...entryForm, items }) }} />
                        <Input placeholder="Credito" type="number" min="0" value={item.credit || ''} onChange={(e) => { const items = [...entryForm.items]; items[idx] = { ...items[idx], credit: Number(e.target.value) }; setEntryForm({ ...entryForm, items }) }} />
                        {entryForm.items.length > 2 && <Button variant="ghost" className="h-8 px-2" onClick={() => setEntryForm({ ...entryForm, items: entryForm.items.filter((_, i) => i !== idx) })}><Trash2 size={14} /></Button>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setEntryForm({ ...entryForm, items: [...entryForm.items, { account_id: 0, debit: 0, credit: 0 }] })}><Plus size={14} /> Linea</Button>
                    <span className="text-xs text-slate-500">Debitos: {currency.format(entryForm.items.reduce((s, i) => s + i.debit, 0))} | Creditos: {currency.format(entryForm.items.reduce((s, i) => s + i.credit, 0))}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => { onCreateEntry(entryForm.description, entryForm.entry_date, entryForm.items); setShowEntryForm(false); setEntryForm({ description: '', entry_date: new Date().toISOString().slice(0, 10), items: [{ account_id: 0, debit: 0, credit: 0 }] }) }} disabled={loading || !entryForm.description || entryForm.items.length < 2}>Crear asiento</Button>
                    <Button variant="secondary" onClick={() => setShowEntryForm(false)}>Cancelar</Button>
                  </div>
                </Card>
              )}
              <DataCard title="Libro Diario" empty="No hay asientos contables.">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    className="grid w-full grid-cols-[80px_1fr_120px] items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                    onClick={() => { setSelectedEntryId(entry.id); onViewEntry(entry.id) }}
                  >
                    <span className="font-mono font-bold">#{entry.id}</span>
                  <span>{entry.description}</span>
                  <span className="text-slate-500">{entry.entry_date}</span>
                </button>
              ))}
            </DataCard>
          )}
        </div>
      )}

      {tab === 'balance' && (
        <div className="space-y-4">
          {trialBalance ? (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase text-slate-500">Balance de Comprobacion</p>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${trialBalance.balanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {trialBalance.balanced ? 'CUADRADO' : 'DESCUADRADO'}
                  </span>
                </div>
              </Card>

              <DataCard title="" empty="No hay datos.">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-500">
                        <th className="px-4 py-2">Codigo</th>
                        <th className="px-4 py-2">Cuenta</th>
                        <th className="px-4 py-2">Tipo</th>
                        <th className="px-4 py-2 text-right">Debito</th>
                        <th className="px-4 py-2 text-right">Credito</th>
                        <th className="px-4 py-2 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialBalance.rows.map((row, index) => (
                        <tr key={index} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-mono font-bold">{row.code}</td>
                          <td className="px-4 py-2">{row.name}</td>
                          <td className="px-4 py-2 text-xs font-semibold">{typeLabels[row.type] ?? row.type}</td>
                          <td className="px-4 py-2 text-right font-mono">{row.total_debit > 0 ? currency.format(row.total_debit) : '-'}</td>
                          <td className="px-4 py-2 text-right font-mono">{row.total_credit > 0 ? currency.format(row.total_credit) : '-'}</td>
                          <td className="px-4 py-2 text-right font-mono font-bold">{currency.format(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 font-bold">
                        <td className="px-4 py-2" colSpan={3}>Totales</td>
                        <td className="px-4 py-2 text-right font-mono">{currency.format(trialBalance.total_debit)}</td>
                        <td className="px-4 py-2 text-right font-mono">{currency.format(trialBalance.total_credit)}</td>
                        <td className="px-4 py-2 text-right font-mono">{currency.format(trialBalance.total_debit - trialBalance.total_credit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </DataCard>
            </>
          ) : (
            <Card className="p-8 text-center text-slate-500">
              <RefreshCw size={32} className="mx-auto mb-2 opacity-30" />
              <p>No hay datos de balance disponibles.</p>
            </Card>
          )}
        </div>
      )}

      {tab === 'banks' && (
        <div className="space-y-4">
          <Card className="grid gap-3 p-4 md:grid-cols-[1fr_150px_120px_auto]">
            <Input placeholder="Nombre del banco" value={newBankName} onChange={(e) => onNewBankName(e.target.value)} />
            <Input placeholder="Numero de cuenta" value={newBankNumber} onChange={(e) => onNewBankNumber(e.target.value)} />
            <SelectBox value={newBankType} onChange={(e) => onNewBankType(e.target.value)}>
              <option value="">Tipo</option>
              <option value="corriente">Corriente</option>
              <option value="ahorro">Ahorro</option>
            </SelectBox>
            <Button onClick={onCreateBank} disabled={loading}><Plus size={16} /> Agregar</Button>
          </Card>

          <DataCard title="Cuentas Bancarias" empty="No hay cuentas bancarias registradas.">
            {bankAccounts.map((bank) => (
              <div key={bank.id} className="grid grid-cols-[1fr_120px_120px_100px] items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-bold">{bank.bank_name}</p>
                  <p className="text-xs text-slate-500">{bank.account_number || 'Sin numero'} - {bank.account_type || '-'}</p>
                </div>
                <span className="text-xs font-semibold">{bank.currency}</span>
                <span className="text-right font-mono font-bold">{currency.format(bank.balance)}</span>
                <span className={`text-xs font-semibold ${bank.is_active ? 'text-emerald-600' : 'text-red-500'}`}>{bank.is_active ? 'Activa' : 'Inactiva'}</span>
              </div>
            ))}
          </DataCard>

          {bankAccounts.length > 0 && (
            <Card className="p-4">
              <p className="mb-3 text-xs font-bold uppercase text-slate-500">Importar estado de cuenta</p>
              <div className="flex items-end gap-3">
                <SelectBox value="" onChange={() => {}}>
                  <option value="">Seleccionar cuenta bancaria</option>
                  {bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
                </SelectBox>
                <input
                  type="file"
                  accept=".csv,.ofx"
                  className="text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const format = file.name.endsWith('.ofx') ? 'ofx' : 'csv'
                      onImportStatement(bankAccounts[0].id, file, format)
                    }
                  }}
                />
              </div>
            </Card>
          )}

          {statementLines.length > 0 && (
            <DataCard title="Lineas de Estado de Cuenta" empty="No hay lineas importadas.">
              {statementLines.map((line) => (
                <div key={line.id} className="grid grid-cols-[100px_1fr_120px_100px_80px] items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm">
                  <span className="font-mono text-xs">{line.transaction_date}</span>
                  <span>{line.description}</span>
                  <span className={`text-right font-mono font-bold ${line.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{currency.format(Math.abs(line.amount))}</span>
                  <span className="text-xs text-slate-500">{line.reference || '-'}</span>
                  <span className={`text-xs font-semibold ${line.is_reconciled ? 'text-emerald-600' : 'text-orange-500'}`}>{line.is_reconciled ? 'Conciliado' : 'Pendiente'}</span>
                </div>
              ))}
            </DataCard>
          )}
        </div>
      )}
    </div>
  )
}
