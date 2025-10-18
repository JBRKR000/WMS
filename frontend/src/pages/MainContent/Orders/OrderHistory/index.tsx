import { type FC, useEffect, useMemo, useState } from 'react'
import { Search, Archive, Eye, Download, Clock, CheckCircle, AlertCircle, XCircle, Truck } from 'lucide-react'
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
  const [itemFilter, setItemFilter] = useState('')
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

  const items = useMemo(() => 
    [...new Map(transactions.filter(t => t.item).map(t => [t.item!.id, t.item!])).values()],
    [transactions]
  )

  const users = useMemo(() => 
    [...new Map(transactions.filter(t => t.user).map(t => [t.user!.id, t.user!])).values()],
    [transactions]
  )

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return transactions.filter(t => {
      if (typeFilter && t.transactionStatus !== typeFilter) return false
      if (itemFilter && String(t.itemId) !== itemFilter) return false
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
  }, [transactions, q, typeFilter, itemFilter, userFilter, from, to])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Historia zamówień</h1>
          <p className="text-sm text-secondary mt-1">Archiwum zrealizowanych i anulowanych zamówień. Transakcje pobierane z API (/api/transactions/orders).</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white border border-main rounded-2xl px-3 py-1 w-full md:w-96">
            <Search className="w-4 h-4 text-secondary mr-2" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj po ID, item, user, opis" className="w-full bg-white text-main placeholder-secondary text-sm focus:outline-none" />
          </div>

          <button onClick={() => setView(view === 'table' ? 'timeline' : 'table')} className="px-3 py-2 rounded-full border border-main bg-white text-sm">Przełącz widok</button>
        </div>
      </div>

      <div className="bg-white border border-main rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-secondary">Status</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
              <option value="">Wszystkie</option>
              <option value="COMPLETED">Zrealizowane</option>
              <option value="CANCELLED">Anulowane</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-secondary">Pozycja</label>
            <select value={itemFilter} onChange={e => setItemFilter(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
              <option value="">Wszystkie</option>
              {items.map(it => <option key={it.id} value={String(it.id)}>{it.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-secondary">Użytkownik</label>
            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
              <option value="">Wszyscy</option>
              {users.map(u => <option key={u.id} value={String(u.id)}>{u.username}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-secondary">Data od</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-secondary">Data do</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
            </div>
          </div>
          <div className="md:col-span-1 flex items-end justify-end">
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-main bg-white text-sm"><Download className="w-4 h-4"/>Export</button>
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        {results.length === 0 ? (
          <EmptyState label="Brak zakończonych transakcji" />
        ) : view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary bg-surface">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Pozycja</th>
                  <th className="px-3 py-2">Ilość</th>
                  <th className="px-3 py-2">Użytkownik</th>
                  <th className="px-3 py-2">Opis</th>
                  <th className="px-3 py-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {results.map((t, idx) => (
                  <tr key={t.id ?? idx} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover transition-colors`}>
                    <td className="px-3 py-2 text-secondary align-top font-mono text-xs">{t.id}</td>
                    <td className="px-3 py-2 text-secondary align-top text-xs whitespace-nowrap">{formatDate(t.transactionDate)}</td>
                    <td className="px-3 py-2 align-top"><StatusBadge status={t.transactionStatus} /></td>
                    <td className="px-3 py-2 text-main align-top font-medium">{t.itemName ?? '-'}</td>
                    <td className="px-3 py-2 text-main align-top font-semibold">{t.quantity} szt.</td>
                    <td className="px-3 py-2 text-secondary align-top text-sm">{t.userName ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary align-top text-xs truncate max-w-xs">{t.description ?? '-'}</td>
                    <td className="px-3 py-2 text-main align-top"><button onClick={() => setDetail(t)} className="px-2 py-1 rounded-full border border-main text-main bg-white hover:bg-main hover:text-white transition-colors inline-flex items-center gap-1 text-xs"><Eye className="w-3 h-3"/>Szczegóły</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((t, idx) => (
              <div key={t.id ?? idx} className="flex items-start gap-4 p-4 rounded-lg bg-white border border-main hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <StatusBadge status={t.transactionStatus} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-mono text-secondary">ID #{t.id}</div>
                      <div className="text-lg font-semibold text-main mt-1">{t.itemName ?? '-'}</div>
                      <div className="text-xs text-secondary mt-1">{t.categoryName && `${t.categoryName} •`} {formatDate(t.transactionDate)}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-main">{t.quantity}</div>
                      <div className="text-xs text-secondary">szt.</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="text-sm text-secondary">
                      <span className="font-medium">Użytkownik:</span> {t.userName ?? '-'}
                    </div>
                    <button onClick={() => setDetail(t)} className="px-3 py-1 rounded-full border border-main text-main bg-white hover:bg-main hover:text-white transition-colors inline-flex items-center gap-1 text-xs"><Eye className="w-3 h-3"/>Szczegóły</button>
                  </div>
                  {t.description && <div className="mt-2 text-sm text-secondary bg-surface rounded px-2 py-1">{t.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-main rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-main/10 to-main/5 px-6 py-4 border-b border-main">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-main">Szczegóły zamówienia</h3>
                  <div className="text-xs text-secondary mt-1">ID: #{detail.id} • {formatDate(detail.transactionDate)}</div>
                </div>
                <button onClick={() => setDetail(null)} className="p-2 hover:bg-main hover:text-white rounded-md text-secondary transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3">
                <StatusBadge status={detail.transactionStatus} />
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-surface rounded-lg p-4">
                    <div className="text-xs text-secondary font-semibold uppercase tracking-wide">Pozycja</div>
                    <div className="text-lg font-semibold text-main mt-2">{detail.itemName ?? '-'}</div>
                    {detail.categoryName && <div className="text-sm text-secondary mt-1">Kategoria: {detail.categoryName}</div>}
                  </div>

                  <div className="bg-surface rounded-lg p-4">
                    <div className="text-xs text-secondary font-semibold uppercase tracking-wide">Ilość</div>
                    <div className="text-3xl font-bold text-main mt-2">{detail.quantity} <span className="text-lg text-secondary">szt.</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-surface rounded-lg p-4">
                    <div className="text-xs text-secondary font-semibold uppercase tracking-wide">Użytkownik</div>
                    <div className="text-lg font-semibold text-main mt-2">{detail.userName ?? '-'}</div>
                  </div>

                  <div className="bg-surface rounded-lg p-4">
                    <div className="text-xs text-secondary font-semibold uppercase tracking-wide">Data zamówienia</div>
                    <div className="text-sm text-main mt-2">{formatDate(detail.transactionDate)}</div>
                  </div>
                </div>
              </div>

              {detail.description && (
                <div className="mt-6 bg-surface rounded-lg p-4">
                  <div className="text-xs text-secondary font-semibold uppercase tracking-wide">Opis</div>
                  <div className="text-sm text-main mt-2">{detail.description}</div>
                </div>
              )}
            </div>

            <div className="bg-surface-secondary border-t border-main px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setDetail(null)} className="px-4 py-2 rounded-full border border-main text-main bg-white hover:bg-main hover:text-white transition-colors font-medium">Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default OrderHistory
