import { type FC, useMemo, useState, useEffect } from 'react'
import { Search, PlusCircle, FileText, LayoutGrid, List, X } from 'lucide-react'
import CreateCategoryOrKeywordModal from '../../../../components/Category-previewComponents/addKeywordModal'

type Category = {
  id?: number | null
  name: string
  description?: string | null
  keywords?: string[] // Dodano pole keywords
}

type Keyword = {
  id: number
  value: string
  itemsCount: number // Zmieniono z items: any[] na itemsCount: number
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
  const [categories, setCategories] = useState<Category[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([]) // Zmieniono z items na keywords
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          console.error('Brak tokenu autoryzacji')
          setCategories([])
          return
        }

        const requestOptions: RequestInit = {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }

        const res = await fetch('/api/categories', requestOptions)
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        const mapped: Category[] = (data ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          keywords: [], // backend nie zwraca keywords tutaj — zostaw pustą tablicę
        }))
        setCategories(mapped)
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setCategoriesLoading(false)
      }
    }

    const fetchKeywords = async () => {
      try {
        setKeywordsLoading(true)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          console.error('Brak tokenu autoryzacji')
          setKeywords([])
          return
        }

        const requestOptions: RequestInit = {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }

        const res = await fetch('/api/keywords', requestOptions)
        if (!res.ok) throw new Error('Failed to fetch keywords')
        const data = await res.json()
        setKeywords(data ?? [])
      } catch (err) {
        console.error('Error fetching keywords:', err)
      } finally {
        setKeywordsLoading(false)
      }
    }

    fetchCategories()
    fetchKeywords()
  }, [])

  // helpery do dodawania/usuwania słów kluczowych
  const handleAddKeyword = (category: Category, keyword: string) => {
    if (!keyword || !category?.id) return
    setCategories(prev =>
      prev.map(c =>
        c.id === category.id ? { ...c, keywords: [...(c.keywords ?? []), keyword] } : c
      )
    )
  }

  const handleRemoveKeyword = (category: Category, keyword: string) => {
    if (!category?.id) return
    setCategories(prev =>
      prev.map(c =>
        c.id === category.id ? { ...c, keywords: (c.keywords ?? []).filter(k => k !== keyword) } : c
      )
    )
  }

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

  const filteredKeywords = useMemo(() => {
    if (!query) return keywords
    const q = query.toLowerCase()
    return keywords.filter(k => 
      k.value.toLowerCase().includes(q) || 
      String(k.id).includes(q)
    )
  }, [query, keywords])

  const handleAddCategoryOrKeyword = (data: { type: 'category' | 'keyword'; name: string; description?: string; categoryId?: number }) => {
    if (data.type === 'category') {
      setCategories(prev => [
        ...prev,
        {
          id: (prev.length ? Math.max(...prev.map(p => p.id ?? 0)) + 1 : 1),
          name: data.name,
          description: data.description,
          keywords: [],
        },
      ])
    } else if (data.type === 'keyword' && data.categoryId) {
      setCategories(prev =>
        prev.map(c =>
          c.id === data.categoryId ? { ...c, keywords: [...(c.keywords ?? []), data.name] } : c
        )
      )
    }
    setIsModalOpen(false)
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-secondary">Pola: id, name, description, keywords</div>
              <div className="flex items-center gap-1 border border-main rounded-lg p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`p-1 rounded ${view === 'grid' ? 'bg-primary text-white' : 'text-secondary hover:bg-surface'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('table')}
                  className={`p-1 rounded ${view === 'table' ? 'bg-primary text-white' : 'text-secondary hover:bg-surface'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-secondary">Ilość: {filteredCategories.length}</div>
          </div>

          {filteredCategories.length === 0 ? (
            <EmptyState label="Brak kategorii w bazie" />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCategories.map((c, idx) => (
                <div key={c.id ?? idx} className="bg-white border border-main rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-secondary">#{c.id ?? '-'}</span>
                        <h4 className="text-sm font-semibold text-main truncate">{c.name}</h4>
                      </div>
                      <p className="text-xs text-secondary line-clamp-2">{c.description ?? 'Brak opisu'}</p>
                    </div>
                    <div className="w-6 h-6 bg-surface-secondary rounded-full flex items-center justify-center text-xs text-secondary">
                      {(c.name || '').slice(0,1).toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {(c.keywords ?? []).slice(0, 3).map((keyword, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-surface-secondary border border-main rounded text-xs text-secondary flex items-center gap-1">
                          {keyword.length > 8 ? keyword.slice(0, 8) + '...' : keyword}
                          <button onClick={() => handleRemoveKeyword(c, keyword)} className="text-red-500 hover:text-red-700">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      {(c.keywords ?? []).length > 3 && (
                        <span className="px-1.5 py-0.5 bg-surface-secondary border border-main rounded text-xs text-secondary">
                          +{(c.keywords ?? []).length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      
                      <button className="px-2 py-1 bg-primary text-white rounded text-xs">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-secondary bg-surface">
                    <th className="px-2 py-1.5 w-12">ID</th>
                    <th className="px-2 py-1.5">Nazwa</th>
                    <th className="px-2 py-1.5">Opis</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((c, idx) => (
                    <tr key={c.id ?? idx} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                      <td className="px-2 py-2 text-secondary align-top font-mono">#{c.id}</td>
                      <td className="px-2 py-2 text-main align-top font-medium">{c.name}</td>
                      <td className="px-2 py-2 text-secondary align-top max-w-32 truncate">{c.description ?? '-'}</td>
                      <td className="px-2 py-2 text-secondary align-top">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {(c.keywords ?? []).slice(0, 4).map((keyword, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-surface-secondary border border-main rounded text-xs text-secondary flex items-center gap-1">
                              {keyword.length > 10 ? keyword.slice(0, 10) + '...' : keyword}
                              <button onClick={() => handleRemoveKeyword(c, keyword)} className="text-red-500 hover:text-red-700">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                          {(c.keywords ?? []).length > 4 && (
                            <span className="px-1.5 py-0.5 bg-surface-secondary border border-main rounded text-xs text-secondary">
                              +{(c.keywords ?? []).length - 4}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          
                          <button className="px-1.5 py-0.5 bg-primary text-white rounded text-xs">+</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Keywords Section */}
        <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-secondary">Pola: id, value, itemsCount</div>
            <div className="text-sm text-secondary">Ilość: {filteredKeywords.length}</div>
          </div>

          {keywordsLoading ? (
            <div className="py-8 text-center text-sm text-secondary">
              Ładowanie słów kluczowych...
            </div>
          ) : filteredKeywords.length === 0 ? (
            <EmptyState label="Brak słów kluczowych w bazie" />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredKeywords.map((k) => (
                <div key={k.id} className="bg-white border border-main rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-secondary">#{k.id}</span>
                        <h4 className="text-sm font-semibold text-main truncate">{k.value}</h4>
                      </div>
                      <p className="text-xs text-secondary">
                        Przedmioty: {k.itemsCount ?? 0}
                      </p>
                    </div>
                    <div className="w-6 h-6 bg-surface-secondary rounded-full flex items-center justify-center text-xs text-secondary">
                      {k.value.slice(0,1).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-surface-secondary border border-main rounded text-xs text-secondary">
                      {k.value}
                    </span>
                    <button className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-secondary bg-surface">
                    <th className="px-2 py-1.5 w-12">ID</th>
                    <th className="px-2 py-1.5">Wartość</th>
                    <th className="px-2 py-1.5">Przedmioty</th>
                    <th className="px-2 py-1.5">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeywords.map((k, idx) => (
                    <tr key={k.id} className={`border-t border-main ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} hover:bg-surface-hover`}>
                      <td className="px-2 py-2 text-secondary align-top font-mono">#{k.id}</td>
                      <td className="px-2 py-2 text-main align-top font-medium">{k.value}</td>
                      <td className="px-2 py-2 text-secondary align-top">{k.itemsCount ?? 0}</td>
                      <td className="px-2 py-2 text-secondary align-top">
                        <button className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                          Usuń
                        </button>
                      </td>
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
         categories={categories.filter(c => c.id != null).map(c => ({ id: c.id!, name: c.name }))} // Przekaż istniejące kategorie
       />
     </main>
   )
 }

 export default CategoriesPreview
