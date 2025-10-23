import { type FC, useMemo, useState, useEffect } from 'react'
import { Layers, Search, Eye, AlertCircle, Loader, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Item, ItemType as ItemTypeEnum, UnitType } from '../../../../types'

// Unit type display names mapping
const unitDisplay: Record<UnitType, string> = {
  PCS: 'szt.',
  KG: 'kg',
  LITER: 'l',
  METER: 'm',
}

// Item type display names
const itemTypeDisplay: Record<ItemTypeEnum, string> = {
  COMPONENT: 'Komponent',
  PRODUCT: 'Produkt',
}

// Default min stock level if not provided
const DEFAULT_MIN_STOCK_LEVEL = 10

// Helper functions
const getStockStatus = (currentQuantity: number, minStockLevel?: number | null): 'ok' | 'low' | 'critical' => {
  const threshold = minStockLevel ?? DEFAULT_MIN_STOCK_LEVEL
  if (currentQuantity === 0) return 'critical'
  if (currentQuantity <= threshold * 0.5) return 'critical'
  if (currentQuantity <= threshold) return 'low'
  return 'ok'
}

const getStatusBadge = (status: 'ok' | 'low' | 'critical'): { icon: string; color: string; label: string } => {
  switch (status) {
    case 'ok':
      return { icon: '🟢', color: 'text-green-600', label: 'OK' }
    case 'low':
      return { icon: '🟡', color: 'text-yellow-600', label: 'NISKIE' }
    case 'critical':
      return { icon: '🔴', color: 'text-red-600', label: 'KRYTYCZNE' }
  }
}

const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString('pl-PL') : '-'

