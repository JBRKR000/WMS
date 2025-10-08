import { type FC, useMemo, useState } from 'react'
import { Box, Eye, Download } from 'lucide-react'

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

// Sample receipts - UI-only. Replace with GET /api/transactions filtered server-side for production.
const sample: Transaction[] = [
  { id: 2001, transactionDate: new Date().toISOString(), transactionType: 'RECEIPT', item: { id: 10, name: 'Płytka PCB' }, quantity: 120, user: { id: 5, username: 'mag1' }, description: 'Dostawa od dostawcy A' },
  { id: 2002, transactionDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), transactionType: 'RECEIPT', item: { id: 11, name: 'Konektor 2pin' }, quantity: 540, user: { id: 6, username: 'mag2' }, description: 'Duża dostawa' },
  { id: 2003, transactionDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), transactionType: 'RECEIPT', item: { id: 10, name: 'Płytka PCB' }, quantity: 60, user: { id: 5, username: 'mag1' }, description: 'Uzupełnienie' },
]

const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : '-'

const InboundSummary: FC = () => {
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detail, setDetail] = useState<Transaction | null>(null)

  // Transactions would be fetched from backend: GET /api/transactions?type=RECEIPT
  const transactions = sample

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return transactions.filter(t => {
      if (from && t.transactionDate && new Date(t.transactionDate) < new Date(from)) return false
      if (to && t.transactionDate) { const toD = new Date(to); toD.setHours(23,59,59,999); if (new Date(t.transactionDate) > toD) return false }
      if (!qq) return true
      return (
        String(t.id).includes(qq) ||
        (t.item?.name ?? '').toLowerCase().includes(qq) ||
        (t.user?.username ?? '').toLowerCase().includes(qq) ||
        (t.description ?? '').toLowerCase().includes(qq)
      )
    })
  }, [transactions, q, from, to])

  const totalReceipts = transactions.length
  const totalQty = transactions.reduce((s, t) => s + (t.quantity || 0), 0)

  const topItems = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      const name = t.item?.name ?? 'Nieznany'
      map.set(name, (map.get(name) ?? 0) + (t.quantity || 0))
    }
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]).slice(0,5)
  }, [transactions])

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Podsumowanie przyjęć</h1>
          <p className="text-sm text-secondary mt-1">Szybki przegląd wszystkich przyjęć (RECEIPT) na magazynie — UI-only, pola odpowiadają backendowym modelom Transaction/Item/User.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 rounded-full border border-main bg-white inline-flex items-center gap-2 text-sm"><Download className="w-4 h-4"/>Eksport</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-main rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-secondary">Ilość przyjęć</div>
              <div className="text-2xl font-bold text-main">{totalReceipts}</div>
            </div>
            <div className="text-3xl text-main"><Box className="w-8 h-8"/></div>
          </div>
          <div className="mt-2 text-sm text-secondary">Suma sztuk: <span className="font-semibold text-main">{totalQty}</span></div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Top pozycje</div>
          <ul className="mt-3 space-y-2">
            {topItems.map(([name, qty], i) => (
              <li key={name} className="flex items-center justify-between">
                <div className="text-sm text-main">{i+1}. {name}</div>
                <div className="text-sm text-secondary">{qty} szt.</div>
              </li>
            ))}
            {topItems.length === 0 && <li className="text-sm text-secondary">Brak danych</li>}
          </ul>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Filtry</div>
          <div className="mt-3 space-y-2">
            <div>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj po ID/pozycji/użytkowniku" className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
            </div>
            <div className="flex gap-2">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-1/2 px-3 py-2 rounded-2xl border border-main text-sm" />
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-1/2 px-3 py-2 rounded-2xl border border-main text-sm" />
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface-secondary border border-main rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-main">Lista przyjęć</h3>
            <div className="text-sm text-secondary">{filtered.length} wyników</div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-secondary">Brak przyjęć</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary bg-surface">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Data</th>
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
                      <td className="px-3 py-2 text-main">{t.item?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-main">{t.quantity}</td>
                      <td className="px-3 py-2 text-secondary">{t.user?.username ?? '-'}</td>
                      <td className="px-3 py-2 text-secondary">{t.description ?? '-'}</td>
                      <td className="px-3 py-2 text-main"><button onClick={() => setDetail(t)} className="px-3 py-1 rounded-full border border-main bg-white inline-flex items-center gap-2"><Eye className="w-4 h-4"/>Szczegóły</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="bg-white border border-main rounded-lg p-4">
          <h4 className="text-sm font-semibold text-main">Wykres przyjęć</h4>
          <div className="mt-3 h-40 flex items-center justify-center text-secondary">
            <div className="w-full h-28 flex items-end gap-2 px-3">
              {/* Chart placeholder - replace with lightweight chart when wiring API */}
              <div className="flex-1 h-full flex items-end justify-center"> <div className="w-6 bg-surface border border-main h-3 rounded-t"/></div>
              <div className="flex-1 h-full flex items-end justify-center"> <div className="w-6 bg-main h-10 rounded-t"/></div>
              <div className="flex-1 h-full flex items-end justify-center"> <div className="w-6 bg-surface border border-main h-6 rounded-t"/></div>
              <div className="flex-1 h-full flex items-end justify-center"> <div className="w-6 bg-main h-12 rounded-t"/></div>
            </div>
          </div>
          <div className="mt-3 text-xs text-secondary">Wykres: przyjęcia według dni (podgląd)</div>
        </aside>
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-main">Szczegóły przyjęcia #{detail.id}</h3>
                <div className="text-xs text-secondary">{formatDate(detail.transactionDate)}</div>
              </div>
              <button onClick={() => setDetail(null)} className="text-secondary">Zamknij</button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
              <div>
                <div className="text-xs text-secondary">Pozycja</div>
                <div className="text-main font-medium">{detail.item?.name ?? '-'}</div>
                <div className="text-xs text-secondary mt-2">Ilość</div>
                <div className="text-main">{detail.quantity}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Użytkownik przyjmujący</div>
                <div className="text-main">{detail.user?.username ?? '-'}</div>
                <div className="text-xs text-secondary mt-2">Opis</div>
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

export default InboundSummary
