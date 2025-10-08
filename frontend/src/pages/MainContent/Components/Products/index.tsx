import { type FC, useMemo, useState } from 'react'
import { Search, ShoppingCart, Box, Eye, Star, X } from 'lucide-react'

// There is no dedicated Product model in backend — reuse Item fields for Products UI
type Category = { id?: number | null; name: string }
type Product = {
  id?: number | null
  name: string
  description?: string | null
  category?: Category | null
  unit?: string | null
  currentQuantity?: number
  qrCode?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak produktów' }) => (
  <div className="py-12 text-center text-sm text-secondary">
    <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <ShoppingCart className="w-8 h-8" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Dodaj produkty aby móc nimi zarządzać</div>
  </div>
)

const Products: FC = () => {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [preview, setPreview] = useState<Product | null>(null)

  // placeholder - will be replaced by GET /api/items
  const products: Product[] = []

  const categories = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach(p => { if (p.category?.id != null) map.set(p.category.id, p.category.name) })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(p => {
      if (categoryFilter && String(p.category?.id) !== categoryFilter) return false
      if (favoriteOnly) return false // placeholder: no favorite flag in model
      if (!q) return true
      return (
        (String(p.id ?? '')).includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.qrCode ?? '').toLowerCase().includes(q)
      )
    })
  }, [products, query, categoryFilter, favoriteOnly])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Produkty</h1>
          <p className="text-sm text-secondary mt-1">Przegląd produktów oparty o model Item — pola dostępne: id, name, description, category, unit, currentQuantity, qrCode, createdAt, updatedAt.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white dark:bg-transparent border border-main rounded-2xl px-3 py-1 w-full md:w-80">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj produktów" className="w-full bg-white dark:bg-gray-800/30 text-main placeholder-secondary text-sm focus:outline-none" />
          </div>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-white border border-main rounded-2xl text-sm text-main">
            <option value="">Wszystkie kategorie</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>

          <div className="flex items-center gap-2">
            <button onClick={() => setView('grid')} className={`px-3 py-2 rounded-full border border-main text-sm ${view === 'grid' ? 'bg-surface-hover' : 'bg-white'}`}><Box className="w-4 h-4"/></button>
            <button onClick={() => setView('list')} className={`px-3 py-2 rounded-full border border-main text-sm ${view === 'list' ? 'bg-surface-hover' : 'bg-white'}`}><Star className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === 'list' ? (
          <ul className="divide-y divide-main">
            {filtered.map((p, idx) => (
              <li key={p.id ?? idx} className="flex items-center justify-between py-3 px-2 hover:bg-surface-hover rounded-md">
                <div>
                  <div className="text-sm text-secondary">#{p.id}</div>
                  <div className="text-main font-medium">{p.name}</div>
                  <div className="text-xs text-secondary">{p.category?.name ?? '-'} • {p.currentQuantity ?? '-'} {p.unit ?? ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreview(p)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Eye className="w-4 h-4"/>Podgląd</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, idx) => (
              <article key={p.id ?? idx} className="p-4 rounded-xl bg-white border border-main shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-main">{p.name}</h3>
                    <p className="text-xs text-secondary mt-1 line-clamp-2">{p.description ?? '-'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-main">{p.currentQuantity ?? '-'}</div>
                    <div className="text-xs text-secondary">{p.unit ?? ''}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-secondary">Kategoria: {p.category?.name ?? '-'}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPreview(p)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Eye className="w-4 h-4"/>Podgląd</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Preview modal UI-only */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-main">{preview.name}</h3>
                <div className="text-xs text-secondary">ID: {preview.id} • Kategoria: {preview.category?.name ?? '-'}</div>
              </div>
              <button onClick={() => setPreview(null)} className="p-2 rounded-md text-secondary"><X className="w-5 h-5"/></button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
              <div>
                <div className="text-xs text-secondary">Opis</div>
                <div className="text-main mt-1">{preview.description ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Ilość / Jednostka</div>
                <div className="text-main mt-1">{preview.currentQuantity ?? '-'} {preview.unit ?? ''}</div>
                <div className="text-xs text-secondary mt-3">QR</div>
                <div className="text-main mt-1">{preview.qrCode ?? '-'}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPreview(null)} className="px-4 py-2 rounded-full border border-main text-main bg-white">Zamknij</button>
              <button className="px-4 py-2 rounded-full border border-main text-white bg-emerald-500">Eksportuj</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Products
