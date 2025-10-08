import { type FC, useMemo, useState } from 'react'
import { Search as SearchIcon, Filter, Eye, Box, X } from 'lucide-react'

// Use Item model fields only
type Category = { id?: number | null; name: string }
type Item = {
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
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [lowStock, setLowStock] = useState(false)
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [preview, setPreview] = useState<Item | null>(null)

  const items: Item[] = [] // placeholder

  const categories = useMemo(() => {
    const map = new Map<number, string>()
    items.forEach(it => { if (it.category?.id != null) map.set(it.category.id, it.category.name) })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  const units = useMemo(() => {
    const set = new Set<string>()
    items.forEach(it => { if (it.unit) set.add(it.unit) })
    return Array.from(set.values())
  }, [items])

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const min = minQty === '' ? null : Number(minQty)
    const max = maxQty === '' ? null : Number(maxQty)
    const lowThresh = lowStockThreshold === '' ? null : Number(lowStockThreshold)

    return items.filter(it => {
      if (category && String(it.category?.id) !== category) return false
      if (unit && (it.unit ?? '') !== unit) return false
      if (min != null && (it.currentQuantity == null || it.currentQuantity < min)) return false
      if (max != null && (it.currentQuantity == null || it.currentQuantity > max)) return false
      if (lowStock && lowThresh != null && (it.currentQuantity == null || it.currentQuantity >= lowThresh)) return false
      if (dateFrom) {
        if (!it.createdAt) return false
        const d = new Date(it.createdAt)
        const from = new Date(dateFrom)
        if (d < from) return false
      }
      if (dateTo) {
        if (!it.createdAt) return false
        const d = new Date(it.createdAt)
        const to = new Date(dateTo)
        // include the full day for dateTo
        to.setHours(23,59,59,999)
        if (d > to) return false
      }
      if (!qq) return true
      return (
        it.name.toLowerCase().includes(qq) ||
        (it.description ?? '').toLowerCase().includes(qq) ||
        (it.qrCode ?? '').toLowerCase().includes(qq) ||
        (it.category?.name ?? '').toLowerCase().includes(qq)
      )
    })
  }, [items, q, category, unit, minQty, maxQty, dateFrom, dateTo, lowStock, lowStockThreshold])

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Wyszukiwarka komponentów</h1>
          <p className="text-sm text-secondary mt-1">Szybkie znajdowanie komponentów po nazwie, opisie, QR lub kategorii — widok oparty tylko na modelu Item.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white border border-main rounded-2xl px-3 py-1 w-full md:w-96">
            <SearchIcon className="w-4 h-4 text-secondary mr-2" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj..." className="w-full bg-white text-main placeholder-secondary text-sm focus:outline-none" />
          </div>

          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 bg-white border border-main rounded-2xl text-sm text-main">
            <option value="">Wszystkie kategorie</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>

          <button onClick={() => setView(view === 'grid' ? 'list' : 'grid')} className="px-3 py-2 rounded-full border border-main bg-white text-sm"><Filter className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Advanced filters panel */}
      <div className="bg-white border border-main rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-secondary">Filtry zaawansowane</div>
          <div className="text-xs text-secondary">Wyszukiwanie wielokryterialne</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-secondary">Jednostka</label>
            <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
              <option value="">Wszystkie</option>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-secondary">Ilość min</label>
            <input type="number" value={minQty} onChange={e => setMinQty(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>

          <div>
            <label className="text-xs text-secondary">Ilość max</label>
            <input type="number" value={maxQty} onChange={e => setMaxQty(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>

          <div>
            <label className="text-xs text-secondary">Niska ilość</label>
            <div className="flex gap-2">
              <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} className="mt-2" />
              <input type="number" placeholder="próg" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-secondary">Data od</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>

          <div>
            <label className="text-xs text-secondary">Data do</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-secondary">QR code</label>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="QR" className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        {results.length === 0 ? (
          <EmptyState />
        ) : view === 'list' ? (
          <ul className="divide-y divide-main">
            {results.map((r, idx) => (
              <li key={r.id ?? idx} className="flex items-center justify-between py-3 px-2 hover:bg-surface-hover rounded-md">
                <div>
                  <div className="text-sm text-secondary">#{r.id}</div>
                  <div className="text-main font-medium">{r.name}</div>
                  <div className="text-xs text-secondary">{r.category?.name ?? '-'} • {r.currentQuantity ?? '-'} {r.unit ?? ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreview(r)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Eye className="w-4 h-4"/>Podgląd</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, idx) => (
              <article key={r.id ?? idx} className="p-4 rounded-xl bg-white border border-main shadow-sm group hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-main">{r.name}</h3>
                    <p className="text-xs text-secondary mt-1 line-clamp-2">{r.description ?? '-'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-main">{r.currentQuantity ?? '-'}</div>
                    <div className="text-xs text-secondary">{r.unit ?? ''}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-secondary">Kategoria: {r.category?.name ?? '-'}</div>
                  <div className="opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setPreview(r)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Eye className="w-4 h-4"/>Podgląd</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Preview modal */}
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
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Search
