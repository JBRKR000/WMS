import { type FC, useMemo, useState, useEffect } from 'react'
import { Package, Search, Eye, Download } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Item = { id?: number | null; name: string }
type User = { id?: number | null; username: string }
type Transaction = { id?: number | null; transactionDate?: string | null; transactionType: string; item?: Item | null; quantity: number; user?: User | null; description?: string | null }

const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : '-'

const OutboundSummary: FC = () => {
  const [q, setQ] = useState('')
  const [view, setView] = useState<'table'|'timeline'>('table')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch transakcji typu ISSUE_TO_SALES i ISSUE_TO_PRODUCTION
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          setError('Brak autoryzacji')
          return
        }

        // Fetch wszystkie transakcje, potem filtrujemy na frontendzie
        const res = await fetch('http://localhost:8080/api/transactions', {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        
        // Mapujemy dane z backendu na nasz typ
        const mapped: Transaction[] = (data ?? [])
          .filter((t: any) => t.transactionType === 'ISSUE_TO_SALES' || t.transactionType === 'ISSUE_TO_PRODUCTION')
          .map((t: any) => ({
            id: t.id,
            transactionDate: t.transactionDate,
            transactionType: t.transactionType,
            item: t.item ? { id: t.item.id, name: t.item.name } : null,
            quantity: t.quantity,
            user: t.user ? { id: t.user.id, username: t.user.username } : null,
            description: t.description,
          }))

        setTransactions(mapped)
        setError(null)
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError('Błąd podczas pobierania danych')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

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

  // Dane do wykresu liniowego - transakcje w czasie
  const timelineData = useMemo(() => {
    const map = new Map<string, { date: string; ISSUE_TO_SALES: number; ISSUE_TO_PRODUCTION: number }>()
    for (const t of transactions) {
      const date = t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('pl-PL') : 'Nieznana'
      if (!map.has(date)) {
        map.set(date, { date, ISSUE_TO_SALES: 0, ISSUE_TO_PRODUCTION: 0 })
      }
      const entry = map.get(date)!
      if (t.transactionType === 'ISSUE_TO_SALES') {
        entry.ISSUE_TO_SALES += t.quantity
      } else if (t.transactionType === 'ISSUE_TO_PRODUCTION') {
        entry.ISSUE_TO_PRODUCTION += t.quantity
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [transactions])

  // Dane do wykresu kołowego - rozkład typów
  const typeDistribution = useMemo(() => [
    { name: 'Wysłane do klientów', value: shipped, fill: '#3b82f6' },
    { name: 'Wydane do produkcji', value: toProduction, fill: '#10b981' }
  ], [shipped, toProduction])

  // Top pozycje
  const topItems = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      const name = t.item?.name ?? 'Nieznany'
      map.set(name, (map.get(name) ?? 0) + (t.quantity || 0))
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, quantity]) => ({ name, quantity }))
  }, [transactions])

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Podsumowanie wysyłek</h1>
          <p className="text-sm text-secondary mt-1">Widok wysyłek i wydania towaru do klientów oraz produkcji.</p>
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

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-secondary py-12">Ładowanie danych...</div>
      ) : (
        <>
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white border border-main rounded-lg p-4">
          <h3 className="text-lg font-semibold text-main mb-4">Wysyłki w czasie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="ISSUE_TO_SALES" stroke="#3b82f6" strokeWidth={2} name="Do klientów" dot={{ fill: '#3b82f6', r: 5 }} />
              <Line type="monotone" dataKey="ISSUE_TO_PRODUCTION" stroke="#10b981" strokeWidth={2} name="Do produkcji" dot={{ fill: '#10b981', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <h3 className="text-lg font-semibold text-main mb-4">Rozkład wysyłek</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white border border-main rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-main mb-4">Top 5 pozycji</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topItems}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            <Bar dataKey="quantity" fill="#3b82f6" name="Ilość" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

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
        </>
      )}
    </main>
  )
}

export default OutboundSummary