const InventoryStatus: FC = () => {
  const [q, setQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState<UnitType | ''>('')
  const [selected, setSelected] = useState<Item | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          setError('Brak tokenu autoryzacji')
          setLoading(false)
          return
        }
        const res = await fetch('/api/items', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (!res.ok) throw new Error('Failed to fetch items')
        const data = await res.json()
        setItems(data)
      } catch (err) {
        console.error('Błąd podczas pobierania pozycji:', err)
        setError('Nie udało się pobrać danych z serwera')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  // Calculate low stock items
  const lowStock = useMemo(() => items.filter((i: Item) => getStockStatus(i.currentQuantity, DEFAULT_MIN_STOCK_LEVEL) !== 'ok'), [items])

  // Critical items (top 5)
  const criticalItems = useMemo(() => {
    return items
      .filter((i: Item) => getStockStatus(i.currentQuantity, DEFAULT_MIN_STOCK_LEVEL) === 'critical')
      .sort((a: Item, b: Item) => a.currentQuantity - b.currentQuantity)
      .slice(0, 5)
  }, [items])

  // Calculate categories with stock levels
  const categories = useMemo(() => {
    const map = new Map<string, { qty: number; count: number }>()
    for (const it of items) {
      const cat = it.categoryName ?? 'Bez kategorii'
      const current = map.get(cat) ?? { qty: 0, count: 0 }
      map.set(cat, { qty: current.qty + it.currentQuantity, count: current.count + 1 })
    }
    return Array.from(map.entries()).map(([name, { qty, count }]) => ({ name, qty, count }))
  }, [items])

  // Apply filters
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return items.filter((it: Item) => {
      if (categoryFilter && it.categoryName !== categoryFilter) return false
      if (unitFilter && it.unit !== unitFilter) return false
      if (!qq) return true
      return it.name.toLowerCase().includes(qq) || (it.description ?? '').toLowerCase().includes(qq) || (it.categoryName ?? '').toLowerCase().includes(qq)
    })
  }, [items, q, categoryFilter, unitFilter])

  // Pagination
  const totalPages = useMemo(() => Math.ceil(filtered.length / itemsPerPage), [filtered.length])
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  // Calculate KPI
  const totalQuantity = useMemo(() => items.reduce((sum, i) => sum + i.currentQuantity, 0), [items])
  const averageQuantity = useMemo(() => items.length > 0 ? Math.round(totalQuantity / items.length) : 0, [items, totalQuantity])
  const lowStockPercentage = useMemo(() => items.length > 0 ? Math.round((lowStock.length / items.length) * 100) : 0, [items, lowStock])

  if (loading) {
    return (
      <main className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 text-main animate-spin mx-auto mb-4" />
            <p className="text-secondary">Ładowanie danych...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">Błąd ładowania danych</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-50">
            Spróbuj ponownie
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Status magazynu</h1>
          <p className="text-sm text-secondary mt-1">Przejrzysty widok stanów magazynowych, alertów niskiego stanu i rozkładu po kategoriach.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-main rounded-3xl px-3 py-1">
            <Search className="w-4 h-4 text-secondary" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj pozycji" className="text-sm placeholder-secondary focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-main rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-secondary">Liczba pozycji</div>
              <div className="text-2xl font-bold text-main">{items.length}</div>
            </div>
            <Layers className="w-8 h-8 text-main" />
          </div>
          <div className="mt-2 text-sm text-secondary">Pozycji w magazynie</div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Całkowita ilość</div>
          <div className="text-2xl font-bold text-main mt-2">{totalQuantity}</div>
          <div className="mt-2 text-sm text-secondary">Wszystkie jednostki</div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Średnia per pozycja</div>
          <div className="text-2xl font-bold text-main mt-2">{averageQuantity}</div>
          <div className="mt-2 text-sm text-secondary">{lowStockPercentage}% z niskim stanem</div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Status magazynu</div>
          <div className="mt-3 space-y-1">
            {lowStock.length === 0 ? (
              <div className="text-sm text-green-600 font-medium">🟢 Wszystko OK</div>
            ) : criticalItems.length > 0 ? (
              <div className="text-sm text-red-600 font-medium">🔴 {criticalItems.length} pozycji krytycznych</div>
            ) : (
              <div className="text-sm text-yellow-600 font-medium">🟡 {lowStock.length} pozycji z niskim stanem</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-2 bg-surface-secondary border border-main rounded-lg p-4">
          <h3 className="text-lg font-semibold text-main mb-3">Filtry</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-secondary font-medium">Szukaj pozycji</label>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nazwa lub opis..." className="w-full mt-1 px-3 py-2 rounded-lg border border-main text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-secondary font-medium">Kategoria</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-main text-sm bg-white focus:outline-none">
                <option value="">Wszystkie kategorie</option>
                {Array.from(new Set(items.map(i => i.categoryName ?? 'Bez kategorii'))).map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary font-medium">Jednostka</label>
              <select value={unitFilter} onChange={e => setUnitFilter(e.target.value as UnitType | '')} className="w-full mt-1 px-3 py-2 rounded-lg border border-main text-sm bg-white focus:outline-none">
                <option value="">Wszystkie jednostki</option>
                <option value="PCS">Sztuki (szt.)</option>
                <option value="KG">Kilogramy (kg)</option>
                <option value="LITER">Litry (l)</option>
                <option value="METER">Metry (m)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-700">Pozycje krytyczne</h3>
          </div>
          <div className="space-y-2">
            {criticalItems.length === 0 ? (
              <div className="text-sm text-secondary">Brak pozycji krytycznych ✓</div>
            ) : (
              criticalItems.map((item: Item) => (
                <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-red-100 hover:bg-red-50 cursor-pointer" onClick={() => setSelected(item)}>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-main">{item.name}</div>
                    <div className="text-xs text-secondary">{item.categoryName ?? 'Bez kategorii'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">{item.currentQuantity}</div>
                    <div className="text-xs text-secondary">{unitDisplay[item.unit]}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface-secondary border border-main rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-main">Lista pozycji</h3>
            <div className="text-sm text-secondary">{filtered.length} wyników</div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-secondary">Brak pozycji</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-secondary bg-surface">
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Nazwa</th>
                      <th className="px-3 py-2">Kategoria</th>
                      <th className="px-3 py-2">Stan</th>
                      <th className="px-3 py-2">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((it: Item, idx: number) => {
                      const status = getStockStatus(it.currentQuantity, DEFAULT_MIN_STOCK_LEVEL)
                      const badge = getStatusBadge(status)
                      return (
                        <tr key={it.id} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                          <td className="px-3 py-2 text-center text-lg">{badge.icon}</td>
                          <td className="px-3 py-2 text-main font-medium">{it.name}</td>
                          <td className="px-3 py-2 text-secondary">{it.categoryName ?? 'Bez kategorii'}</td>
                          <td className={`px-3 py-2 font-semibold ${badge.color}`}>{it.currentQuantity} {unitDisplay[it.unit]}</td>
                          <td className="px-3 py-2"><button onClick={() => setSelected(it)} className="px-3 py-1 rounded-full border border-main bg-white inline-flex items-center gap-2 text-xs hover:bg-surface"><Eye className="w-4 h-4"/>Szczegóły</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-main">
                  <div className="text-xs text-secondary">Strona {currentPage} z {totalPages}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded border border-main text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2.5 py-1 rounded text-xs border ${currentPage === page ? 'bg-main text-white border-main' : 'border-main text-main hover:bg-surface'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded border border-main text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="bg-white border border-main rounded-lg p-4">
          <h4 className="text-sm font-semibold text-main mb-3">Rozkład po kategoriach</h4>
          <div className="space-y-3">
            {categories.length === 0 ? (
              <div className="text-sm text-secondary">Brak kategorii</div>
            ) : (
              categories.map((c: any) => {
                const maxQty = Math.max(...categories.map((x: any) => x.qty), 1)
                const percentage = Math.round((c.qty / maxQty) * 100)
                let barColor = 'bg-red-400'
                if (percentage > 50) barColor = 'bg-green-400'
                else if (percentage > 20) barColor = 'bg-yellow-400'
                
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-main font-medium">{c.name}</div>
                      <div className="text-xs text-secondary">{c.qty}</div>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                      <div className={`${barColor} h-full`} style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="text-xs text-secondary mt-1">{c.count} pozycji</div>
                  </div>
                )
              })
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-main">
            <div className="text-xs text-secondary space-y-1">
              <div>🟢 Powyżej 50%</div>
              <div>🟡 20-50%</div>
              <div>🔴 Poniżej 20%</div>
            </div>
          </div>
        </aside>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl bg-white border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-main">{selected.name}</h3>
                <div className="text-xs text-secondary mt-1">ID: {selected.id}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-secondary hover:text-main">✕</button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selected.description && (
                <div>
                  <div className="text-xs text-secondary font-semibold">Opis</div>
                  <div className="text-main text-sm mt-1">{selected.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-secondary font-semibold">Kategoria</div>
                  <div className="text-main mt-1">{selected.categoryName ?? 'Brak'}</div>
                </div>
                <div>
                  <div className="text-xs text-secondary font-semibold">Typ</div>
                  <div className="inline-block bg-surface px-2 py-1 rounded text-xs font-medium text-main mt-1">{itemTypeDisplay[selected.type]}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-secondary font-semibold">Stan magazynowy</div>
                  <div className="text-main font-semibold text-lg mt-1">{selected.currentQuantity} <span className="text-sm">{unitDisplay[selected.unit]}</span></div>
                </div>
                <div>
                  <div className="text-xs text-secondary font-semibold">Status</div>
                  <div className="mt-1 text-sm">{getStatusBadge(getStockStatus(selected.currentQuantity, DEFAULT_MIN_STOCK_LEVEL)).icon} {getStatusBadge(getStockStatus(selected.currentQuantity, DEFAULT_MIN_STOCK_LEVEL)).label}</div>
                </div>
              </div>

              {selected.qrCode && (
                <div>
                  <div className="text-xs text-secondary font-semibold">Kod QR</div>
                  <div className="text-main text-xs font-mono mt-1 bg-surface p-2 rounded break-all">{selected.qrCode}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-secondary font-semibold">Utworzone</div>
                  <div className="text-main mt-1">{selected.createdAt ? formatDate(selected.createdAt) : '-'}</div>
                </div>
                <div>
                  <div className="text-secondary font-semibold">Zmieniono</div>
                  <div className="text-main mt-1">{selected.updatedAt ? formatDate(selected.updatedAt) : '-'}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg border border-main text-main bg-white hover:bg-surface">Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default InventoryStatus
