import { type FC, useMemo, useState } from 'react'
import { Search, PlusCircle, Download, FileText, LayoutGrid, List } from 'lucide-react'

type Category = {
  id?: number | null
  name: string
  description?: string | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak kategorii' }) => (
  <div className="py-8 text-center text-sm text-secondary">
    <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <FileText className="w-7 h-7 text-secondary" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Dodaj kategorię aby zacząć</div>
  </div>
)

const CategoriesPreview: FC = () => {
  // replace with API data
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const categories: Category[] = []

  const filtered = useMemo(() => {
    if (!query) return categories
    const q = query.toLowerCase()
    return categories.filter(c => (c.name ?? '').toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q) || String(c.id).includes(q))
  }, [query, categories])

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-main">Kategorie i słowa kluczowe</h2>
          <p className="text-sm text-secondary mt-1">Podgląd kategorii zapisanych w bazie danych</p>

          <div className="mt-3 flex items-center gap-3">
            <div className="px-3 py-2 bg-surface-secondary border border-main rounded-lg text-sm">
              <div className="text-xs text-secondary">Wszystkie</div>
              <div className="text-lg font-semibold text-main">{categories.length}</div>
            </div>
            <div className="px-3 py-2 bg-surface-secondary border border-main rounded-lg text-sm">
              <div className="text-xs text-secondary">Najdłuższa nazwa</div>
              <div className="text-lg font-semibold text-main">{categories.reduce((a, b) => a.name.length > (b.name?.length ?? 0) ? a : b, { name: '' } as Category).name || '-'}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-white dark:bg-transparent border border-main rounded-2xl px-2 py-1 w-full lg:w-64">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj nazwy lub opisu"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800/30 border border-transparent rounded-2xl text-main dark:text-gray-100 placeholder-secondary dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-500/50 transition-all duration-300 text-sm"
            />
          </div>

          <div className="inline-flex items-center gap-2 bg-surface rounded-2xl p-1 border border-main">
            <button onClick={() => setView('grid')} className={`p-2 rounded-md ${view === 'grid' ? 'bg-surface-hover' : ''}`} title="Grid"><LayoutGrid className="w-4 h-4 text-main"/></button>
            <button onClick={() => setView('table')} className={`p-2 rounded-md ${view === 'table' ? 'bg-surface-hover' : ''}`} title="Table"><List className="w-4 h-4 text-main"/></button>
          </div>

          <button className="px-3 py-2 rounded-md bg-primary text-white flex items-center gap-2"><PlusCircle className="w-4 h-4"/>Dodaj</button>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-secondary">Pola: id, name, description</div>
          <div className="text-sm text-secondary">Ilość: {filtered.length}</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState label="Brak kategorii w bazie" />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((c, idx) => (
              <div key={c.id ?? idx} className="bg-white border border-main rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-secondary">ID: {c.id ?? '-'}</p>
                    <h4 className="text-lg font-semibold text-main mt-2">{c.name}</h4>
                    <p className="text-sm text-secondary mt-2">{c.description ?? 'Brak opisu'}</p>
                  </div>
                  <div className="ml-3 text-xs text-secondary">{(c.name || '').slice(0,1).toUpperCase()}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-surface-secondary border border-main rounded-full text-xs text-secondary">tag1</span>
                  <span className="px-2 py-1 bg-surface-secondary border border-main rounded-full text-xs text-secondary">tag2</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary bg-surface">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Nazwa</th>
                  <th className="px-3 py-2">Opis</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr key={c.id ?? idx} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                    <td className="px-3 py-2 text-secondary align-top">{c.id}</td>
                    <td className="px-3 py-2 text-main align-top">{c.name}</td>
                    <td className="px-3 py-2 text-secondary align-top">{c.description ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default CategoriesPreview
