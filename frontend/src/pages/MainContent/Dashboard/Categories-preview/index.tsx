import { type FC, useMemo, useState, useEffect } from 'react'
import { Search, PlusCircle, FileText, LayoutGrid, List, X, Edit3, Trash2 } from 'lucide-react'
import CreateCategoryOrKeywordModal from '../../../../components/Category-previewComponents/addKeywordModal'
import EditCategoryModal from '../../../../components/Category-previewComponents/EditCategoryModal'
import EditKeywordModal from '../../../../components/Category-previewComponents/EditKeywordModal'

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
  // State for editing category via modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  // State for editing keyword via modal
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null)
  const [isEditKeywordModalOpen, setIsEditKeywordModalOpen] = useState(false)
  // status popup for deletion/addition
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  // auto-dismiss status popup
  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [statusMessage])
  
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

  // replace handleAddCategoryOrKeyword to use API for categories
  const handleAddCategoryOrKeyword = async (data: { type: 'category' | 'keyword'; name: string; description?: string; categoryId?: number }) => {
    const authToken = localStorage.getItem('authToken')
    if (data.type === 'category') {
      if (!authToken) {
        console.error('Brak tokenu autoryzacji')
        return
      }
      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ name: data.name, description: data.description }),
        })
        if (!res.ok) throw new Error('Failed to create category')
        const created = await res.json()
        setCategories(prev => [
          ...prev,
          { id: created.id, name: created.name, description: created.description, keywords: [] },
        ])
      } catch (err) {
        console.error('Error creating category:', err)
      }
    } else if (data.type === 'keyword') {
      if (!authToken) {
        console.error('Brak tokenu autoryzacji')
        return
      }
      try {
        const res = await fetch('/api/keywords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ value: data.name.toLowerCase() }),
        })
        if (!res.ok) throw new Error('Failed to create keyword')
        const created = await res.json()
        setKeywords(prev => [
          ...prev,
          { id: created.id, value: created.value.toLowerCase(), itemsCount: 0 },
        ])
      } catch (err) {
        console.error('Error creating keyword:', err)
      }
    }
    setIsModalOpen(false)
  }

  // Open edit modal for category
  const handleEditCategory = (category: Category) => {
    if (!category.id) return
    setEditingCategory(category)
    setIsEditModalOpen(true)
  }

  // Update category via API and state
  const handleUpdateCategory = async (data: { id: number; name: string; description?: string }) => {
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      console.error('Brak tokenu autoryzacji')
      return
    }
    try {
      const res = await fetch(`/api/categories/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: data.name, description: data.description }),
      })
      if (!res.ok) throw new Error('Failed to update category')
      const updated = await res.json()
      setCategories(prev =>
        prev.map(c =>
          c.id === updated.id ? { ...c, name: updated.name, description: updated.description, keywords: c.keywords } : c
        )
      )
    } catch (err) {
      console.error('Error updating category:', err)
    } finally {
      setIsEditModalOpen(false)
      setEditingCategory(null)
    }
  }

  // Delete category via API
  const handleDeleteCategory = async (category: Category) => {
    if (!category.id) return
  // confirmation handled in modal
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      console.error('Brak tokenu autoryzacji')
      return
    }
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      if (!res.ok) throw new Error('Failed to delete category')
      setCategories(prev => prev.filter(c => c.id !== category.id))
    } catch (err) {
      console.error('Error deleting category:', err)
    }
  }
  const handleDeleteCategoryById = async (id: number) => {
    const category = categories.find(c => c.id === id)
    if (category) {
      await handleDeleteCategory(category)
      setIsEditModalOpen(false)
      setEditingCategory(null)
      setStatusMessage('Usunięto kategorię pomyślnie')
    }
  }
  // Update keyword via API and state
  const handleUpdateKeyword = async (data: { id: number; value: string }) => {
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      console.error('Brak tokenu autoryzacji')
      return
    }
    try {
      const res = await fetch(`/api/keywords/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ value: data.value }),
      })
      if (!res.ok) throw new Error('Failed to update keyword')
      const updated = await res.json()
      setKeywords(prev =>
        prev.map(k => (k.id === updated.id ? { ...k, value: updated.value } : k))
      )
      setStatusMessage('Zaktualizowano słowo kluczowe pomyślnie')
    } catch (err) {
      console.error('Error updating keyword:', err)
    } finally {
      setIsEditKeywordModalOpen(false)
      setEditingKeyword(null)
    }
  }

  // Delete keyword via API
  const handleDeleteKeyword = async (id: number) => {
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      console.error('Brak tokenu autoryzacji')
      return
    }
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      if (!res.ok) throw new Error('Failed to delete keyword')
      setKeywords(prev => prev.filter(k => k.id !== id))
      setStatusMessage('Usunięto słowo kluczowe pomyślnie')
    } catch (err) {
      console.error('Error deleting keyword:', err)
    } finally {
      setIsEditKeywordModalOpen(false)
      setEditingKeyword(null)
    }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      {/* Status popup */}
      {statusMessage && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded shadow">
          {statusMessage}
        </div>
      )}
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

          {categoriesLoading ? (
            <div className="py-8 text-center text-sm text-secondary">
              Ładowanie kategorii...
            </div>
          ) : filteredCategories.length === 0 ? (
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
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditCategory(c)} className="p-1 text-secondary hover:text-main">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingCategory(c); setIsEditModalOpen(true); }}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        
                      </button>
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
                    <th className="px-2 py-1.5">Akcje</th>
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
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditCategory(c)} className="p-1 text-secondary hover:text-main">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingCategory(c); setIsEditModalOpen(true); }}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            
                          </button>
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
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingKeyword(k); setIsEditKeywordModalOpen(true); }} className="p-1 text-secondary hover:text-main">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-red-500 hover:text-red-700">
                      </button>
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
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingKeyword(k); setIsEditKeywordModalOpen(true); }} className="p-1 text-secondary hover:text-main">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-500 hover:text-red-700">
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modale */}
      <CreateCategoryOrKeywordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Zamknij modal
        onSubmit={handleAddCategoryOrKeyword} // Obsługa dodawania
        categories={categories.filter(c => c.id != null).map(c => ({ id: c.id!, name: c.name }))} // Przekaż istniejące kategorie
      />
      {editingCategory && (
        <EditCategoryModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingCategory(null); }}
          category={{ id: editingCategory.id!, name: editingCategory.name, description: editingCategory.description }}
          onSubmit={handleUpdateCategory}
          onDelete={handleDeleteCategoryById}
        />
      )}
      {editingKeyword && (
        <EditKeywordModal
          isOpen={isEditKeywordModalOpen}
          onClose={() => { setIsEditKeywordModalOpen(false); setEditingKeyword(null); }}
          keyword={{ id: editingKeyword.id, value: editingKeyword.value }}
          onSubmit={handleUpdateKeyword}
          onDelete={handleDeleteKeyword}
        />
      )}
     </main>
   )
 }

 export default CategoriesPreview
