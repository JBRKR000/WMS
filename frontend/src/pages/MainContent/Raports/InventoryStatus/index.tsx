import { type FC, useMemo, useState, useEffect, type ReactNode } from 'react'
import { Layers,  Eye, AlertCircle, Loader, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Package, BarChart3, X } from 'lucide-react'

// Location occupancy
type LocationOccupancy = {
  id: number
  code: string
  name: string
  type: string
  maxCapacity: number
  currentOccupancy: number
}

// Helper functions
const getOccupancyStatus = (occupancy: number, maxCapacity: number): 'ok' | 'warning' | 'critical' => {
  const percentage = (occupancy / maxCapacity) * 100
  if (percentage >= 90) return 'critical'
  if (percentage >= 70) return 'warning'
  return 'ok'
}

const getOccupancyPercentage = (occupancy: number, maxCapacity: number): number => {
  return Math.round((occupancy / maxCapacity) * 100)
}

const getStatusBadge = (status: 'ok' | 'warning' | 'critical'): { icon: ReactNode; color: string; label: string } => {
  switch (status) {
    case 'ok':
      return { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600', label: 'OK' }
    case 'warning':
      return { icon: <AlertTriangle className="w-5 h-5" />, color: 'text-yellow-600', label: 'OSTRZEŻENIE' }
    case 'critical':
      return { icon: <XCircle className="w-5 h-5" />, color: 'text-red-600', label: 'KRYTYCZNE' }
  }
}

const InventoryStatus: FC = () => {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState<LocationOccupancy | null>(null)
  const [locations, setLocations] = useState<LocationOccupancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const locationsPerPage = 10

  // Fetch locations with occupancy
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true)
        setError(null)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          setError('Brak tokenu autoryzacji')
          setLoading(false)
          return
        }

        // Pobierz listę wszystkich lokacji
        const res = await fetch('/api/locations', {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (!res.ok) throw new Error('Failed to fetch locations')
        const locationsData = await res.json()
        
        // Dla każdej lokacji, pobierz jej obłożenie
        const locationsWithOccupancy = await Promise.all(
          (Array.isArray(locationsData) ? locationsData : []).map(async (loc: any) => {
            try {
              const occupancyRes = await fetch(`/api/locations/${loc.id}/occupancy`, {
                headers: { Authorization: `Bearer ${authToken}` },
              })
              if (occupancyRes.ok) {
                const occupancyData = await occupancyRes.json()
                return {
                  id: occupancyData.locationId || loc.id,
                  code: occupancyData.locationCode || loc.code,
                  name: occupancyData.locationName || loc.name,
                  type: loc.type || 'N/A',
                  maxCapacity: Number(occupancyData.maxCapacity) || 0,
                  currentOccupancy: Number(occupancyData.currentOccupancy) || 0,
                }
              }
            } catch (err) {
              console.warn(`Nie udało się pobrać obłożenia dla lokacji ${loc.id}:`, err)
            }
            // Fallback jeśli pobieranie obłożenia się nie uda
            return {
              id: loc.id,
              code: loc.code || 'N/A',
              name: loc.name || 'N/A',
              type: loc.type || 'N/A',
              maxCapacity: 0,
              currentOccupancy: 0,
            }
          })
        )
        
        setLocations(locationsWithOccupancy.filter(loc => loc !== undefined))
      } catch (err) {
        console.error('Błąd podczas pobierania sektorów:', err)
        setError('Nie udało się pobrać danych z serwera')
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  // Get unique types
  const types = useMemo(() => {
    return Array.from(new Set(locations.map(l => l.type)))
  }, [locations])

  // Apply filters
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return locations.filter((loc) => {
      if (typeFilter && loc.type !== typeFilter) return false
      if (!qq) return true
      return loc.code.toLowerCase().includes(qq) || loc.name.toLowerCase().includes(qq)
    })
  }, [locations, q, typeFilter])

  // Pagination
  const totalPages = useMemo(() => Math.ceil(filtered.length / locationsPerPage), [filtered.length])
  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * locationsPerPage
    return filtered.slice(start, start + locationsPerPage)
  }, [filtered, currentPage])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCapacity = locations.reduce((sum, l) => sum + l.maxCapacity, 0)
    const totalOccupancy = locations.reduce((sum, l) => sum + l.currentOccupancy, 0)
    const criticalCount = locations.filter(l => getOccupancyStatus(l.currentOccupancy, l.maxCapacity) === 'critical').length
    const warningCount = locations.filter(l => getOccupancyStatus(l.currentOccupancy, l.maxCapacity) === 'warning').length
    
    return {
      totalLocations: locations.length,
      totalCapacity,
      totalOccupancy,
      averageOccupancy: locations.length > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
      criticalCount,
      warningCount,
      okCount: locations.length - criticalCount - warningCount,
    }
  }, [locations])

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
          <h1 className="text-2xl font-bold text-main">Status magazynu - Obłożenie sektorów</h1>
          <p className="text-sm text-secondary mt-1">Przejrzysty widok obłożenia sektorów magazynowych i ich zdolności pojemnościowej.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-accent)' }} className="text-xs font-semibold">Liczba sektorów</div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">{stats.totalLocations}</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-surface)' }} className="p-3 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }} className="mt-3 text-sm">Sektory w magazynie</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-primary)' }} className="text-xs font-semibold">Całkowita pojemność</div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">{stats.totalCapacity}</div>
            </div>
            <div style={{ color: 'var(--color-primary)' }}>
              <Package className="w-8 h-8" />
            </div>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }} className="mt-3 text-sm">Wszystkie sektory</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold">Średnie obłożenie</div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">{stats.averageOccupancy}%</div>
            </div>
            <div style={{ color: 'var(--color-warning)' }}>
              <BarChart3 className="w-8 h-8" />
            </div>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }} className="mt-3 text-sm">{stats.criticalCount + stats.warningCount} sektorów zagrożonych</div>
        </div>

        <div style={{ 
          backgroundColor: 'var(--color-surface-secondary)', 
          borderColor: stats.criticalCount === 0 
            ? 'var(--color-success)' 
            : 'var(--color-error)'
        }} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div style={{ 
            color: stats.criticalCount === 0 
              ? 'var(--color-success)' 
              : 'var(--color-error)'
          }} className="text-xs font-semibold">Status sektorów</div>
          <div className="mt-3">
            {stats.criticalCount === 0 ? (
              <div style={{ color: 'var(--color-success)' }} className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Wszystko OK
              </div>
            ) : (
              <div style={{ color: 'var(--color-error)' }} className="text-sm font-bold flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {stats.criticalCount} krytycznych
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
              <label style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-medium">Szukaj sektora</label>
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                placeholder="Kod lub nazwa..." 
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
              />
            </div>
            <div>
              <label style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-medium">Typ sektora</label>
              <select 
                value={typeFilter} 
                onChange={e => setTypeFilter(e.target.value)} 
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
              >
                <option value="">Wszystkie typy</option>
                {types.map((t: string) => <option key={t} value={t}>{t}</option>)}
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
            <h3 style={{ color: 'var(--color-error)' }} className="text-lg font-semibold">Sektory zagrożone</h3>
          </div>
          <div className="space-y-2">
            {stats.criticalCount === 0 && stats.warningCount === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">Brak sektorów zagrożonych ✓</div>
            ) : (
              locations.filter(l => {
                const status = getOccupancyStatus(l.currentOccupancy, l.maxCapacity)
                return status === 'critical' || status === 'warning'
              }).slice(0, 5).map((loc: LocationOccupancy) => {
                const status = getOccupancyStatus(loc.currentOccupancy, loc.maxCapacity)
                const percentage = getOccupancyPercentage(loc.currentOccupancy, loc.maxCapacity)
                const statusColor = status === 'critical' ? 'var(--color-error)' : 'var(--color-warning)'
                return (
                  <div 
                    key={loc.id} 
                    onClick={() => setSelected(loc)}
                    style={{ 
                      backgroundColor: 'var(--color-surface)',
                      borderColor: statusColor,
                      cursor: 'pointer'
                    }}
                    className="flex items-center justify-between rounded-lg p-2 border hover:opacity-80 transition-opacity"
                  >
                    <div className="flex-1">
                      <div style={{ color: 'var(--color-text)' }} className="text-sm font-medium">{loc.code} - {loc.name}</div>
                      <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">{loc.type}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: statusColor }} className="text-sm font-bold">{percentage}%</div>
                      <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">{loc.currentOccupancy}/{loc.maxCapacity}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="lg:col-span-2 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: 'var(--color-text)' }} className="text-lg font-semibold">Lista sektorów</h3>
            <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{filtered.length} wyników</div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)' }} className="p-8 text-center">Brak sektorów</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="text-left border-b-2">
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Kod</th>
                      <th className="px-3 py-3 font-semibold">Nazwa</th>
                      <th className="px-3 py-3 font-semibold text-center">Obłożenie</th>
                      <th className="px-3 py-3 font-semibold text-center">Pojemność</th>
                      <th className="px-3 py-3 font-semibold text-center">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLocations.map((loc: LocationOccupancy, idx: number) => {
                      const status = getOccupancyStatus(loc.currentOccupancy, loc.maxCapacity)
                      const badge = getStatusBadge(status)
                      const percentage = getOccupancyPercentage(loc.currentOccupancy, loc.maxCapacity)
                      return (
                        <tr 
                          key={loc.id} 
                          style={{ 
                            borderColor: 'var(--color-border)',
                            backgroundColor: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-secondary)'
                          }}
                          className="border-t hover:opacity-80 transition-opacity"
                        >
                          <td className="px-3 py-2 text-center">
                            {badge.icon}
                          </td>
                          <td style={{ color: 'var(--color-text)' }} className="px-3 py-2 font-semibold">{loc.code}</td>
                          <td style={{ color: 'var(--color-text-secondary)' }} className="px-3 py-2 text-sm">{loc.name}</td>
                          <td style={{ color: badge.color }} className="px-3 py-2 text-center">
                            <span className="font-bold">{percentage}%</span>
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }} className="px-3 py-2 text-center text-xs">
                            {loc.currentOccupancy}/{loc.maxCapacity}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button 
                              onClick={() => setSelected(loc)} 
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
          <h4 style={{ color: 'var(--color-text)' }} className="text-sm font-semibold mb-3">Rozkład po typach</h4>
          <div className="space-y-3">
            {types.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">Brak typów</div>
            ) : (
              types.map((type: string) => {
                const typeLocations = locations.filter(l => l.type === type)
                const typeOccupancy = typeLocations.reduce((sum, l) => sum + l.currentOccupancy, 0)
                const typeCapacity = typeLocations.reduce((sum, l) => sum + l.maxCapacity, 0)
                const percentage = typeCapacity > 0 ? Math.round((typeOccupancy / typeCapacity) * 100) : 0
                let barColor = 'bg-red-400'
                if (percentage <= 50) barColor = 'bg-green-400'
                else if (percentage <= 75) barColor = 'bg-yellow-400'
                
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <div style={{ color: 'var(--color-text)' }} className="text-sm font-medium">{type}</div>
                      <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">{percentage}%</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="w-full rounded-full h-2 overflow-hidden border">
                      <div className={`${barColor} h-full`} style={{ width: `${percentage}%` }} />
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs mt-1">{typeLocations.length} sektorów</div>
                  </div>
                )
              })
            )}
          </div>
          <div style={{ borderColor: 'var(--color-border)' }} className="mt-4 pt-4 border-t">
            <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                Do 50%
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                50-75%
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
                Powyżej 75%
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
                <h3 className="text-2xl font-bold">{selected.code} - {selected.name}</h3>
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
                  <div style={{ color: 'var(--color-accent)' }} className="text-xs font-semibold mb-1">Obłożenie</div>
                  <div className="flex items-baseline gap-2">
                    <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold">{getOccupancyPercentage(selected.currentOccupancy, selected.maxCapacity)}%</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                      {selected.currentOccupancy}/{selected.maxCapacity}
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4">
                  <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold mb-1">Status obłożenia</div>
                  <div className="text-sm">
                    {getOccupancyStatus(selected.currentOccupancy, selected.maxCapacity) === 'ok' ? '✓ Norma' : '⚠ Zagrożone'}
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Kod</div>
                    <div style={{ color: 'var(--color-text)' }} className="font-medium mt-1 text-sm">{selected.code}</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Typ</div>
                    <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="inline-block px-2 py-1 rounded text-xs font-semibold mt-1">
                      {selected.type}
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-2">Pojemność</div>
                  <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="rounded p-2 text-sm">
                    <div style={{ color: 'var(--color-text)' }} className="font-medium mb-1">Maksymalna: {selected.maxCapacity}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">Zajęte: {selected.currentOccupancy}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-2">Wizualizacja</div>
                  <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="rounded-full h-4 overflow-hidden border">
                    <div 
                      className="h-full transition-all"
                      style={{ 
                        width: `${getOccupancyPercentage(selected.currentOccupancy, selected.maxCapacity)}%`,
                        backgroundColor: getOccupancyStatus(selected.currentOccupancy, selected.maxCapacity) === 'critical' 
                          ? 'var(--color-error)' 
                          : getOccupancyStatus(selected.currentOccupancy, selected.maxCapacity) === 'warning'
                          ? 'var(--color-warning)'
                          : 'var(--color-success)'
                      }}
                    />
                  </div>
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
