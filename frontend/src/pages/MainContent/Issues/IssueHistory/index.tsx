import { type FC, useMemo, useState } from 'react'
import { Calendar, Search, FileText, Eye, X } from 'lucide-react'

// Transaction model fields only
type Category = { id?: number | null; name: string }
type Item = { id?: number | null; name: string }
type User = { id?: number | null; username: string }
type Transaction = {
  id?: number | null
  transactionDate?: string | null
  transactionType: string
  item?: Item | null
  quantity: number
  user?: User | null
  description?: string | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak transakcji' }) => (
  <div className="py-12 text-center text-sm text-secondary">
    <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <FileText className="w-8 h-8" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Brak rekordów spełniających kryteria</div>
  </div>
)

const IssueHistory: FC = () => {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [itemFilter, setItemFilter] = useState<string>('')
  const [userFilter, setUserFilter] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [detail, setDetail] = useState<Transaction | null>(null)

  // placeholder data - replace with GET /api/transactions
  const transactions: Transaction[] = []
  const items: Item[] = []
  const users: User[] = []

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const f = transactions.filter(t => {
      if (typeFilter && t.transactionType !== typeFilter) return false
      if (itemFilter && String(t.item?.id) !== itemFilter) return false
      if (userFilter && String(t.user?.id) !== userFilter) return false
      if (from) {
        if (!t.transactionDate) return false
        if (new Date(t.transactionDate) < new Date(from)) return false
      }
      if (to) {
        if (!t.transactionDate) return false
        const toD = new Date(to); toD.setHours(23,59,59,999)
        if (new Date(t.transactionDate) > toD) return false
      }
      if (!qq) return true
      return (
        String(t.id).includes(qq) ||
        (t.item?.name ?? '').toLowerCase().includes(qq) ||
        (t.user?.username ?? '').toLowerCase().includes(qq) ||
        (t.description ?? '').toLowerCase().includes(qq) ||
        (t.transactionType ?? '').toLowerCase().includes(qq)
      )
    })
    return f
  }, [transactions, q, typeFilter, itemFilter, userFilter, from, to])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Historia zgłoszeń</h1>
          <p className="text-sm text-secondary mt-1">Przegląd transakcji (Transaction) — pola: id, transactionDate, transactionType, item, quantity, user, description.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white border border-main rounded-2xl px-3 py-1 w-full md:w-80">
            <Search className="w-4 h-4 text-secondary mr-2" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj po ID, item, user, opis" className="w-full bg-white text-main placeholder-secondary text-sm focus:outline-none" />
          </div>

          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 bg-white border border-main rounded-2xl text-sm text-main">
            <option value="">Wszystkie typy</option>
            <option value="RECEIPT">Przyjęcie</option>
            <option value="ISSUE_TO_PRODUCTION">Wydanie na produkcję</option>
            <option value="ISSUE_TO_SALES">Wydanie na sprzedaż</option>
            <option value="RETURN">Zwrot</option>
          </select>

          <select value={itemFilter} onChange={e => setItemFilter(e.target.value)} className="px-3 py-2 bg-white border border-main rounded-2xl text-sm text-main">
            <option value="">Wszystkie pozycje</option>
            {items.map(it => <option key={it.id} value={String(it.id)}>{it.name}</option>)}
          </select>

          <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="px-3 py-2 bg-white border border-main rounded-2xl text-sm text-main">
            <option value="">Wszyscy użytkownicy</option>
            {users.map(u => <option key={u.id} value={String(u.id)}>{u.username}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-main rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-secondary">Data od</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-secondary">Data do</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>
          <div className="ml-auto">
            <button onClick={() => setView(view === 'table' ? 'cards' : 'table')} className="px-3 py-2 rounded-full border border-main bg-white text-sm">Widok</button>
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        {results.length === 0 ? (
          <EmptyState />
        ) : view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary bg-surface">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Typ</th>
                  <th className="px-3 py-2">Pozycja</th>
                  <th className="px-3 py-2">Ilość</th>
                  <th className="px-3 py-2">Użytkownik</th>
                  <th className="px-3 py-2">Opis</th>
                  <th className="px-3 py-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {results.map((t, idx) => (
                  <tr key={t.id ?? idx} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                    <td className="px-3 py-2 text-secondary align-top">{t.id}</td>
                    <td className="px-3 py-2 text-secondary align-top">{formatDate(t.transactionDate)}</td>
                    <td className="px-3 py-2 align-top">{t.transactionType}</td>
                    <td className="px-3 py-2 text-main align-top">{t.item?.name ?? '-'}</td>
                    <td className="px-3 py-2 text-main align-top">{t.quantity}</td>
                    <td className="px-3 py-2 text-secondary align-top">{t.user?.username ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary align-top">{t.description ?? '-'}</td>
                    <td className="px-3 py-2 text-main align-top"><button onClick={() => setDetail(t)} className="px-3 py-1 rounded-full border border-main text-main bg-white inline-flex items-center gap-2"><Eye className="w-4 h-4"/>Szczegóły</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((t, idx) => (
              <article key={t.id ?? idx} className="p-4 rounded-lg bg-white border border-main shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-secondary">{formatDate(t.transactionDate)}</div>
                    <h3 className="text-lg font-semibold text-main mt-1">{t.transactionType}</h3>
                    <div className="text-xs text-secondary mt-1">{t.item?.name ?? '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-main">{t.quantity}</div>
                    <div className="text-xs text-secondary">{t.user?.username ?? '-'}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-secondary">{t.description ?? '-'}</div>
                <div className="mt-3 text-right"><button onClick={() => setDetail(t)} className="px-3 py-1 rounded-full border border-main text-main bg-white inline-flex items-center gap-2"><Eye className="w-4 h-4"/>Szczegóły</button></div>
              </article>
            ))}
          </div>
        )}
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-main">Szczegóły transakcji</h3>
                <div className="text-xs text-secondary">ID: {detail.id} • {formatDate(detail.transactionDate)}</div>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded-md text-secondary"><X className="w-5 h-5"/></button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
              <div>
                <div className="text-xs text-secondary">Typ</div>
                <div className="text-main">{detail.transactionType}</div>

                <div className="text-xs text-secondary mt-3">Pozycja</div>
                <div className="text-main">{detail.item?.name ?? '-'}</div>

                <div className="text-xs text-secondary mt-3">Ilość</div>
                <div className="text-main">{detail.quantity}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Użytkownik</div>
                <div className="text-main">{detail.user?.username ?? '-'}</div>

                <div className="text-xs text-secondary mt-3">Opis</div>
                <div className="text-secondary">{detail.description ?? '-'}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDetail(null)} className="px-4 py-2 rounded-full border border-main text-main bg-white">Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default IssueHistory
