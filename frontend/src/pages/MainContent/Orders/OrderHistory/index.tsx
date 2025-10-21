import { type FC, useEffect, useMemo, useState } from 'react'
import { Search, Archive, Eye, Clock, CheckCircle, AlertCircle, XCircle, Truck, Calendar, User, Filter } from 'lucide-react'
import { TransactionService, type TransactionForOrder } from '../../../../services/transactionService'

type Transaction = TransactionForOrder & {
  item?: { id?: number | null; name: string } | null
  user?: { id?: number | null; username: string } | null
}

const StatusBadge: FC<{ status: string | null }> = ({ status }) => {
  const statusMap: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING: { label: 'Oczekujące', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Clock className="w-4 h-4" /> },
    COMPLETED: { label: 'Zrealizowane', color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> },
    IN_PROGRESS: { label: 'W realizacji', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Truck className="w-4 h-4" /> },
    CANCELLED: { label: 'Anulowane', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> },
    FAILED: { label: 'Błąd', color: 'text-red-700', bg: 'bg-red-100', icon: <AlertCircle className="w-4 h-4" /> },
  }
  
  const config = statusMap[status || ''] || { label: status || '-', color: 'text-gray-700', bg: 'bg-gray-100', icon: null }
  
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak rekordów' }) => (
  <div className="py-12 text-center text-sm text-secondary">
    <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <Archive className="w-8 h-8" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Dopasuj filtry aby znaleźć rekordy</div>
  </div>
)

