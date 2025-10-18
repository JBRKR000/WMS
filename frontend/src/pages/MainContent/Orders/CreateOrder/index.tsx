import { type FC, useMemo, useState } from 'react'
import { PlusCircle, Trash2, Eye, Save, X, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { fetchApi } from '../../../../utils/api'
import { jwtDecode } from 'jwt-decode'
import { AuthService } from '../../../../services/authService'

type Item = { id: number; name: string; quantity?: number; currentQuantity?: number; unit?: string }

type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

type TransactionLine = { id: string; itemId?: number; quantity?: number | '' }

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: 'Oczekuje',
  COMPLETED: 'Wydane',
  CANCELLED: 'Anulowane',
}

const STATUS_ICONS: Record<TransactionStatus, FC<{ className: string }>> = {
  PENDING: Clock,
  COMPLETED: CheckCircle,
  CANCELLED: AlertCircle,
}

const STATUS_COLORS: Record<TransactionStatus, string> = {
  PENDING: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  COMPLETED: 'bg-emerald-100 border-emerald-300 text-emerald-700',
  CANCELLED: 'bg-red-100 border-red-300 text-red-700',
}

const CreateOrder: FC = () => {
  const [loadingItems, setLoadingItems] = useState(false)
  const [itemSearches, setItemSearches] = useState<Record<string, string>>({})
  const [itemSearchResults, setItemSearchResults] = useState<Record<string, Item[]>>({})
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<TransactionLine[]>([])
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Status zawsze PENDING
  const status: TransactionStatus = 'PENDING'

  const handleItemSearch = async (query: string, lineId: string) => {
    setItemSearches(prev => ({ ...prev, [lineId]: query }))
    if (query.length < 2) {
      setItemSearchResults(prev => ({ ...prev, [lineId]: [] }))
      return
    }
    setLoadingItems(true)
    try {
      type SearchResponse = {
        content: Item[]
        totalElements: number
        totalPages: number
      }
      const data = await fetchApi<SearchResponse>(
        `/items/search/byname?name=${encodeURIComponent(query)}&page=0&size=10`
      )
      setItemSearchResults(prev => ({ ...prev, [lineId]: data?.content || [] }))
    } catch (err) {
      console.error('Błąd wyszukiwania itemów:', err)
      setItemSearchResults(prev => ({ ...prev, [lineId]: [] }))
    } finally {
      setLoadingItems(false)
    }
  }

  const handleSelectItem = (item: Item, lineId: string) => {
    updateLine(lineId, { itemId: item.id })
    setItemSearches(prev => ({ ...prev, [lineId]: item.name }))
    setOpenDropdowns(prev => ({ ...prev, [lineId]: false }))
    setErrors(prev => ({ ...prev, [`line-search-${lineId}`]: '' }))
  }

  const addLine = () => setLines(l => [...l, { id: String(Date.now()), itemId: undefined, quantity: 1 }])
  const removeLine = (id: string) => setLines(l => l.filter(x => x.id !== id))
  const updateLine = (id: string, patch: Partial<TransactionLine>) => setLines(l => l.map(x => x.id === id ? { ...x, ...patch } : x))

  const getCurrentUserId = () => {
    try {
      const token = AuthService.getToken()
      if (!token) return null
      type JwtPayload = { userId: number }
      const decoded = jwtDecode<JwtPayload>(token)
      return decoded.userId
    } catch (err) {
      console.error('Błąd przy dekodowaniu tokenu:', err)
      return null
    }
  }

  const validate = () => {
    const e: Record<string,string> = {}
    if (lines.length === 0) e.lines = 'Dodaj przynajmniej jedną pozycję'
    lines.forEach((ln, idx) => {
      if (!ln.itemId) e[`line-${idx}`] = 'Wybierz pozycję'
      if (!ln.quantity || Number(ln.quantity) <= 0) e[`line-qty-${idx}`] = 'Podaj poprawną ilość'
      
      // Sprawdź maksymalną dostępną ilość
      const lineSearchResults = itemSearchResults[ln.id] ?? []
      const selectedItem = lineSearchResults.find((i: any) => i.id === ln.itemId)
      if (selectedItem && ln.quantity) {
        const maxAvailable = selectedItem.currentQuantity ?? selectedItem.quantity ?? 0
        if (Number(ln.quantity) > maxAvailable) {
          e[`line-qty-${idx}`] = `Maksymalnie dostępne: ${maxAvailable} ${selectedItem.unit ?? ''}`
        }
      }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const subtotal = useMemo(() => lines.reduce((s, ln) => s + (Number(ln.quantity) || 0), 0), [lines])

  const onCreate = () => {
    if (!validate()) return
    setPreviewOpen(true)
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Tworzenie zamówienia</h1>
          <p className="text-sm text-secondary mt-1">Dodaj pozycje i utwórz nowe transakcje typu ZAMÓWIENIE.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCreate} disabled={loadingItems || isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"><Save className="w-5 h-5"/>Podgląd</button>
        </div>
      </div>

      {errors.items && (
        <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {errors.items}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="lg:col-span-2 bg-surface-secondary border border-main rounded-lg p-6 space-y-6" onSubmit={e => { e.preventDefault(); onCreate() }}>
          
          {/* Description / Notes */}
          <div>
            <label className="block text-sm font-semibold text-main mb-2">Notatki do zamówienia</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={4} 
              placeholder="Dodaj dodatkowe informacje o zamówieniu..."
              className="w-full px-4 py-3 rounded-lg border border-main bg-white text-main text-sm focus:outline-none focus:ring-2 focus:ring-main focus:ring-opacity-50" 
            />
          </div>

          {/* Order Lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-main">Pozycje zamówienia</h3>
              <button 
                type="button" 
                onClick={addLine} 
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-main bg-white text-sm font-medium hover:bg-main hover:bg-opacity-5 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <PlusCircle className="w-4 h-4"/>Dodaj pozycję
              </button>
            </div>

            {errors.lines && <div className="text-sm text-red-500 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{errors.lines}</div>}

            {lines.length === 0 ? (
              <div className="p-8 text-center text-secondary border border-dashed border-main rounded-lg">
                <p>Brak pozycji w zamówieniu</p>
                <p className="text-xs mt-1">Kliknij &quot;Dodaj pozycję&quot; aby zacząć</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((ln, idx) => {
                  return (
                    <div key={ln.id} className="flex items-start gap-3 p-4 rounded-lg bg-white border border-main group hover:border-main hover:border-opacity-50 transition">
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="Wpisz nazwę pozycji..."
                            onChange={e => handleItemSearch(e.target.value, ln.id)}
                            onFocus={() => setOpenDropdowns(prev => ({ ...prev, [ln.id]: true }))}
                            className={`w-full px-3 py-2 rounded-lg border-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:ring-opacity-50 transition ${
                              errors[`line-${idx}`]
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : ln.itemId
                                ? 'border-main bg-white text-main'
                                : 'border-main bg-white text-main'
                            }`}
                            value={itemSearches[ln.id] ?? ''}
                          />
                          
                          {/* Dropdown z wynikami */}
                          {(openDropdowns[ln.id] ?? false) && (itemSearches[ln.id] ?? '').length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-main rounded-lg shadow-lg z-10">
                              {loadingItems ? (
                                <div className="px-4 py-3 text-sm text-secondary">Szukam...</div>
                              ) : (itemSearchResults[ln.id] ?? []).length > 0 ? (
                                <div className="max-h-64 overflow-y-auto">
                                  {(itemSearchResults[ln.id] ?? []).map((item: any) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => handleSelectItem(item, ln.id)}
                                      className="w-full text-left px-4 py-3 hover:bg-main hover:bg-opacity-5 border-b border-main/20 last:border-0 transition"
                                    >
                                      <div className="font-medium text-main">{item.name}</div>
                                      <div className="text-xs text-secondary mt-1">
                                        Dostępnie: {item.currentQuantity ?? item.quantity ?? 0} {item.unit ?? ''}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="px-4 py-3 text-sm text-secondary">Brak wyników</div>
                              )}
                            </div>
                          )}
                        </div>
                        {errors[`line-${idx}`] && <div className="text-xs text-red-500">{errors[`line-${idx}`]}</div>}
                      </div>
                      <div className="w-32 space-y-2">
                        {(() => {
                          const lineSearchResults = itemSearchResults[ln.id] ?? []
                          const selectedItem = lineSearchResults.find((i: any) => i.id === ln.itemId)
                          const maxAvailable = selectedItem ? (selectedItem.currentQuantity ?? selectedItem.quantity ?? 0) : 0
                          return (
                            <>
                              <input 
                                type="number" 
                                value={ln.quantity ?? ''} 
                                onChange={e => updateLine(ln.id, { quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                                placeholder="Ilość"
                                min="1"
                                max={maxAvailable || undefined}
                                className="w-full px-3 py-2 rounded-lg border border-main text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:ring-opacity-50" 
                              />
                              {selectedItem && (
                                <div className="text-xs text-secondary">
                                  Dostępnie: <span className="font-semibold">{maxAvailable} {selectedItem.unit ?? ''}</span>
                                </div>
                              )}
                            </>
                          )
                        })()}
                        {errors[`line-qty-${idx}`] && <div className="text-xs text-red-500">{errors[`line-qty-${idx}`]}</div>}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeLine(ln.id)}
                        className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </form>

        {/* Summary Sidebar */}
        <aside className="bg-surface-secondary border border-main rounded-lg p-6 h-fit sticky top-20">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-main mb-4">Podsumowanie</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-main border-opacity-20">
                <span className="text-secondary">Numer ID:</span>
                <span className="font-semibold text-main">TRX-{String(Date.now()).slice(-6)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-secondary">Typ:</span>
                <span className="font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">ZAMÓWIENIE</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-secondary">Status:</span>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${STATUS_COLORS[status]}`}>
                  {(() => {
                    const Icon = STATUS_ICONS[status]
                    return (
                      <>
                        <Icon className="w-3 h-3" />
                        {STATUS_LABELS[status]}
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-main border-opacity-20">
                <span className="text-secondary">Pozycje:</span>
                <span className="font-semibold text-main text-lg">{lines.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-secondary">Razem ilość:</span>
                <span className="font-semibold text-main text-lg">{subtotal}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setPreviewOpen(true)} 
              disabled={loadingItems || lines.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-main text-main font-medium hover:bg-main hover:bg-opacity-5 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Eye className="w-4 h-4"/>Podgląd
            </button>
            <button 
              onClick={onCreate}
              disabled={loadingItems || isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Save className="w-4 h-4"/>{isSubmitting ? 'Przetwarzanie...' : 'Utwórz zamówienie'}
            </button>
          </div>
        </aside>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-main rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-main p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-main">Podgląd zamówienia</h2>
              <button onClick={() => setPreviewOpen(false)} className="p-1 rounded-lg hover:bg-main hover:bg-opacity-10 transition">
                <X className="w-5 h-5 text-secondary"/>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary mb-1">Numer ID</p>
                  <p className="text-lg font-semibold text-main">TRX-{String(Date.now()).slice(-6)}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Typ transakcji</p>
                  <p className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">ZAMÓWIENIE</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Status</p>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
                    {(() => {
                      const Icon = STATUS_ICONS[status]
                      return (
                        <>
                          <Icon className="w-3 h-3" />
                          {STATUS_LABELS[status]}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Description */}
              {description && (
                <div className="p-4 rounded-lg bg-main bg-opacity-5 border border-main border-opacity-20">
                  <p className="text-xs text-secondary mb-1">Notatki</p>
                  <p className="text-sm text-main whitespace-pre-wrap">{description}</p>
                </div>
              )}

              {/* Lines */}
              <div>
                <h3 className="text-sm font-semibold text-main mb-3">Pozycje ({lines.length})</h3>
                {lines.length === 0 ? (
                  <div className="p-4 text-center text-secondary border border-dashed border-main rounded-lg">Brak pozycji</div>
                ) : (
                  <div className="space-y-2">
                    {lines.map((ln, idx) => {
                      const lineSearchResults = itemSearchResults[ln.id] ?? []
                      const item = lineSearchResults.find((i: any) => i.id === ln.itemId)
                      return (
                        <div key={ln.id} className="flex items-center justify-between p-3 rounded-lg bg-main bg-opacity-5 border border-main border-opacity-20">
                          <div>
                            <p className="font-medium text-main">{item?.name ?? '—'}</p>
                            <p className="text-xs text-secondary">Pozycja #{idx + 1}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-main">{ln.quantity} szt.</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-main border-opacity-20">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-main">Razem:</span>
                  <span className="font-bold text-emerald-600">{subtotal} szt.</span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-main p-6 flex justify-end gap-3">
              <button 
                onClick={() => setPreviewOpen(false)} 
                className="px-4 py-2 rounded-lg border border-main text-main font-medium hover:bg-main hover:bg-opacity-5 transition"
              >
                Anuluj
              </button>
              <button 
                onClick={() => { 
                  setIsSubmitting(true)
                  
                  const userId = getCurrentUserId()
                  if (!userId) {
                    alert('✗ Błąd: Nie można pobrać danych użytkownika')
                    setIsSubmitting(false)
                    return
                  }
                  
                  // Create transaction for each line item
                  const transactionPromises = lines.map(ln => {
                    const payload = {
                      item: { id: ln.itemId },
                      user: { id: userId },
                      transactionType: 'ORDER',
                      transactionStatus: 'PENDING',
                      quantity: Number(ln.quantity),
                      description: description || undefined,
                    }
                    return fetchApi('/transactions', {
                      method: 'POST',
                      body: JSON.stringify(payload)
                    })
                  })

                  Promise.all(transactionPromises)
                    .then(() => {
                      setIsSubmitting(false)
                      setPreviewOpen(false)
                      setLines([])
                      setDescription('')
                      alert('✓ Zamówienie zostało utworzone pomyślnie!')
                    })
                    .catch((err: any) => {
                      console.error('Błąd przy tworzeniu zamówienia:', err)
                      setIsSubmitting(false)
                      alert('✗ Błąd przy tworzeniu zamówienia')
                    })
                }} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Przetwarzanie...' : 'Utwórz zamówienie'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default CreateOrder
