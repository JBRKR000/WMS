import { type FC, useMemo, useState, useEffect } from 'react'
import { Search as SearchIcon, Filter, Eye, Box, X } from 'lucide-react'
import { fetchApi } from '../../../../utils/api'

// Use Item model fields only
type Category = { id?: number | null; name: string }
type KeywordDTO = { id: number; value: string; itemsCount: number }
type Item = {
  id?: number | null
  name: string
  description?: string | null
  category?: Category | null
  unit?: string | null
  currentQuantity?: number
  threshold?: number
  qrCode?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  keywords?: string[]
}

// API Response types
type ItemDTO = {
  id: number | null
  name: string
  description?: string | null
  categoryName?: string | null
  unit?: string | null
  currentQuantity?: number
  threshold?: number
  qrCode?: string | null
  itemType?: string
  createdAt?: string | null
  updatedAt?: string | null
  keywords?: string[]
}

type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

const UNIT_OPTIONS = [
  { value: 'PCS', label: 'Sztuki' },
  { value: 'KG', label: 'Kilogramy' },
  { value: 'LITER', label: 'Litry' },
  { value: 'METER', label: 'Metry' }
]

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak wyników' }) => (
  <div className="py-12 text-center text-sm text-secondary">
    <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <Box className="w-8 h-8" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Spróbuj zmienić kryteria wyszukiwania</div>
  </div>
)

const Search: FC = () => {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string>('')
  const [unit, setUnit] = useState<string>('')
  const [minQty, setMinQty] = useState<string>('')
  const [maxQty, setMaxQty] = useState<string>('')
  const [lowStock, setLowStock] = useState(false)
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('')
  const [keywords, setKeywords] = useState<string>('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [preview, setPreview] = useState<Item | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedCategories, setFetchedCategories] = useState<Category[]>([])
  const [availableKeywords, setAvailableKeywords] = useState<KeywordDTO[]>([])
  const [showKeywordsSuggestions, setShowKeywordsSuggestions] = useState(false)

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          setFetchedCategories([])
          return
        }
        const res = await fetch('/api/categories', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        const mapped: Category[] = (data ?? []).map((c: any) => ({ id: c.id, name: c.name }))
        setFetchedCategories(mapped)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setFetchedCategories([])
      }
    }
    fetchCategories()
  }, [])

  // Fetch keywords on component mount
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const authToken = localStorage.getItem('authToken')
        if (!authToken) return
        const res = await fetch('/api/keywords', { 
          headers: { Authorization: `Bearer ${authToken}` } 
        })
        if (!res.ok) throw new Error('Failed to fetch keywords')
        const data = await res.json()
        setAvailableKeywords(data)
      } catch (err) {
        console.error('Error fetching keywords:', err)
        setAvailableKeywords([])
      }
    }
    fetchKeywords()
  }, [])

  // Helper function to get quantity label based on unit
  const getQuantityLabel = (): string => {
    switch (unit) {
      case 'PCS':
        return 'Ilość (sztuki)'
      case 'KG':
        return 'Waga (kg)'
      case 'LITER':
        return 'Objętość (litry)'
      case 'METER':
        return 'Długość (metry)'
      default:
        return 'Ilość'
    }
  }

  // Fetch search results with multicriteria
  const fetchSearchResults = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (category) params.append('categoryId', category)
      if (unit) params.append('unit', unit)
      if (minQty) params.append('minQuantity', minQty)
      if (maxQty) params.append('maxQuantity', maxQty)
      if (keywords) params.append('keywords', keywords)
      params.append('page', '0')
      params.append('size', '100')

      const response = await fetchApi<PageResponse<ItemDTO>>(
        `/items/search?${params.toString()}`
      )

      if (response?.content) {
        // Convert ItemDTO to Item
        const mappedItems = response.content.map((dto) => ({
          id: dto.id,
          name: dto.name,
          description: dto.description,
          category: dto.categoryName ? { name: dto.categoryName } : undefined,
          unit: dto.unit,
          currentQuantity: dto.currentQuantity,
          threshold: dto.threshold,
          qrCode: dto.qrCode,
          createdAt: dto.createdAt,
          updatedAt: dto.updatedAt,
          keywords: dto.keywords || [],
        }))
        setItems(mappedItems)
      }
    } catch (err) {
      console.error('Error fetching search results:', err)
      setError('Błąd podczas wyszukiwania')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Trigger search when filters change (debounced via user interaction)
  const handleSearch = () => {
    fetchSearchResults()
  }

  const categories = useMemo(() => {
    return fetchedCategories
  }, [fetchedCategories])

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const keywordFilter = keywords.trim().toLowerCase()

    return items.filter(it => {
      // Text search in name, description, QR, category
      if (qq && !qq) return true
      if (qq) {
        const matches = (
          it.name.toLowerCase().includes(qq) ||
          (it.description ?? '').toLowerCase().includes(qq) ||
          (it.qrCode ?? '').toLowerCase().includes(qq) ||
          (it.category?.name ?? '').toLowerCase().includes(qq)
        )
        if (!matches) return false
      }

      // Keyword filter (client-side, since API already filtered)
      if (keywordFilter && (!it.keywords || !it.keywords.some(kw => kw.toLowerCase().includes(keywordFilter)))) return false
      
      // Low stock filter (client-side calculation)
      if (lowStock && lowStockThreshold) {
        const thresh = Number(lowStockThreshold)
        if (it.currentQuantity == null || it.currentQuantity >= thresh) return false
      }

      return true
    })
  }, [items, q, lowStock, lowStockThreshold, keywords])

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-surface">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Wyszukiwarka komponentów</h1>
          <p className="text-sm text-secondary mt-1">Szybkie znajdowanie komponentów po nazwie, opisie, QR lub kategorii — widok oparty na modelu Item.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-surface border border-main rounded-2xl px-3 py-1 w-full md:w-96">
            <SearchIcon className="w-4 h-4 text-secondary mr-2" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj..." className="w-full bg-surface text-main placeholder-secondary text-sm focus:outline-none" />
          </div>

          <button onClick={() => setView(view === 'grid' ? 'list' : 'grid')} className="px-3 py-2 rounded-full border border-main bg-surface text-main hover:bg-surface-hover transition"><Filter className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Advanced filters panel */}
      <div className="bg-surface border border-main rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-secondary">Filtry zaawansowane</div>
          <div className="text-xs text-secondary">Wyszukiwanie wielokryterialne</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-secondary">Kategoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">Wszystkie kategorie</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-secondary">Jednostka</label>
            <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">Wszystkie</option>
              {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          {unit ? (
            <>
              <div>
                <label className="text-xs text-secondary">{getQuantityLabel()} min</label>
                <input type="number" value={minQty} onChange={e => setMinQty(e.target.value)} placeholder="min" className="w-full px-3 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              <div>
                <label className="text-xs text-secondary">{getQuantityLabel()} max</label>
                <input type="number" value={maxQty} onChange={e => setMaxQty(e.target.value)} placeholder="max" className="w-full px-3 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-secondary">Ilość min</label>
                <input type="number" value={minQty} onChange={e => setMinQty(e.target.value)} placeholder="min" className="w-full px-3 py-2 rounded-2xl border border-main bg-surface-secondary text-main text-sm focus:outline-none disabled:opacity-50" disabled />
              </div>

              <div>
                <label className="text-xs text-secondary">Ilość max</label>
                <input type="number" value={maxQty} onChange={e => setMaxQty(e.target.value)} placeholder="max" className="w-full px-3 py-2 rounded-2xl border border-main bg-surface-secondary text-main text-sm focus:outline-none disabled:opacity-50" disabled />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-secondary">Niska ilość (próg)</label>
            <div className="flex gap-2">
              <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} className="mt-2 cursor-pointer" />
              <input type="number" placeholder="próg" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50" disabled={!lowStock} />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-secondary">Słowa kluczowe</label>
            <div className="relative">
              <input 
                value={keywords} 
                onChange={e => setKeywords(e.target.value)} 
                onFocus={() => setShowKeywordsSuggestions(true)}
                onBlur={() => setTimeout(() => setShowKeywordsSuggestions(false), 200)}
                placeholder="Wyszukaj po słowach kluczowych..." 
                className="w-full px-3 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" 
              />
              {showKeywordsSuggestions && availableKeywords.length > 0 && (
                <ul className="absolute z-10 bg-surface border border-main rounded mt-1 max-h-40 overflow-auto w-full shadow-lg">
                  {availableKeywords
                    .filter(k => !keywords || k.value.toLowerCase().includes(keywords.toLowerCase()))
                    .slice(0, 10)
                    .map(k => (
                      <li 
                        key={k.id} 
                        onClick={() => {
                          setKeywords(k.value)
                          setShowKeywordsSuggestions(false)
                        }} 
                        className="px-3 py-2 hover:bg-surface-hover text-main cursor-pointer text-sm border-b border-main last:border-b-0 transition"
                      >
                        {k.value}
                      </li>
                    ))}
                  {keywords && !availableKeywords.some(k => k.value.toLowerCase().includes(keywords.toLowerCase())) && (
                    <li className="px-3 py-2 text-sm text-secondary">Brak wyników</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="md:col-span-4 flex gap-2 justify-end">
            <button 
              onClick={() => {
                setQ('')
                setCategory('')
                setUnit('')
                setMinQty('')
                setMaxQty('')
                setLowStock(false)
                setLowStockThreshold('')
                setKeywords('')
                setItems([])
              }}
              className="px-4 py-2 rounded-full border border-main text-main bg-surface hover:bg-surface-hover transition"
            >
              Wyczyść
            </button>
            <button 
              onClick={handleSearch}
              className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-hover transition font-medium"
            >
              Szukaj
            </button>
          </div>
        </div>
      </div>

      <section className="bg-surface border border-main rounded-lg p-4 shadow-sm">
        {error && (
          <div className="mb-4 p-4 bg-error-bg border border-error rounded text-error-text text-sm">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="py-12 text-center text-sm text-secondary">
            <div className="inline-block animate-pulse">Wczytywanie...</div>
          </div>
        )}

        {!loading && results.length === 0 ? (
          <EmptyState />
        ) : !loading && view === 'list' ? (
          <ul className="space-y-2">
            {results.map((r, idx) => (
              <li key={r.id ?? idx} className="group flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-main rounded-lg hover:border-primary hover:shadow-md transition">
                {/* Lewa strona - informacje */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    {/* ID badge */}
                    <div className="flex-shrink-0 bg-primary/10 text-primary px-3 py-2 rounded-lg font-bold text-sm">
                      #{r.id}
                    </div>
                    
                    {/* Główne info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-main line-clamp-1">{r.name}</h4>
                      <p className="text-sm text-secondary line-clamp-1 mt-0.5">{r.description ?? 'Brak opisu'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-secondary">
                        <span className="inline-flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded">
                          <span className="font-medium">Kategoria:</span> {r.category?.name ?? '-'}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded font-bold text-primary">
                          {r.currentQuantity ?? 0} <span className="text-secondary">{r.unit ?? ''}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prawa strona - akcje */}
                <div className="flex-shrink-0">
                  <button onClick={() => setPreview(r)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-main text-main bg-surface hover:bg-primary hover:text-white hover:border-primary transition text-sm font-medium"><Eye className="w-4 h-4"/>Podgląd</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, idx) => (
              <article key={r.id ?? idx} className="group relative bg-surface border border-main rounded-xl shadow-sm hover:shadow-lg transform transition hover:-translate-y-1 overflow-hidden">
                {/* Header bar z kategorią */}
                <div className="bg-primary/10 px-4 py-2 border-b border-main/20">
                  <div className="text-xs font-medium text-primary uppercase tracking-wide">{r.category?.name ?? 'Brak kategorii'}</div>
                </div>

                {/* Główna zawartość */}
                <div className="p-4">
                  {/* ID i nazwa */}
                  <div className="mb-3">
                    <div className="text-xs text-secondary mb-1">ID #{r.id}</div>
                    <h3 className="text-base font-bold text-main line-clamp-2">{r.name}</h3>
                  </div>

                  {/* Opis */}
                  <p className="text-sm text-secondary line-clamp-2 mb-4">{r.description ?? 'Brak opisu'}</p>

                  {/* Info row - ilość i jednostka */}
                  <div className="bg-surface-secondary rounded-lg p-3 mb-4 border border-main/10">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs text-secondary uppercase tracking-wide">Dostępna ilość</div>
                        <div className="text-2xl font-bold text-main mt-1">{r.currentQuantity ?? 0}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-secondary uppercase tracking-wide">Jednostka</div>
                        <div className="text-lg font-semibold text-primary mt-1">{r.unit ?? '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  {r.keywords && r.keywords.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-secondary uppercase tracking-wide mb-2">Słowa kluczowe</div>
                      <div className="flex flex-wrap gap-1">
                        {r.keywords.slice(0, 3).map((kw, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                            {kw}
                          </span>
                        ))}
                        {r.keywords.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-secondary border border-main/20 text-xs text-secondary">
                            +{r.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Akcje */}
                  <button onClick={() => setPreview(r)} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-main text-main bg-surface hover:bg-primary hover:text-white hover:border-primary transition text-sm font-medium"><Eye className="w-4 h-4"/>Podgląd</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-surface border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-main">{preview.name}</h3>
                <div className="text-xs text-secondary">ID: {preview.id} • Kategoria: {preview.category?.name ?? '-'}</div>
              </div>
              <button onClick={() => setPreview(null)} className="p-2 rounded-md text-secondary hover:bg-surface-hover transition"><X className="w-5 h-5"/></button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
              <div>
                <div className="text-xs text-secondary">Opis</div>
                <div className="text-main mt-1">{preview.description ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Ilość / Jednostka</div>
                <div className="text-main mt-1">{preview.currentQuantity ?? '-'} {preview.unit ?? ''}</div>
                <div className="text-xs text-secondary mt-3">Próg minimalny</div>
                <div className="text-main mt-1">{preview.threshold ?? '-'}</div>
                <div className="text-xs text-secondary mt-3">QR</div>
                <div className="text-main mt-1">{preview.qrCode ?? '-'}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPreview(null)} className="px-4 py-2 rounded-full border border-main text-main bg-surface hover:bg-surface-hover transition">Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Search