const OrderHistory: FC = () => {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [view, setView] = useState<'table' | 'timeline'>('table')
  const [detail, setDetail] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const fetchOrderTransactions = async () => {
      try {
        const data = await TransactionService.getOrderTransactions()
        // Filtruj tylko zrealizowane i anulowane zamówienia
        const filteredData = data.filter(t => 
          t.transactionStatus === 'COMPLETED' || t.transactionStatus === 'CANCELLED'
        )
        const mappedData: Transaction[] = filteredData.map(t => ({
          ...t,
          item: t.itemId && t.itemName ? { id: t.itemId, name: t.itemName } : null,
          user: t.userId && t.userName ? { id: t.userId, username: t.userName } : null,
        }))
        setTransactions(mappedData)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    }
    fetchOrderTransactions()
  }, [])

  const users = useMemo(() => 
    [...new Map(transactions.filter(t => t.user).map(t => [t.user!.id, t.user!])).values()],
    [transactions]
  )

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return transactions.filter(t => {
      if (typeFilter && t.transactionStatus !== typeFilter) return false
      if (userFilter && String(t.userId) !== userFilter) return false
      if (from) { if (!t.transactionDate) return false; if (new Date(t.transactionDate) < new Date(from)) return false }
      if (to) { if (!t.transactionDate) return false; const toD = new Date(to); toD.setHours(23,59,59,999); if (new Date(t.transactionDate) > toD) return false }
      if (!qq) return true
      return (
        String(t.id).includes(qq) ||
        (t.itemName ?? '').toLowerCase().includes(qq) ||
        (t.userName ?? '').toLowerCase().includes(qq) ||
        (t.description ?? '').toLowerCase().includes(qq) ||
        (t.transactionStatus ?? '').toLowerCase().includes(qq)
      )
    })
  }, [transactions, q, typeFilter, userFilter, from, to])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-surface via-surface-secondary to-surface min-h-screen">
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-4xl font-bold text-main">Historia Zamówień</h2>
          <p className="text-secondary text-sm mt-2">Przegląd zrealizowanych i anulowanych zamówień z możliwością filtrowania</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
            <input 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Szukaj po ID, item, user, opis..." 
              className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-main rounded-xl text-main placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <button 
            onClick={() => setView(view === 'table' ? 'timeline' : 'table')} 
            className="px-6 py-3 bg-primary text-white hover:bg-primary/90 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            {view === 'table' ? <Truck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            Przełącz widok
          </button>
        </div>
      </div>

      <section className="bg-surface border-2 border-main rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="flex items-center gap-3 px-6 py-4 border-b-2 border-main bg-surface-secondary">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-main">Filtry</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Status Zamówienia</label>
              <select 
                value={typeFilter} 
                onChange={e => setTypeFilter(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border-2 border-main bg-surface text-main font-medium focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Wszystkie statusy</option>
                <option value="COMPLETED">✓ Zrealizowane</option>
                <option value="CANCELLED">✗ Anulowane</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Użytkownik</label>
              <select 
                value={userFilter} 
                onChange={e => setUserFilter(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border-2 border-main bg-surface text-main font-medium focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Wszyscy użytkownicy</option>
                {users.map(u => <option key={u.id} value={String(u.id)}>{u.username}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Data Od</label>
              <input 
                type="date" 
                value={from} 
                onChange={e => setFrom(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border-2 border-main bg-surface text-main focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Data Do</label>
              <input 
                type="date" 
                value={to} 
                onChange={e => setTo(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border-2 border-main bg-surface text-main focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface border-2 border-main rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-main">
          <h3 className="text-lg font-bold text-main">Zamówienia ({results.length})</h3>
          <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            {results.length} z {transactions.length}
          </div>
        </div>

        {results.length === 0 ? (
          <EmptyState label="Brak zamówień" />
        ) : view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary bg-surface border-b-2 border-main">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Pozycja</th>
                  <th className="px-4 py-3 font-semibold">Ilość</th>
                  <th className="px-4 py-3 font-semibold">Użytkownik</th>
                  <th className="px-4 py-3 font-semibold">Opis</th>
                  <th className="px-4 py-3 font-semibold text-center">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main">
                {results.map((t, idx) => (
                  <tr key={t.id ?? idx} className={`${idx % 2 === 0 ? 'bg-surface' : 'bg-surface/50'} hover:bg-primary/5 transition-colors`}>
                    <td className="px-4 py-3 text-secondary font-mono text-xs">#{t.id}</td>
                    <td className="px-4 py-3 text-secondary text-xs whitespace-nowrap">{formatDate(t.transactionDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.transactionStatus} /></td>
                    <td className="px-4 py-3 text-main font-medium">{t.itemName ?? '—'}</td>
                    <td className="px-4 py-3 text-main font-semibold">{t.quantity} szt.</td>
                    <td className="px-4 py-3 text-secondary">{t.userName ?? '—'}</td>
                    <td className="px-4 py-3 text-secondary text-xs truncate max-w-xs">{t.description ?? '—'}</td>
                    <td className="px-4 py-3 text-center"><button onClick={() => setDetail(t)} className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium text-xs transition-all inline-flex items-center gap-1"><Eye className="w-3 h-3"/>Szczegóły</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-main">
            {results.map((t, idx) => (
              <div key={t.id ?? idx} className="p-4 hover:bg-primary/5 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <StatusBadge status={t.transactionStatus} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="text-xs font-mono text-secondary mb-1">ID #{t.id}</div>
                        <div className="text-lg font-bold text-main">{t.itemName ?? '—'}</div>
                        {t.categoryName && <div className="text-xs text-secondary mt-1">{t.categoryName}</div>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-main">{t.quantity}</div>
                        <div className="text-xs text-secondary">szt.</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-4 text-secondary">
                        <span>{formatDate(t.transactionDate)}</span>
                        <span>•</span>
                        <span>{t.userName ?? '—'}</span>
                      </div>
                      <button onClick={() => setDetail(t)} className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium text-xs transition-all inline-flex items-center gap-1"><Eye className="w-3 h-3"/>Szczegóły</button>
                    </div>
                    {t.description && <div className="mt-3 text-sm text-secondary bg-surface rounded-lg px-3 py-2">{t.description}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-surface border-2 border-main rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b-2 border-main px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-main">Szczegóły Zamówienia</h3>
                  <div className="text-sm text-secondary mt-2">ID: <span className="font-mono font-semibold text-primary">#{detail.id}</span> • {formatDate(detail.transactionDate)}</div>
                </div>
                <button 
                  onClick={() => setDetail(null)} 
                  className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors flex-shrink-0"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-4">
                <StatusBadge status={detail.transactionStatus} />
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Pozycja
                  </div>
                  <div className="text-lg font-bold text-main">{detail.itemName ?? '—'}</div>
                  {detail.categoryName && <div className="text-sm text-secondary mt-2">Kategoria: {detail.categoryName}</div>}
                </div>

                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Ilość
                  </div>
                  <div className="text-lg font-bold text-primary">{detail.quantity} szt.</div>
                </div>

                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> Użytkownik
                  </div>
                  <div className="text-lg font-bold text-main">{detail.userName ?? '—'}</div>
                </div>

                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Data Zamówienia
                  </div>
                  <div className="text-sm text-main">{formatDate(detail.transactionDate)}</div>
                </div>
              </div>

              {detail.description && (
                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Opis
                  </div>
                  <div className="text-main leading-relaxed whitespace-pre-wrap">{detail.description}</div>
                </div>
              )}
            </div>

            <div className="bg-surface-secondary border-t-2 border-main px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setDetail(null)} 
                className="px-6 py-2 rounded-lg border-2 border-main text-main hover:bg-main hover:text-white font-medium transition-all"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default OrderHistory
