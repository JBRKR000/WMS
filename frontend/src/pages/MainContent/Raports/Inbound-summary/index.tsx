import { type FC, useMemo, useState, useEffect } from 'react'
import { Box, Eye, Download, X, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString('pl-PL') : '-'

const InboundSummary: FC = () => {
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detail, setDetail] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch transakcji typu RECEIPT
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          setError('Brak autoryzacji')
          return
        }

        // Fetch transakcji typu RECEIPT z paginacją (już filtruje backend)
        const res = await fetch('/api/transactions/receipts/paginated?page=0&size=1000', {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()

        // Mapujemy dane z backendu na nasz typ (backend już zwraca tylko RECEIPT)
        const mapped: Transaction[] = (data.content ?? []).map((t: any) => ({
          id: t.id,
          transactionDate: t.transactionDate,
          transactionType: t.transactionType,
          item: t.itemName ? { id: null, name: t.itemName } : null,
          quantity: t.quantity,
          user: t.userName ? { id: null, username: t.userName } : null,
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

  // Dane do wykresu obszarowego - przyjęcia w czasie (z filtrem dat)
  const receiptTimeline = useMemo(() => {
    const map = new Map<string, { date: string; quantity: number; count: number }>()
    
    for (const t of filtered) {
      const date = t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('pl-PL') : 'Nieznana'
      if (!map.has(date)) {
        map.set(date, { date, quantity: 0, count: 0 })
      }
      const entry = map.get(date)!
      entry.quantity += t.quantity
      entry.count += 1
    }
    return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filtered])

  // Dane do wykresu kolumnowego - top pozycje (z filtrem dat)
  const topItemsData = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of filtered) {
      const name = t.item?.name ?? 'Nieznany'
      map.set(name, (map.get(name) ?? 0) + (t.quantity || 0))
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }))
  }, [filtered])

  // Paginacja
  const totalPages = useMemo(() => Math.ceil(filtered.length / itemsPerPage), [filtered.length])
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: 'var(--color-text)' }} className="text-3xl font-bold">Podsumowanie przyjęć</h1>
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mt-2">Szybki przegląd wszystkich przyjęć (RECEIPT) na magazynie.</p>
        </div>
        <div className="flex items-center gap-3">
          <button style={{ 
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-border)'
          }} className="px-4 py-2 rounded-lg border font-medium inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
            <Download className="w-4 h-4"/>
            Eksport
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: 'var(--color-error-bg)',
          borderColor: 'var(--color-error)',
          color: 'var(--color-error-text)'
        }} className="mb-6 p-4 border rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)' }} className="text-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin mb-3"></div>
            <p>Ładowanie danych...</p>
          </div>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div style={{ 
          backgroundColor: 'var(--color-surface-secondary)',
          borderColor: 'var(--color-border)'
        }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-accent)' }} className="text-xs font-semibold">Ilość przyjęć</div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">{totalReceipts}</div>
            </div>
            <div style={{ color: 'var(--color-accent)' }}>
              <Box className="w-8 h-8"/>
            </div>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }} className="mt-3 text-sm">Suma sztuk: <span style={{ color: 'var(--color-text)' }} className="font-semibold">{totalQty}</span></div>
        </div>

        <div style={{ 
          backgroundColor: 'var(--color-surface-secondary)',
          borderColor: 'var(--color-border)'
        }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Top pozycje</div>
          <ul className="mt-3 space-y-2">
            {topItems.map(([name, qty], i) => (
              <li key={name} className="flex items-center justify-between">
                <div style={{ color: 'var(--color-text)' }} className="text-sm font-medium">{i+1}. {name}</div>
                <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{qty} szt.</div>
              </li>
            ))}
            {topItems.length === 0 && <li style={{ color: 'var(--color-text-secondary)' }} className="text-sm">Brak danych</li>}
          </ul>
        </div>

        <div style={{ 
          backgroundColor: 'var(--color-surface-secondary)',
          borderColor: 'var(--color-border)'
        }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-3">Filtry</div>
          <div className="space-y-2">
            <div>
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                placeholder="Szukaj po ID/pozycji/użytkowniku" 
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-full px-3 py-2 rounded-lg border text-sm placeholder-secondary focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <input 
                type="date" 
                value={from} 
                onChange={e => setFrom(e.target.value)} 
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none"
              />
              <input 
                type="date" 
                value={to} 
                onChange={e => setTo(e.target.value)} 
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div style={{ 
          backgroundColor: 'var(--color-surface-secondary)',
          borderColor: 'var(--color-border)'
        }} className="lg:col-span-2 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: 'var(--color-text)' }} className="text-lg font-semibold">Lista przyjęć</h3>
            <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{filtered.length} wyników</div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)' }} className="p-8 text-center">Brak przyjęć</div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ 
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)'
                  }} className="text-left border-b-2">
                    <th className="px-3 py-3 font-semibold">ID</th>
                    <th className="px-3 py-3 font-semibold">Data</th>
                    <th className="px-3 py-3 font-semibold">Pozycja</th>
                    <th className="px-3 py-3 font-semibold text-center">Ilość</th>
                    <th className="px-3 py-3 font-semibold">Użytkownik</th>
                    <th className="px-3 py-3 font-semibold">Opis</th>
                    <th className="px-3 py-3 font-semibold text-center">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((t, idx) => (
                    <tr 
                      key={t.id ?? idx} 
                      style={{ 
                        borderColor: 'var(--color-border)',
                        backgroundColor: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-secondary)'
                      }}
                      className="border-t hover:opacity-80 transition-opacity"
                    >
                      <td style={{ color: 'var(--color-text-secondary)' }} className="px-3 py-3">{t.id}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }} className="px-3 py-3 text-xs">{formatDate(t.transactionDate)}</td>
                      <td style={{ color: 'var(--color-text)' }} className="px-3 py-3 font-medium">{t.item?.name ?? '-'}</td>
                      <td style={{ color: 'var(--color-text)' }} className="px-3 py-3 text-center font-semibold">{t.quantity}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }} className="px-3 py-3 text-sm">{t.user?.username ?? '-'}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }} className="px-3 py-3 text-sm max-w-xs truncate">{t.description ?? '-'}</td>
                      <td className="px-3 py-3 text-center">
                        <button 
                          onClick={() => setDetail(t)}
                          style={{ 
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-text)',
                            borderColor: 'var(--color-border)'
                          }}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        >
                          <Eye className="w-3.5 h-3.5"/>
                          Szczegóły
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ borderColor: 'var(--color-border)' }} className="flex items-center justify-between mt-4 pt-4 border-t">
                <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">Strona {currentPage} z {totalPages}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ 
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)'
                    }}
                    className="p-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{ 
                          backgroundColor: currentPage === page ? 'var(--color-accent)' : 'var(--color-surface)',
                          color: currentPage === page ? 'var(--color-surface)' : 'var(--color-text)',
                          borderColor: 'var(--color-border)'
                        }}
                        className="px-2.5 py-1 rounded text-xs border hover:opacity-80 transition-opacity"
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ 
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)'
                    }}
                    className="p-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>

        <aside style={{ 
          backgroundColor: 'var(--color-surface-secondary)',
          borderColor: 'var(--color-border)'
        }} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 style={{ color: 'var(--color-text)' }} className="text-sm font-semibold">Przyjęcia w czasie</h4>
            {(from || to) && (
              <div style={{ 
                backgroundColor: 'var(--color-accent)', 
                color: 'var(--color-surface)',
                fontSize: '12px',
                fontWeight: '500',
                padding: '4px 8px',
                borderRadius: '20px'
              }}>
                Filtrowane
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={receiptTimeline}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--color-border)" 
              />
              <XAxis 
                dataKey="date" 
                stroke="var(--color-text-secondary)"
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text)'
                }}
                labelStyle={{ color: 'var(--color-text)' }}
              />
              <Area 
                type="monotone" 
                dataKey="quantity" 
                fill="#3b82f6" 
                stroke="#2563eb" 
                strokeWidth={2} 
                name="Ilość sztuk"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </aside>
      </section>

      <section style={{ 
        backgroundColor: 'var(--color-surface-secondary)',
        borderColor: 'var(--color-border)'
      }} className="border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 style={{ color: 'var(--color-text)' }} className="text-lg font-semibold">Top 5 przyjmowanych pozycji</h4>
          {(from || to) && (
            <div style={{ 
              backgroundColor: 'var(--color-warning)', 
              color: 'var(--color-surface)',
              fontSize: '12px',
              fontWeight: '500',
              padding: '4px 8px',
              borderRadius: '20px'
            }}>
              Filtrowane
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topItemsData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--color-border)"
            />
            <XAxis 
              dataKey="name" 
              stroke="var(--color-text-secondary)"
              tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text)'
              }}
              labelStyle={{ color: 'var(--color-text)' }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Bar 
              dataKey="quantity" 
              fill="#10b981" 
              name="Ilość" 
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div style={{ 
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)'
          }} className="w-full max-w-2xl border rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div style={{ 
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-surface)'
            }} className="p-6 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">Szczegóły przyjęcia #{detail.id}</h3>
                <div style={{ color: 'var(--color-surface)', opacity: 0.8 }} className="text-sm mt-1">{formatDate(detail.transactionDate)}</div>
              </div>
              <button 
                onClick={() => setDetail(null)} 
                style={{ color: 'var(--color-surface)', opacity: 0.6 }}
                className="hover:opacity-100 hover:bg-white/10 rounded-lg p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div style={{ backgroundColor: 'var(--color-surface)' }} className="p-6 max-h-96 overflow-y-auto space-y-6">
              
              {/* Main metrics grid */}
              <div className="grid grid-cols-2 gap-4">
                <div style={{ 
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderColor: 'var(--color-border)'
                }} className="border rounded-lg p-4">
                  <div style={{ color: 'var(--color-accent)' }} className="text-xs font-semibold mb-1">Pozycja</div>
                  <div style={{ color: 'var(--color-text)' }} className="text-lg font-bold">
                    {detail.item?.name ?? '-'}
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderColor: 'var(--color-border)'
                }} className="border rounded-lg p-4">
                  <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold mb-1">Ilość</div>
                  <div style={{ color: 'var(--color-text)' }} className="text-lg font-bold">
                    {detail.quantity} szt.
                  </div>
                </div>
              </div>

              {/* Additional info */}
              <div style={{ 
                backgroundColor: 'var(--color-surface-secondary)',
                borderColor: 'var(--color-border)'
              }} className="border rounded-lg p-4 space-y-3">
                <div>
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-1">Użytkownik przyjmujący</div>
                  <div style={{ color: 'var(--color-text)' }} className="font-medium">
                    {detail.user?.username ?? '-'}
                  </div>
                </div>
                
                {detail.description && (
                  <div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-1">Opis</div>
                    <div style={{ 
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)'
                    }} className="rounded p-2 text-sm border">
                      {detail.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick info boxes */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div style={{ 
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderColor: 'var(--color-border)'
                }} className="rounded p-3 text-center border">
                  <div style={{ color: 'var(--color-text-secondary)' }}>Typ</div>
                  <div style={{ color: 'var(--color-text)' }} className="font-bold mt-1">
                    {detail.transactionType}
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderColor: 'var(--color-border)'
                }} className="rounded p-3 text-center border">
                  <div style={{ color: 'var(--color-text-secondary)' }}>ID Transakcji</div>
                  <div style={{ color: 'var(--color-text)' }} className="font-bold mt-1">
                    {detail.id || '-'}
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: 'var(--color-success-bg)',
                  borderColor: 'var(--color-success)'
                }} className="rounded p-3 text-center border">
                  <div style={{ color: 'var(--color-success-text)' }} className="text-xs font-semibold">Status</div>
                  <div style={{ color: 'var(--color-success)' }} className="font-bold mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    OK
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              backgroundColor: 'var(--color-surface-secondary)',
              borderColor: 'var(--color-border)'
            }} className="border-t px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setDetail(null)} 
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="px-4 py-2 rounded-lg border font-medium hover:opacity-80 transition-opacity"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </main>
  )
}

export default InboundSummary
