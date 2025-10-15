import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { X, Edit3 } from 'lucide-react'

// Type for fetched keywords
type KeywordDTO = { id: number; value: string }

export interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: number
    name: string
    description?: string | null
    categoryName?: string | null
    unit?: string | null
    currentQuantity?: number
    qrCode?: string | null
    keywords?: string[]
    itemType?: string | null
  }
  onSubmit: () => void
}

const EditItemModal: FC<EditItemModalProps> = ({ isOpen, onClose, item, onSubmit }) => {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description ?? '')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [unit, setUnit] = useState(item.unit ?? '')
  const [currentQuantity, setCurrentQuantity] = useState(item.currentQuantity ?? 0)
  const [qrCode, setQrCode] = useState(item.qrCode ?? '')
  const [itemType, setItemType] = useState(item.itemType ?? 'PRODUCT')
  const [availableKeywords, setAvailableKeywords] = useState<KeywordDTO[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<KeywordDTO[]>([])
  const [keywordSearch, setKeywordSearch] = useState<string>('')
  const [confirmSave, setConfirmSave] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName(item.name)
      setDescription(item.description ?? '')
      setUnit(item.unit ?? '')
      setCurrentQuantity(item.currentQuantity ?? 0)
      setQrCode(item.qrCode ?? '')
      setItemType(item.itemType ?? 'PRODUCT')
      setKeywordSearch('')
      setConfirmSave(false)
      setError(null)
      ;(async () => {
        try {
          const authToken = localStorage.getItem('authToken')
          const resCat = await fetch('/api/categories', { headers: { Authorization: `Bearer ${authToken}` } })
          if (!resCat.ok) throw new Error('Failed to load categories')
          const dataCat = await resCat.json()
          setCategories(dataCat)
          
          // Find category ID by name
          const foundCategory = dataCat.find((c: any) => c.name === item.categoryName)
          setCategoryId(foundCategory?.id ?? null)

          const resItemKw = await fetch(`/api/keywords/byItemId/${item.id}`, { headers: { Authorization: `Bearer ${authToken}` } })
          if (!resItemKw.ok) throw new Error('Failed to load item keywords')
          const itemKwDTO: KeywordDTO[] = await resItemKw.json()
          setSelectedKeywords(itemKwDTO)
          
          const resAllKw = await fetch('/api/keywords', { headers: { Authorization: `Bearer ${authToken}` } })
          if (!resAllKw.ok) throw new Error('Failed to load all keywords')
          const allKwDTO: KeywordDTO[] = await resAllKw.json()
          setAvailableKeywords(allKwDTO)
        } catch (err) {
          console.error('Error loading categories or keywords:', err)
          setError('Błąd podczas ładowania danych')
        }
      })()
    }
  }, [isOpen, item])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const authToken = localStorage.getItem('authToken')
      
      const requestBody = {
        name,
        description: description || null,
        category: categoryId ? { id: categoryId } : null,
        unit,
        currentQuantity,
        keywords: selectedKeywords.map(k => ({ value: k.value }))
      }

      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Błąd podczas aktualizacji pozycji')
      }

      onSubmit()
      onClose()
    } catch (err) {
      console.error('Error updating item:', err)
      setError(err instanceof Error ? err.message : 'Nieznany błąd')
    } finally {
      setLoading(false)
      setConfirmSave(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-main">Edytuj pozycję</h3>
          <button onClick={onClose} className="text-secondary hover:text-main" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-secondary mb-1">Nazwa</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">Opis</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">Kategoria</label>
            <select
              value={categoryId ?? ''}
              onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main"
              disabled={loading}
            >
              <option value="">Wybierz kategorię</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">Jednostka</label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main"
              disabled={loading}
            >
              <option value="">Wybierz jednostkę</option>
              <option value="PCS">sztuki</option>
              <option value="KG">kilogramy</option>
              <option value="LITER">litry</option>
              <option value="METER">metry</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">Ilość</label>
            <input
              type="number"
              value={currentQuantity}
              onChange={e => setCurrentQuantity(Number(e.target.value))}
              className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">QR Code</label>
            <input
              type="text"
              value={qrCode}
              disabled
              className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">Słowa kluczowe</label>
            <div className="flex flex-wrap gap-2 items-center">
              {selectedKeywords.map(k => (
                <div key={k.id} className="flex items-center bg-emerald-200 text-main px-3 py-1 rounded-full text-sm">
                  {k.value}
                  <button 
                    type="button"
                    onClick={() => setSelectedKeywords(prev => prev.filter(x => x.id !== k.id))} 
                    className="ml-1 text-secondary hover:text-red-500"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="relative">
                <input
                  type="text"
                  value={keywordSearch}
                  onChange={e => setKeywordSearch(e.target.value)}
                  placeholder="Wyszukaj słowo kluczowe"
                  className="px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  disabled={loading}
                />
                {keywordSearch && (
                  <ul className="absolute z-10 bg-white border border-main rounded mt-1 max-h-40 overflow-auto w-full shadow-lg">
                    {availableKeywords.filter(k => k.value.toLowerCase().includes(keywordSearch.toLowerCase()) && !selectedKeywords.some(s => s.id === k.id)).map(k => (
                      <li 
                        key={k.id} 
                        onClick={() => { 
                          setSelectedKeywords(prev => [...prev, k]); 
                          setKeywordSearch('') 
                        }} 
                        className="px-3 py-1 hover:bg-surface-secondary cursor-pointer text-sm"
                      >
                        {k.value}
                      </li>
                    ))}
                    {!availableKeywords.some(k => k.value.toLowerCase().includes(keywordSearch.toLowerCase()) && !selectedKeywords.some(s => s.id === k.id)) && (
                      <li className="px-3 py-1 text-sm text-secondary">Brak wyników</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-secondary border border-main rounded-lg text-sm text-secondary mr-4"
            disabled={loading}
          >
            Anuluj
          </button>
          <button
            onClick={() => confirmSave ? handleSubmit() : setConfirmSave(true)}
            disabled={loading}
            className={`rounded-lg text-sm text-white transition-all duration-300 ease-in-out transform hover:scale-105 overflow-hidden ${
              confirmSave 
                ? 'w-40 px-4 py-2 bg-emerald-700 hover:bg-emerald-800' 
                : 'w-10 px-2 py-2 bg-primary hover:bg-primary-hover'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="relative flex items-center justify-center h-full">
              <span className={`transition-opacity duration-200 ${confirmSave ? 'opacity-0' : 'opacity-100'}`}>
                <Edit3 className="w-4 h-4" />
              </span>
              <span className={`absolute transition-opacity duration-200 ${confirmSave ? 'opacity-100' : 'opacity-0'}`}>
                {loading ? 'Zapisywanie...' : 'Zapisz'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditItemModal
