import { type FC, useMemo, useState, useEffect, type ReactNode } from 'react'
import { Layers,  Eye, AlertCircle, Loader, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Package, BarChart3, X } from 'lucide-react'
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

// Helper functions
const getStockStatus = (currentQuantity: number, threshold?: number | null): 'ok' | 'low' | 'critical' => {
  // If no threshold, consider it OK
  if (!threshold || threshold === 0) return 'ok'
  
  // Critical: at or below threshold
  if (currentQuantity <= threshold) return 'critical'
  
  // Low: between threshold and 150% of threshold (approaching threshold)
  if (currentQuantity <= threshold * 1.5) return 'low'
  
  // OK: well above threshold
  return 'ok'
}

const getStatusBadge = (status: 'ok' | 'low' | 'critical'): { icon: ReactNode; color: string; label: string } => {
  switch (status) {
    case 'ok':
      return { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600', label: 'OK' }
    case 'low':
      return { icon: <AlertTriangle className="w-5 h-5" />, color: 'text-yellow-600', label: 'NISKIE' }
    case 'critical':
      return { icon: <XCircle className="w-5 h-5" />, color: 'text-red-600', label: 'KRYTYCZNE' }
  }
}

const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString('pl-PL') : '-'

const InventoryStatus: FC = () => {
  const [q, setQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState<UnitType | ''>('')
  const [selected, setSelected] = useState<Item | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [lowStockItems, setLowStockItems] = useState<Item[]>([])
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
        // Fetch all items for inventory overview
        const allItemsRes = await fetch('/api/items', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (!allItemsRes.ok) throw new Error('Failed to fetch items')
        const allItemsData = await allItemsRes.json()
        
        // Fetch low stock items
        type LowStockResponse = {
          content: Item[]
          totalElements: number
          totalPages: number
        }
        const lowStockRes = await fetch('/api/items/lowstock?page=0&size=1000', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const lowStockData = await lowStockRes.json() as LowStockResponse
        
        setItems(allItemsData)
        // Store low stock items for critical calculation
        setLowStockItems(lowStockData?.content || [])
      } catch (err) {
        console.error('Błąd podczas pobierania pozycji:', err)
        setError('Nie udało się pobrać danych z serwera')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  // Calculate low stock items from API response
  const lowStock = useMemo(() => lowStockItems, [lowStockItems])

  // Critical items (top 5) - items with lowest quantity
  const criticalItems = useMemo(() => {
    return lowStockItems
      .sort((a: Item, b: Item) => a.currentQuantity - b.currentQuantity)
      .slice(0, 5)
  }, [lowStockItems])

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-accent)' }} className="text-xs font-semibold">Liczba pozycji</div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">{items.length}</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-surface)' }} className="p-3 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }} className="mt-3 text-sm">Pozycji w magazynie</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-primary)' }} className="text-xs font-semibold">Całkowita ilość</div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">{totalQuantity}</div>
            </div>
            <div style={{ color: 'var(--color-primary)' }}>
              <Package className="w-8 h-8" />
            </div>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }} className="mt-3 text-sm">Wszystkie jednostki</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold">Średnia per pozycja</div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">{averageQuantity}</div>
            </div>
            <div style={{ color: 'var(--color-warning)' }}>
              <BarChart3 className="w-8 h-8" />
            </div>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }} className="mt-3 text-sm">{lowStockPercentage}% z niskim stanem</div>
        </div>

        <div style={{ 
          backgroundColor: 'var(--color-surface-secondary)', 
          borderColor: lowStock.length === 0 
            ? 'var(--color-success)' 
            : criticalItems.length > 0 
            ? 'var(--color-error)' 
            : 'var(--color-warning)'
        }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div style={{ 
            color: lowStock.length === 0 
              ? 'var(--color-success)' 
              : criticalItems.length > 0 
              ? 'var(--color-error)' 
              : 'var(--color-warning)'
          }} className="text-xs font-semibold">Status magazynu</div>
          <div className="mt-3">
            {lowStock.length === 0 ? (
              <div style={{ color: 'var(--color-success)' }} className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Wszystko OK
              </div>
            ) : criticalItems.length > 0 ? (
              <div style={{ color: 'var(--color-error)' }} className="text-sm font-bold flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {criticalItems.length} pozycji krytycznych
              </div>
            ) : (
              <div style={{ color: 'var(--color-warning)' }} className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {lowStock.length} pozycji niskiego stanu
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="lg:col-span-2 border rounded-lg p-4">
          <h3 style={{ color: 'var(--color-text)' }} className="text-lg font-semibold mb-3">Filtry</h3>
          <div className="space-y-3">
            <div>
              <label style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-medium">Szukaj pozycji</label>
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                placeholder="Nazwa lub opis..." 
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
              />
            </div>
            <div>
              <label style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-medium">Kategoria</label>
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)} 
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
              >
                <option value="">Wszystkie kategorie</option>
                {Array.from(new Set(items.map(i => i.categoryName ?? 'Bez kategorii'))).map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-medium">Jednostka</label>
              <select 
                value={unitFilter} 
                onChange={e => setUnitFilter(e.target.value as UnitType | '')} 
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
              >
                <option value="">Wszystkie jednostki</option>
                <option value="PCS">Sztuki (szt.)</option>
                <option value="KG">Kilogramy (kg)</option>
                <option value="LITER">Litry (l)</option>
                <option value="METER">Metry (m)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'var(--color-error-bg)',
          borderColor: 'var(--color-error)'
        }} className="lg:col-span-2 border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle style={{ color: 'var(--color-error)' }} className="w-5 h-5" />
            <h3 style={{ color: 'var(--color-error)' }} className="text-lg font-semibold">Pozycje krytyczne</h3>
          </div>
          <div className="space-y-2">
            {criticalItems.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">Brak pozycji krytycznych ✓</div>
            ) : (
              criticalItems.map((item: Item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelected(item)}
                  style={{ 
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-error)',
                    cursor: 'pointer'
                  }}
                  className="flex items-center justify-between rounded-lg p-2 border hover:opacity-80 transition-opacity"
                >
                  <div className="flex-1">
                    <div style={{ color: 'var(--color-text)' }} className="text-sm font-medium">{item.name}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">{item.categoryName ?? 'Bez kategorii'}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ color: 'var(--color-error)' }} className="text-sm font-bold">{item.currentQuantity}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">{unitDisplay[item.unit]}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="lg:col-span-2 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: 'var(--color-text)' }} className="text-lg font-semibold">Lista pozycji</h3>
            <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{filtered.length} wyników</div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)' }} className="p-8 text-center">Brak pozycji</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="text-left border-b-2">
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Nazwa</th>
                      <th className="px-3 py-3 font-semibold">Kategoria</th>
                      <th className="px-3 py-3 font-semibold text-center">Stan</th>
                      <th className="px-3 py-3 font-semibold text-center">Próg</th>
                      <th className="px-3 py-3 font-semibold text-center">Wykorzystanie</th>
                      <th className="px-3 py-3 font-semibold text-center">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((it: Item, idx: number) => {
                      const status = getStockStatus(it.currentQuantity, it.threshold)
                      const badge = getStatusBadge(status)
                      const utilizationPercent = it.threshold ? Math.round((it.currentQuantity / it.threshold) * 100) : 0
                      return (
                        <tr 
                          key={it.id} 
                          style={{ 
                            borderColor: 'var(--color-border)',
                            backgroundColor: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-secondary)'
                          }}
                          className="border-t hover:opacity-80 transition-opacity"
                        >
                          <td className="px-3 py-2 text-center">
                            {badge.icon}
                          </td>
                          <td style={{ color: 'var(--color-text)' }} className="px-3 py-2 font-semibold">{it.name}</td>
                          <td style={{ color: 'var(--color-text-secondary)' }} className="px-3 py-2 text-sm">{it.categoryName ?? 'Bez kategorii'}</td>
                          <td style={{ color: badge.color }} className="px-3 py-2 text-center">
                            <span className="font-bold">{it.currentQuantity}</span>
                            <span style={{ color: 'var(--color-text-secondary)' }} className="text-xs ml-1">{unitDisplay[it.unit]}</span>
                          </td>
                          <td style={{ color: 'var(--color-text)' }} className="px-3 py-2 text-center font-semibold">{it.threshold || '-'}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="w-16 rounded-full h-1.5 overflow-hidden border">
                                <div 
                                  className={`h-full ${
                                    utilizationPercent <= 100 ? 'bg-red-500' : 
                                    utilizationPercent <= 150 ? 'bg-yellow-500' : 
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(utilizationPercent, 200)}%` }}
                                />
                              </div>
                              <span style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold w-10 text-right">{utilizationPercent}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button 
                              onClick={() => setSelected(it)} 
                              style={{ 
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                borderColor: 'var(--color-border)'
                              }}
                              className="px-2.5 py-1 rounded-full border text-main hover:opacity-80 transition-opacity inline-flex items-center gap-1 text-xs font-medium"
                            >
                              <Eye className="w-3.5 h-3.5"/>
                              Szczegóły
                            </button>
                          </td>
                        </tr>
                      )
                    })}
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
                            backgroundColor: currentPage === page ? 'var(--color-primary)' : 'var(--color-surface)',
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

        <aside style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4">
          <h4 style={{ color: 'var(--color-text)' }} className="text-sm font-semibold mb-3">Rozkład po kategoriach</h4>
          <div className="space-y-3">
            {categories.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">Brak kategorii</div>
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
                      <div style={{ color: 'var(--color-text)' }} className="text-sm font-medium">{c.name}</div>
                      <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">{c.qty}</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="w-full rounded-full h-2 overflow-hidden border">
                      <div className={`${barColor} h-full`} style={{ width: `${percentage}%` }} />
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs mt-1">{c.count} pozycji</div>
                  </div>
                )
              })
            )}
          </div>
          <div style={{ borderColor: 'var(--color-border)' }} className="mt-4 pt-4 border-t">
            <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                Powyżej 50%
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                20-50%
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
                Poniżej 20%
              </div>
            </div>
          </div>
        </aside>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="w-full max-w-2xl border rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="p-6 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selected.name}</h3>
                <div style={{ color: 'var(--color-surface)', opacity: 0.8 }} className="text-sm mt-1">ID: {selected.id}</div>
              </div>
              <button 
                onClick={() => setSelected(null)} 
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
                <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4">
                  <div style={{ color: 'var(--color-accent)' }} className="text-xs font-semibold mb-1">Stan magazynowy</div>
                  <div className="flex items-baseline gap-2">
                    <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold">{selected.currentQuantity}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{unitDisplay[selected.unit]}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4">
                  <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold mb-1">Próg ostrzeżenia</div>
                  <div className="flex items-baseline gap-2">
                    <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold">{selected.threshold || '-'}</div>
                    {selected.threshold && <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{unitDisplay[selected.unit]}</div>}
                  </div>
                </div>
              </div>

              {/* Status & Utilization Analysis */}
              {selected.threshold && (
                <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div style={{ color: 'var(--color-text)' }} className="text-sm font-semibold">Analiza progu</div>
                    <div>{getStatusBadge(getStockStatus(selected.currentQuantity, selected.threshold)).icon}</div>
                  </div>

                  {/* Threshold progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--color-text-secondary)' }}>0 (Krytyczne)</span>
                      <span style={{ color: 'var(--color-text)' }} className="font-semibold">
                        {selected.threshold * 1.5} (OK)
                      </span>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="relative w-full h-6 border rounded-lg overflow-hidden flex items-center">
                      {/* Threshold zones */}
                      <div className="absolute inset-0 flex">
                        {/* Critical zone */}
                        <div 
                          style={{ 
                            backgroundColor: 'var(--color-error-bg)', 
                            borderRightColor: 'var(--color-error)',
                            width: `${(selected.threshold / (selected.threshold * 1.5)) * 100}%`
                          }}
                          className="border-r"
                        />
                        {/* Low zone */}
                        <div 
                          style={{ 
                            backgroundColor: 'var(--color-warning-bg)', 
                            borderRightColor: 'var(--color-warning)',
                            width: `${(selected.threshold * 0.5) / (selected.threshold * 1.5) * 100}%`
                          }}
                          className="border-r"
                        />
                        {/* OK zone */}
                        <div style={{ backgroundColor: 'var(--color-success-bg)' }} className="flex-1" />
                      </div>

                      {/* Current position indicator */}
                      <div 
                        style={{ 
                          backgroundColor: 'var(--color-accent)',
                          left: `${Math.min((selected.currentQuantity / (selected.threshold * 1.5)) * 100, 100)}%`,
                          transform: 'translateX(-50%)'
                        }}
                        className="absolute top-0 bottom-0 w-1 z-10 shadow-md"
                      />

                      {/* Labels on progress bar */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span style={{ color: 'var(--color-text)' }} className="text-xs font-bold">
                          {Math.round((selected.currentQuantity / selected.threshold) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status description */}
                  <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="rounded p-2 text-xs border">
                    {selected.currentQuantity <= selected.threshold ? (
                      <div style={{ color: 'var(--color-error)' }} className="font-medium flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        <span><strong>KRYTYCZNE:</strong> Stan na lub poniżej progu. Wymaga natychmiastowego uzupełnienia!</span>
                      </div>
                    ) : selected.currentQuantity <= selected.threshold * 1.5 ? (
                      <div style={{ color: 'var(--color-warning)' }} className="font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span><strong>NISKIE:</strong> Stan zbliża się do progu. Zalecane uzupełnienie zapasów.</span>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--color-success)' }} className="font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span><strong>OK:</strong> Stan znacznie powyżej progu. Zapasy bezpieczne.</span>
                      </div>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="rounded p-2 text-center border">
                      <div style={{ color: 'var(--color-text-secondary)' }}>Procent progu</div>
                      <div style={{ color: 'var(--color-text)' }} className="text-lg font-bold mt-1">
                        {Math.round((selected.currentQuantity / selected.threshold) * 100)}%
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="rounded p-2 text-center border">
                      <div style={{ color: 'var(--color-text-secondary)' }}>Różnica</div>
                      <div style={{ color: selected.currentQuantity >= selected.threshold ? 'var(--color-success)' : 'var(--color-error)' }} className="text-lg font-bold mt-1">
                        {selected.currentQuantity - selected.threshold > 0 ? '+' : ''}{selected.currentQuantity - selected.threshold}
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="rounded p-2 text-center border">
                      <div style={{ color: 'var(--color-text-secondary)' }}>Do progu</div>
                      <div style={{ color: selected.currentQuantity >= selected.threshold ? 'var(--color-success)' : 'var(--color-error)' }} className="text-lg font-bold mt-1">
                        {selected.threshold - selected.currentQuantity > 0 ? selected.threshold - selected.currentQuantity : 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic info */}
              <div className="space-y-3">
                {selected.description && (
                  <div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-1">Opis</div>
                    <div style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text)' }} className="rounded p-2 text-sm">{selected.description}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Kategoria</div>
                    <div style={{ color: 'var(--color-text)' }} className="font-medium mt-1 text-sm">{selected.categoryName ?? 'Brak'}</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Typ</div>
                    <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="inline-block px-2 py-1 rounded text-xs font-semibold mt-1">
                      {itemTypeDisplay[selected.type]}
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              {selected.qrCode && (
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-2">Kod QR</div>
                  <div style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }} className="text-xs font-mono p-2 rounded border break-all">{selected.qrCode}</div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="font-semibold">Utworzone</div>
                  <div style={{ color: 'var(--color-text)' }} className="mt-1 text-xs">{selected.createdAt ? formatDate(selected.createdAt) : '-'}</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="font-semibold">Zmieniono</div>
                  <div style={{ color: 'var(--color-text)' }} className="mt-1 text-xs">{selected.updatedAt ? formatDate(selected.updatedAt) : '-'}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border-t px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setSelected(null)} 
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
    </main>
  )
}

export default InventoryStatus
