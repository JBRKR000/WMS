import { type FC, useMemo, useState } from 'react'
import { Search, Tag, Box, Eye, X, Download } from 'lucide-react'

// Item model from backend (fields only)
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

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak komponentów' }) => (
  <div className="py-12 text-center text-sm text-secondary">
    <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <Box className="w-8 h-8" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Dodaj komponenty, aby zobaczyć je tutaj</div>
  </div>
)

const ComponentList: FC = () => {
  // UI-only: placeholder list (replace with GET /api/items later)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [view, setView] = useState<'cards' | 'compact'>('cards')
  const [modal, setModal] = useState<Item | null>(null)

  const items: Item[] = []

  const categories = useMemo(() => {
    const map = new Map<number, string>()
    items.forEach(i => { if (i.category?.id != null) map.set(i.category.id, i.category.name) })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(i => {
      if (categoryFilter && String(i.category?.id) !== categoryFilter) return false
      if (!q) return true
      return (
        (String(i.id ?? '')).includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.description ?? '').toLowerCase().includes(q) ||
        (i.qrCode ?? '').toLowerCase().includes(q) ||
        (i.category?.name ?? '').toLowerCase().includes(q)
      )
    })
  }, [items, query, categoryFilter])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      {/* Hero / summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Komponenty magazynowe</h1>
          <p className="text-sm text-secondary mt-1">Widok bazujący na modelu Item. Wyświetlane pola: id, name, description, category, unit, currentQuantity, qrCode, createdAt, updatedAt.</p>
          <div className="mt-3 flex items-center gap-3 text-sm text-secondary">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-main">Łącznie: <span className="font-semibold text-main ml-1">{items.length}</span></div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-main">Kategorie: <span className="font-semibold text-main ml-1">{categories.length}</span></div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white dark:bg-transparent border border-main rounded-2xl px-3 py-1 w-full md:w-80">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj po nazwie, opisie, QR" className="w-full bg-white dark:bg-gray-800/30 text-main placeholder-secondary dark:placeholder-gray-400 focus:outline-none text-sm" />
          </div>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-white border border-main rounded-2xl text-sm text-main">
            <option value="">Wszystkie kategorie</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>

          <div className="inline-flex items-center gap-2">
            <button onClick={() => setView('cards')} className={`px-3 py-2 rounded-full border border-main text-sm ${view === 'cards' ? 'bg-surface-hover' : 'bg-white'}`}><Tag className="w-4 h-4"/></button>
            <button onClick={() => setView('compact')} className={`px-3 py-2 rounded-full border border-main text-sm ${view === 'compact' ? 'bg-surface-hover' : 'bg-white'}`}><Box className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === 'compact' ? (
          <ul className="divide-y divide-main">
            {filtered.map((it, idx) => (
              <li key={it.id ?? idx} className="flex items-center justify-between py-3 hover:bg-surface-hover px-2 rounded-md">
                <div>
                  <div className="text-sm text-secondary">#{it.id}</div>
                  <div className="text-main font-medium">{it.name}</div>
                  <div className="text-xs text-secondary">{it.category?.name ?? '-'} • {it.currentQuantity ?? '-'} {it.unit ?? ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setModal(it)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Eye className="w-4 h-4"/>Szczegóły</button>
                  <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Download className="w-4 h-4"/>CSV</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((it, idx) => (
              <article key={it.id ?? idx} className="group p-4 rounded-xl bg-white border border-main shadow-sm transform transition hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-secondary">ID: {it.id}</div>
                    <h3 className="text-lg font-semibold text-main mt-1">{it.name}</h3>
                    <p className="text-xs text-secondary mt-1 line-clamp-2">{it.description ?? '-'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-main">{it.currentQuantity ?? '-'}</div>
                    <div className="text-xs text-secondary">{it.unit ?? ''}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-secondary">Kategoria: {it.category?.name ?? '-'}</div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setModal(it)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Eye className="w-4 h-4"/>Szczegóły</button>
                    <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Download className="w-4 h-4"/>CSV</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal - UI only */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-main">{modal.name}</h3>
                <div className="text-xs text-secondary">ID: {modal.id} • Kategoria: {modal.category?.name ?? '-'}</div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-md text-secondary"><X className="w-5 h-5"/></button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
              <div>
                <div className="text-xs text-secondary">Opis</div>
                <div className="text-main mt-1">{modal.description ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Ilość / Jednostka</div>
                <div className="text-main mt-1">{modal.currentQuantity ?? '-'} {modal.unit ?? ''}</div>
                <div className="text-xs text-secondary mt-3">QR</div>
                <div className="text-main mt-1">{modal.qrCode ?? '-'}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-full border border-main text-main bg-white">Zamknij</button>
              <button className="px-4 py-2 rounded-full border border-main text-white bg-emerald-500">Eksportuj</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default ComponentList
