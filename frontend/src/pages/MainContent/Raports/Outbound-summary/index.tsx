import { type FC, useMemo, useState } from 'react'
import { Package, Search, Eye, Download } from 'lucide-react'

type Item = { id?: number | null; name: string }
type User = { id?: number | null; username: string }
type Transaction = { id?: number | null; transactionDate?: string | null; transactionType: string; item?: Item | null; quantity: number; user?: User | null; description?: string | null }

const sample: Transaction[] = [
  { id: 3001, transactionDate: new Date().toISOString(), transactionType: 'ISSUE_TO_SALES', item: { id: 21, name: 'Monitor 24"' }, quantity: 10, user: { id: 8, username: 'log1' }, description: 'Wysyłka do klienta Z' },
  { id: 3002, transactionDate: new Date(Date.now() - 1000*60*60*24).toISOString(), transactionType: 'ISSUE_TO_SALES', item: { id: 22, name: 'Kabel HDMI' }, quantity: 50, user: { id: 9, username: 'log2' }, description: 'Zamówienie online' },
  { id: 3003, transactionDate: new Date(Date.now() - 1000*60*60*48).toISOString(), transactionType: 'ISSUE_TO_PRODUCTION', item: { id: 23, name: 'Panel LCD' }, quantity: 5, user: { id: 7, username: 'mag3' }, description: 'Wydanie do montażu' },
]

const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : '-'

const OutboundSummary: FC = () => {
  const [q, setQ] = useState('')
  const [view, setView] = useState<'table'|'timeline'>('table')
  const [selected, setSelected] = useState<Transaction | null>(null)

  const transactions = sample

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return transactions
    return transactions.filter(t => (
      String(t.id).includes(qq) ||
      (t.item?.name ?? '').toLowerCase().includes(qq) ||
      (t.user?.username ?? '').toLowerCase().includes(qq) ||
      (t.description ?? '').toLowerCase().includes(qq)
    ))
  }, [transactions, q])

  const total = transactions.length
  const shipped = transactions.filter(t => t.transactionType === 'ISSUE_TO_SALES').reduce((s, t) => s + t.quantity, 0)
  const toProduction = transactions.filter(t => t.transactionType === 'ISSUE_TO_PRODUCTION').reduce((s, t) => s + t.quantity, 0)

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Podsumowanie wysyłek</h1>
          <p className="text-sm text-secondary mt-1">Szybki widok wysyłek i wydania towaru — UI-only, dane oparte na modelach Transaction/Item/User.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-main rounded-3xl px-3 py-1">
            <Search className="w-4 h-4 text-secondary" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj po ID/pozycji/użytkowniku" className="text-sm placeholder-secondary focus:outline-none" />
          </div>
          <button onClick={() => setView(view === 'table' ? 'timeline' : 'table')} className="px-3 py-2 rounded-full border border-main bg-white text-sm">Przełącz widok</button>
          <button className="px-3 py-2 rounded-full border border-main bg-white inline-flex items-center gap-2"><Download className="w-4 h-4"/>Eksport</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-main rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-secondary">Transakcji</div>
              <div className="text-2xl font-bold text-main">{total}</div>
            </div>
            <Package className="w-8 h-8 text-main" />
          </div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Wysłane szt.</div>
          <div className="text-2xl font-bold text-main">{shipped}</div>
          <div className="text-sm text-secondary mt-2">Ilość wysłana do klientów</div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Wydane do produkcji</div>
          <div className="text-2xl font-bold text-main">{toProduction}</div>
          <div className="text-sm text-secondary mt-2">Ilość przekazana do działu produkcji</div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-secondary">Brak wysyłek</div>
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
                {filtered.map((t, idx) => (
                  <tr key={t.id ?? idx} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                    <td className="px-3 py-2 text-secondary">{t.id}</td>
                    <td className="px-3 py-2 text-secondary">{formatDate(t.transactionDate)}</td>
                    <td className="px-3 py-2 text-main">{t.transactionType}</td>
                    <td className="px-3 py-2 text-main">{t.item?.name ?? '-'}</td>
                    <td className="px-3 py-2 text-main">{t.quantity}</td>
                    <td className="px-3 py-2 text-secondary">{t.user?.username ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary">{t.description ?? '-'}</td>
                    <td className="px-3 py-2 text-main"><button onClick={() => setSelected(t)} className="px-3 py-1 rounded-full border border-main bg-white inline-flex items-center gap-2"><Eye className="w-4 h-4"/>Szczegóły</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((t, idx) => (
              <div key={t.id ?? idx} className="flex items-start gap-4">
                <div className="w-12 text-xs text-secondary text-right">{formatDate(t.transactionDate)}</div>
                <div className="flex-1 p-4 rounded-lg bg-white border border-main shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-secondary">{t.transactionType}</div>
                      <div className="text-lg font-semibold text-main">{t.item?.name ?? '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-main">{t.quantity}</div>
                      <div className="text-xs text-secondary">{t.user?.username ?? '-'}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-secondary">{t.description ?? '-'}</div>
                  <div className="mt-3 text-right"><button onClick={() => setSelected(t)} className="px-3 py-1 rounded-full border border-main text-main bg-white inline-flex items-center gap-2"><Eye className="w-4 h-4"/>Szczegóły</button></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-main">Szczegóły wysyłki #{selected.id}</h3>
                <div className="text-xs text-secondary">{formatDate(selected.transactionDate)}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-secondary">Zamknij</button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
              <div>
                <div className="text-xs text-secondary">Pozycja</div>
                <div className="text-main font-medium">{selected.item?.name ?? '-'}</div>
                <div className="text-xs text-secondary mt-2">Ilość</div>
                <div className="text-main">{selected.quantity}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Użytkownik</div>
                <div className="text-main">{selected.user?.username ?? '-'}</div>
                <div className="text-xs text-secondary mt-2">Opis</div>
                <div className="text-secondary">{selected.description ?? '-'}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-full border border-main text-main bg-white">Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default OutboundSummary
