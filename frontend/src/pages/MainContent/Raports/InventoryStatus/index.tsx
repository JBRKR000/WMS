import { type FC, useMemo, useState } from 'react'
import { Layers, Search, Eye } from 'lucide-react'

type Category = { id?: number | null; name: string }
type Item = { id?: number | null; name: string; category?: Category | null; quantity: number; unit?: string }
// Transaction type intentionally omitted in this component (not used)

// UI-only sample data (replace with GET /api/items and transactions when wiring API)
const sampleItems: Item[] = [
  { id: 1, name: 'Śruba M6', category: { id: 1, name: 'Śruby' }, quantity: 1200, unit: 'szt.' },
  { id: 2, name: 'Płytka PCB', category: { id: 2, name: 'Elektronika' }, quantity: 35, unit: 'szt.' },
  { id: 3, name: 'Konektor 2pin', category: { id: 2, name: 'Elektronika' }, quantity: 540, unit: 'szt.' },
  { id: 4, name: 'Pasek napędowy', category: { id: 3, name: 'Mechanika' }, quantity: 8, unit: 'szt.' },
]

const InventoryStatus: FC = () => {
  const [q, setQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selected, setSelected] = useState<Item | null>(null)

  const items = sampleItems

  const lowStockThreshold = 20

  const lowStock = useMemo(() => items.filter(i => i.quantity <= lowStockThreshold), [items])

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of items) {
      const cat = it.category?.name ?? 'Bez kategorii'
      map.set(cat, (map.get(cat) ?? 0) + it.quantity)
    }
    return Array.from(map.entries()).map(([name, qty]) => ({ name, qty }))
  }, [items])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return items.filter(it => {
      if (categoryFilter && it.category?.name !== categoryFilter) return false
      if (!qq) return true
      return it.name.toLowerCase().includes(qq) || (it.category?.name ?? '').toLowerCase().includes(qq)
    })
  }, [items, q, categoryFilter])

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Status magazynu</h1>
          <p className="text-sm text-secondary mt-1">Przejrzysty widok stanów magazynowych, alertów niskiego stanu i rozkładu po kategoriach — UI-only.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-main rounded-3xl px-3 py-1">
            <Search className="w-4 h-4 text-secondary" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj pozycji lub kategorii" className="text-sm placeholder-secondary focus:outline-none" />
          </div>
          <div className="bg-white border border-main rounded-2xl px-3 py-1">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-white text-sm focus:outline-none">
              <option value="">Wszystkie kategorie</option>
              {Array.from(new Set(items.map(i => i.category?.name ?? 'Bez kategorii'))).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-main rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-secondary">Liczba pozycji</div>
              <div className="text-2xl font-bold text-main">{items.length}</div>
            </div>
            <Layers className="w-8 h-8 text-main" />
          </div>
          <div className="mt-2 text-sm text-secondary">Różne jednostki: szt., mb itp.</div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Niskie stany (threshold: {lowStockThreshold})</div>
          <div className="mt-3 space-y-2">
            {lowStock.length === 0 ? <div className="text-sm text-secondary">Brak niskich stanów</div> : (
              lowStock.map(i => (
                <div key={i.id} className="flex items-center justify-between bg-surface rounded-md p-2">
                  <div>
                    <div className="text-sm text-main font-medium">{i.name}</div>
                    <div className="text-xs text-secondary">{i.category?.name ?? 'Bez kategorii'}</div>
                  </div>
                  <div className="text-sm font-semibold text-red-600">{i.quantity} {i.unit ?? ''}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Rozkład po kategoriach</div>
          <ul className="mt-3 space-y-2">
            {categories.map(c => (
              <li key={c.name} className="flex items-center justify-between">
                <div className="text-sm text-main">{c.name}</div>
                <div className="text-sm text-secondary">{c.qty} szt.</div>
              </li>
            ))}
          </ul>
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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary bg-surface">
                    <th className="px-3 py-2">Nazwa</th>
                    <th className="px-3 py-2">Kategoria</th>
                    <th className="px-3 py-2">Stan</th>
                    <th className="px-3 py-2">Jednostka</th>
                    <th className="px-3 py-2">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it, idx) => (
                    <tr key={it.id ?? idx} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                      <td className="px-3 py-2 text-main">{it.name}</td>
                      <td className="px-3 py-2 text-secondary">{it.category?.name ?? 'Bez kategorii'}</td>
                      <td className={`px-3 py-2 font-semibold ${it.quantity <= lowStockThreshold ? 'text-red-600' : 'text-main'}`}>{it.quantity}</td>
                      <td className="px-3 py-2 text-secondary">{it.unit ?? '-'}</td>
                      <td className="px-3 py-2 text-main"><button onClick={() => setSelected(it)} className="px-3 py-1 rounded-full border border-main bg-white inline-flex items-center gap-2"><Eye className="w-4 h-4"/>Szczegóły</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="bg-white border border-main rounded-lg p-4">
          <h4 className="text-sm font-semibold text-main">Mapa zapasów</h4>
          <div className="mt-3 h-56 flex items-center justify-center text-secondary">
            {/* heatmap placeholder - replace with real visualization when wiring API */}
            <div className="grid grid-cols-4 gap-2 w-full px-2">
              {items.map(it => (
                <div key={it.id} className={`h-12 rounded-md flex items-center justify-center text-xs ${it.quantity > 500 ? 'bg-green-200' : it.quantity > 50 ? 'bg-yellow-200' : 'bg-red-200'}`}>{it.name}</div>
              ))}
            </div>
          </div>
          <div className="mt-3 text-xs text-secondary">Mapa pokazuje przybliżony poziom zapasów (podgląd UI)</div>
        </aside>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl bg-white border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-main">Szczegóły pozycji</h3>
                <div className="text-xs text-secondary">{selected.id}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-secondary">Zamknij</button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
              <div>
                <div className="text-xs text-secondary">Nazwa</div>
                <div className="text-main font-medium">{selected.name}</div>
                <div className="text-xs text-secondary mt-2">Kategoria</div>
                <div className="text-main">{selected.category?.name ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Stan</div>
                <div className="text-main font-semibold">{selected.quantity} {selected.unit ?? ''}</div>
                <div className="text-xs text-secondary mt-2">Proponowane działanie</div>
                <div className="text-main">{selected.quantity <= lowStockThreshold ? 'Zamów uzupełnienie' : 'OK'}</div>
              </div>
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

export default InventoryStatus
