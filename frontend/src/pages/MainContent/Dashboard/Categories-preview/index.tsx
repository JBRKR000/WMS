import { type FC, useMemo, useState } from 'react'
import { Search, PlusCircle, FileText, LayoutGrid, List, X } from 'lucide-react'
import CreateCategoryOrKeywordModal from '../../../../components/Category-previewComponents/addKeywordModal'

type Category = {
  id?: number | null
  name: string
  description?: string | null
  keywords?: string[] // Dodano pole keywords
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
  const [isModalOpen, setIsModalOpen] = useState(false) // Stan dla modalu
  const categories: Category[] = []
  const items: Category[] = [] // Dodano tablicę dla przedmiotów

  const filteredCategories = useMemo(() => {
    if (!query) return categories
    const q = query.toLowerCase()
    return categories.filter(c => 
      (c.name ?? '').toLowerCase().includes(q) || 
      (c.description ?? '').toLowerCase().includes(q) || 
      String(c.id).includes(q) ||
      (c.keywords ?? []).some(keyword => keyword.toLowerCase().includes(q))
    )
  }, [query, categories])

  const filteredItems = useMemo(() => {
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter(i => 
      (i.name ?? '').toLowerCase().includes(q) || 
      (i.description ?? '').toLowerCase().includes(q) || 
      String(i.id).includes(q)
    )
  }, [query, items])

  const handleAddCategoryOrKeyword = (data: { type: 'category' | 'keyword'; name: string; description?: string; categoryId?: number }) => {
    if (data.type === 'category') {
      categories.push({
        id: categories.length + 1,
        name: data.name,
        description: data.description,
        keywords: [],
      })
    } else if (data.type === 'keyword' && data.categoryId) {
      const category = categories.find(c => c.id === data.categoryId)
      if (category) {
        category.keywords = [...(category.keywords ?? []), data.name]
      }
    }
    setIsModalOpen(false) // Zamknij modal po dodaniu
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-main">Kategorie i słowa kluczowe</h2>
          <p className="text-sm text-secondary mt-1">Podgląd kategorii zapisanych w bazie danych</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-white dark:bg-transparent border border-main rounded-2xl px-2 py-1 w-full lg:w-64">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj nazwy, opisu lub słów kluczowych"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800/30 border border-transparent rounded-2xl text-main dark:text-gray-100 placeholder-secondary dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-500/50 transition-all duration-300 text-sm"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)} // Otwórz modal
            className="px-3 py-2 rounded-md bg-primary text-white flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Dodaj
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories Section */}
        <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-secondary">Pola: id, name, description, keywords</div>
            <div className="text-sm text-secondary">Ilość: {filteredCategories.length}</div>
          </div>

          {filteredCategories.length === 0 ? (
            <EmptyState label="Brak kategorii w bazie" />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCategories.map((c, idx) => (
                <div key={c.id ?? idx} className="bg-white border border-main rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-secondary">ID: {c.id ?? '-'}</p>
                      <h4 className="text-lg font-semibold text-main mt-2">{c.name}</h4>
                      <p className="text-sm text-secondary mt-2">{c.description ?? 'Brak opisu'}</p>
                    </div>
                    <div className="ml-3 text-xs text-secondary">{(c.name || '').slice(0,1).toUpperCase()}</div>
                  </div>
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {(c.keywords ?? []).map((keyword, i) => (
                        <span key={i} className="px-2 py-1 bg-surface-secondary border border-main rounded-full text-xs text-secondary flex items-center gap-2">
                          {keyword}
                          <button onClick={() => handleRemoveKeyword(c, keyword)} className="text-red-500 hover:text-red-700">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Dodaj słowo kluczowe"
                        className="w-full px-2 py-1 border border-main rounded-lg text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAddKeyword(c, e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <button className="px-2 py-1 bg-primary text-white rounded-lg text-sm">Dodaj</button>
                    </div>
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
                    <th className="px-3 py-2">Słowa kluczowe</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((c, idx) => (
                    <tr key={c.id ?? idx} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                      <td className="px-3 py-2 text-secondary align-top">{c.id}</td>
                      <td className="px-3 py-2 text-main align-top">{c.name}</td>
                      <td className="px-3 py-2 text-secondary align-top">{c.description ?? '-'}</td>
                      <td className="px-3 py-2 text-secondary align-top">
                        <div className="flex flex-wrap gap-2">
                          {(c.keywords ?? []).map((keyword, i) => (
                            <span key={i} className="px-2 py-1 bg-surface-secondary border border-main rounded-full text-xs text-secondary flex items-center gap-2">
                              {keyword}
                              <button onClick={() => handleRemoveKeyword(c, keyword)} className="text-red-500 hover:text-red-700">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Dodaj słowo kluczowe"
                            className="w-full px-2 py-1 border border-main rounded-lg text-sm"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleAddKeyword(c, e.currentTarget.value)
                                e.currentTarget.value = ''
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Items Section */}
        <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-secondary">Pola: id, name, description</div>
            <div className="text-sm text-secondary">Ilość: {filteredItems.length}</div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState label="Brak przedmiotów w bazie" />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((i, idx) => (
                <div key={i.id ?? idx} className="bg-white border border-main rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-secondary">ID: {i.id ?? '-'}</p>
                      <h4 className="text-lg font-semibold text-main mt-2">{i.name}</h4>
                      <p className="text-sm text-secondary mt-2">{i.description ?? 'Brak opisu'}</p>
                    </div>
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
                  {filteredItems.map((i, idx) => (
                    <tr key={i.id ?? idx} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                      <td className="px-3 py-2 text-secondary align-top">{i.id}</td>
                      <td className="px-3 py-2 text-main align-top">{i.name}</td>
                      <td className="px-3 py-2 text-secondary align-top">{i.description ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      <CreateCategoryOrKeywordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Zamknij modal
        onSubmit={handleAddCategoryOrKeyword} // Obsługa dodawania
        categories={categories} // Przekaż istniejące kategorie
      />
    </main>
  )
}

export default CategoriesPreview
