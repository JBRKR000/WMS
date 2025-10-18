import { type FC, useMemo, useState } from 'react'
import { Search, FileText, AlertTriangle, Box } from 'lucide-react'

// Use backend Transaction model fields only
type Category = { id?: number | null; name: string }
type Item = {
  id?: number | null
  name: string
  description?: string | null
  category?: Category | null
  unit?: string | null
  currentQuantity?: number
}
type Role = { id?: number | null; roleName: string }
type User = { id?: number | null; username: string; email?: string; role?: Role | null }
type Transaction = {
  id?: number | null
  transactionDate?: string | null
  transactionType: string
  item?: Item | null
  quantity: number
  user?: User | null
  description?: string | null
}

// Alert entry derived from existing models (no separate alerts table)
type AlertEntry = {
  id?: number | null
  source: 'transaction' | 'item'
  message: string
  createdAt?: string | null
  transaction?: Transaction | null
  item?: Item | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak danych' }) => (
  <div className="py-8 text-center text-sm text-secondary">
    <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <FileText className="w-7 h-7 text-secondary" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Brak rekordów do wyświetlenia</div>
  </div>
)

const Alerts: FC = () => {
  // Replace with API data (transactions)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'transaction' | 'item'>('all')

  // sample empty list; replace by server-side alerts derived from transactions/items
  const alerts: AlertEntry[] = []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return alerts.filter(a => {
      if (sourceFilter !== 'all' && a.source !== sourceFilter) return false
      if (!q) return true
      return (
        String(a.id).includes(q) ||
        a.message.toLowerCase().includes(q) ||
        (a.item?.name ?? '').toLowerCase().includes(q) ||
        (a.transaction?.transactionType ?? '').toLowerCase().includes(q)
      )
    })
  }, [alerts, query, sourceFilter])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  const sourceBadge = (s: AlertEntry['source']) => {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-main'
    return s === 'transaction'
      ? <span className={`${base} bg-surface-hover text-main`}><AlertTriangle className="w-3 h-3 mr-1"/>Transakcja</span>
      : <span className={`${base} bg-surface-secondary text-secondary`}><Box className="w-3 h-3 mr-1"/>Item</span>
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-main">Wydarzenia / Transakcje (źródło danych)</h2>
          <p className="text-sm text-secondary mt-1">Widok oparty bezpośrednio na modelu Transaction</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-surface border border-main rounded-2xl px-2 py-1 w-full sm:w-64">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj po ID, item, user, typ, wiadomość" className="w-full px-4 py-2 bg-surface rounded-2xl text-main placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm" />
          </div>

          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as any)} className="px-3 py-2 bg-surface border border-main rounded-2xl text-sm text-main">
            <option value="all">Wszystkie źródła</option>
            <option value="transaction">Transakcja</option>
            <option value="item">Item</option>
          </select>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-secondary">Pola: source, message, createdAt, transaction/item details</div>
          <div className="text-sm text-secondary">Ilość alertów: {filtered.length}</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState label="Brak alertów" />
        ) : (
          <ul className="space-y-3">
            {filtered.map((a, idx) => (
              <li key={a.id ?? idx} className={`flex items-start gap-3 p-3 rounded-lg bg-surface border border-main`}> 
                <div className="mt-1">
                  {a.source === 'transaction' ? <AlertTriangle className="w-6 h-6 text-error-text"/> : <Box className="w-6 h-6 text-secondary"/>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-secondary">ID: {a.id ?? '-'}</div>
                      <div>{sourceBadge(a.source)}</div>
                    </div>
                    <div className="text-xs text-secondary">{formatDate(a.createdAt)}</div>
                  </div>
                  <div className="mt-2">
                    <p className="text-main font-medium">{a.message}</p>
                    {a.source === 'transaction' && a.transaction && (
                      <div className="text-xs text-secondary mt-1">Typ: {a.transaction.transactionType} • Ilość: {a.transaction.quantity} • Użytkownik: {a.transaction.user?.username ?? '-'}</div>
                    )}
                    {a.source === 'item' && a.item && (
                      <div className="text-xs text-secondary mt-1">Pozycja: {a.item.name} • Ilość: {a.item.currentQuantity ?? '-'} {a.item.unit ?? ''}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="px-3 py-1 rounded-md bg-surface-hover border border-main text-main text-sm hover:bg-surface-secondary">Szczegóły</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default Alerts
