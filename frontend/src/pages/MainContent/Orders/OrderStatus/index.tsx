import { type FC, useMemo, useState } from 'react'
import { CheckCircle, Clock, Truck, Package, XCircle, Eye, Download } from 'lucide-react'

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

const badgeFor = (type: string) => {
  switch (type) {
    case 'RECEIPT': return { label: 'Przyjęte', tone: 'bg-green-100 text-green-700' }
    case 'ISSUE_TO_PRODUCTION': return { label: 'Wydane (prod)', tone: 'bg-orange-100 text-orange-700' }
    case 'ISSUE_TO_SALES': return { label: 'Wydane (sprzedaż)', tone: 'bg-red-100 text-red-700' }
    case 'RETURN': return { label: 'Zwrot', tone: 'bg-blue-100 text-blue-700' }
    default: return { label: type ?? 'Nieznany', tone: 'bg-gray-100 text-gray-700' }
  }
}

const sampleTransactions: Transaction[] = [
  { id: 1023, transactionDate: new Date().toISOString(), transactionType: 'RECEIPT', item: { id: 1, name: 'Śruba M6' }, quantity: 500, user: { id: 2, username: 'jan.k' }, description: 'Dostawa ze sprawdzeniem jakości' },
  { id: 1024, transactionDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), transactionType: 'ISSUE_TO_PRODUCTION', item: { id: 2, name: 'Pasek napędowy' }, quantity: 20, user: { id: 3, username: 'ewa.m' }, description: 'Wydanie do produkcji - zlecenie #A12' },
  { id: 1025, transactionDate: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), transactionType: 'RETURN', item: { id: 3, name: 'Panele boczne' }, quantity: 5, user: { id: 4, username: 'adam.z' }, description: 'Zwrot od klienta - uszkodzone' },
]

const OrderStatus: FC = () => {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Transaction | null>(null)
  // In real app replace sampleTransactions with GET /api/transactions
  const transactions = sampleTransactions

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return transactions
    return transactions.filter(t => (
      String(t.id).includes(qq) ||
      (t.item?.name ?? '').toLowerCase().includes(qq) ||
      (t.user?.username ?? '').toLowerCase().includes(qq) ||
      (t.transactionType ?? '').toLowerCase().includes(qq)
    ))
  }, [transactions, q])

  const total = transactions.length
  const open = transactions.filter(t => t.transactionType === 'ISSUE_TO_PRODUCTION' || t.transactionType === 'ISSUE_TO_SALES').length
  const recent = transactions.slice(0, 5)

  const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : '-'

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-main">Status zamówień</h2>
          <p className="text-sm text-secondary mt-1">Szybki przegląd statusów oparty na transakcjach magazynowych. (UI-only)</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-white border border-main rounded-3xl px-3 py-1">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj po ID / pozycji / użytkowniku" className="text-sm placeholder-secondary focus:outline-none" />
          </div>
          <button className="px-3 py-2 rounded-full border border-main bg-white inline-flex items-center gap-2"><Download className="w-4 h-4"/>Eksport</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 bg-white border border-main rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-secondary">Łącznie zamówień</div>
              <div className="text-2xl font-bold text-main">{total}</div>
            </div>
            <div className="text-3xl text-main"><Package className="w-8 h-8"/></div>
          </div>
          <div className="mt-3 text-sm text-secondary">Ostatnie: {recent.map(r => r.id).join(', ') || '-'}</div>
        </div>

        <div className="col-span-1 bg-white border border-main rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-secondary">Otwartych (wydania)</div>
              <div className="text-2xl font-bold text-main">{open}</div>
            </div>
            <div className="text-3xl text-main"><Truck className="w-8 h-8"/></div>
          </div>
          <div className="mt-3 text-sm text-secondary">Monitoruj proces wydania i wysyłki</div>
        </div>

        <div className="col-span-1 bg-white border border-main rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-secondary">Ostatnie opóźnienia</div>
              <div className="text-2xl font-bold text-main">{transactions.filter(t => t.transactionType === 'RETURN').length}</div>
            </div>
            <div className="text-3xl text-main"><Clock className="w-8 h-8"/></div>
          </div>
          <div className="mt-3 text-sm text-secondary">Zwróć uwagę na zwroty i reklamacje</div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface-secondary border border-main rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-main">Lista ostatnich zamówień</h3>
            <div className="text-sm text-secondary">Widok oparty na Transaction</div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8"><div className="text-center text-secondary">Brak zamówień</div></div>
          ) : (
            <ul className="space-y-3">
              {filtered.map(t => {
                const badge = badgeFor(t.transactionType)
                return (
                  <li key={t.id} className="bg-white border border-main rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-xs text-secondary">{formatDate(t.transactionDate)}</div>
                      <div>
                        <div className="text-sm font-semibold text-main">#{t.id} • {t.item?.name ?? '-'}</div>
                        <div className="text-xs text-secondary">{t.user?.username ?? '-'} • {t.quantity} szt.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${badge.tone}`}>{badge.label}</span>
                      <button onClick={() => setSelected(t)} className="px-3 py-1 rounded-full border border-main bg-white inline-flex items-center gap-2 text-sm"><Eye className="w-4 h-4"/>Szczegóły</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <aside className="bg-white border border-main rounded-lg p-4">
          <h4 className="text-sm font-semibold text-main">Szybkie akcje</h4>
          <div className="mt-3 space-y-3">
            <button className="w-full text-left px-3 py-2 rounded-2xl border border-main bg-white flex items-center justify-between"><span>Generuj raport dzienny</span><Download className="w-4 h-4"/></button>
            <button className="w-full text-left px-3 py-2 rounded-2xl border border-main bg-white flex items-center justify-between"><span>Filtruj zwroty</span><XCircle className="w-4 h-4 text-red-500"/></button>
            <button className="w-full text-left px-3 py-2 rounded-2xl border border-main bg-white flex items-center justify-between"><span>Zaznacz wszystkie</span><CheckCircle className="w-4 h-4 text-green-500"/></button>
          </div>
        </aside>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-main">Szczegóły zamówienia #{selected.id}</h3>
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
                <div className="text-xs text-secondary mt-2">Typ transakcji</div>
                <div className="text-main">{selected.transactionType}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-secondary">Opis</div>
              <div className="text-secondary mt-1">{selected.description ?? '-'}</div>
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

export default OrderStatus

