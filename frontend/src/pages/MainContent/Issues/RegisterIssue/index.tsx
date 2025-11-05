import { type FC, useState, useEffect } from 'react'
import { Truck, Save, Package, Factory, Info, CheckCircle2, X } from 'lucide-react'
import { fetchApi } from '../../../../utils/api'
import { AuthService } from '../../../../services/authService'
import { jwtDecode } from 'jwt-decode'

// We'll build the UI using Transaction/Item/User model fields only
type Item = { id?: number | null; name: string; currentQuantity?: number; unit?: string }
type UserType = { id?: number | null; username: string; employeeId?: string }
type TransactionType = 'RECEIPT' | 'ISSUE_TO_PRODUCTION' | 'RETURN'

const RegisterIssue: FC = () => {
  // UI-only state
  const [itemId, setItemId] = useState<string>('')
  const [itemSearch, setItemSearch] = useState<string>('')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [txType, setTxType] = useState<TransactionType>('ISSUE_TO_PRODUCTION')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<any | null>(null)
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [itemSearchResults, setItemSearchResults] = useState<Item[]>([])
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false)
  const [isSearchingItems, setIsSearchingItems] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Current user from token
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // Fetch current user from token on component mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const token = AuthService.getToken()
        if (!token) {
          setIsLoadingUser(false)
          return
        }

        type JwtPayload = { userId: number }
        const decoded = jwtDecode<JwtPayload>(token)
        const userId = decoded.userId

        // Fetch user data from API
        type UserResponse = { id: number; username: string }
        const userData = await fetchApi<UserResponse>(`/users/${userId}`)
        
        if (userData) {
          // Fetch employee ID separately - endpoint zwraca plain text
          try {
            const response = await fetch(`/api/users/${userId}/employee-id`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            const employeeId = await response.text()
            
            setCurrentUser({
              id: userData.id,
              username: userData.username,
              employeeId: employeeId || undefined
            })
          } catch (err) {
            console.error('Błąd pobierania employee ID:', err)
            setCurrentUser({
              id: userData.id,
              username: userData.username,
              employeeId: undefined
            })
          }
        }
      } catch (err) {
        console.error('Błąd pobierania danych użytkownika:', err)
      } finally {
        setIsLoadingUser(false)
      }
    }

    loadCurrentUser()
  }, [])

  // Get selected item from search results
  const getSelectedItem = () => {
    if (!itemId) return null
    return itemSearchResults.find(item => String(item.id) === itemId)
  }

  const handleItemSearch = async (query: string) => {
    setItemSearch(query)
    if (query.length < 2) {
      setItemSearchResults([])
      return
    }
    setIsSearchingItems(true)
    try {
      type SearchResponse = {
        content: Item[]
        totalElements: number
        totalPages: number
      }
      const data = await fetchApi<SearchResponse>(
        `/items/search/byname?name=${encodeURIComponent(query)}&page=0&size=10`
      )
      setItemSearchResults(data?.content || [])
    } catch (err) {
      console.error('Błąd wyszukiwania itemów:', err)
      setItemSearchResults([])
    } finally {
      setIsSearchingItems(false)
    }
  }

  const handleSelectItem = (item: Item) => {
    setItemId(String(item.id))
    setItemSearch(item.name)
    setIsItemDropdownOpen(false)
    setErrors(prev => ({ ...prev, item: '' }))
  }

  const handleClearItemSearch = () => {
    setItemId('')
    setItemSearch('')
    setItemSearchResults([])
    setIsItemDropdownOpen(false)
  }

  const validate = () => {
    const e: Record<string,string> = {}
    if (!itemId) e.item = 'Wybierz pozycję'
    if (quantity === '' || Number(quantity) <= 0) e.quantity = 'Podaj poprawną ilość'
    
    const selectedItem = getSelectedItem()
    // Sprawdzaj limit tylko przy wydaniu, nie przy przyjęciu
    if (txType !== 'RECEIPT' && itemId && selectedItem && quantity !== '') {
      const maxAvailable = selectedItem.currentQuantity ?? 0
      if (Number(quantity) > maxAvailable) {
        e.quantity = `Maksymalnie dostępne: ${maxAvailable} ${selectedItem.unit ?? ''}`
      }
    }
    
    if (!currentUser) e.user = 'Nie udało się pobrać danych użytkownika'
    return e
  }

  const onSubmit = async () => {
    const e = validate(); setErrors(e)
    if (Object.keys(e).length > 0) return
    
    const it = getSelectedItem()
    if (!it?.id) return
    if (!currentUser?.id) return
    
    setIsSubmitting(true)
    try {
      const payload = {
        item: { id: it.id },
        user: { id: currentUser.id },
        transactionType: txType,
        quantity: Number(quantity),
        description
      }
      
      type TransactionResponse = {
        id: number
        transactionDate: string
        transactionType: TransactionType
      }
      
      const response = await fetchApi<TransactionResponse>('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      
      // Show preview with response data
      const tx = {
        id: response?.id,
        transactionDate: new Date().toISOString(),
        transactionType: txType,
        item: it,
        quantity: Number(quantity),
        user: currentUser,
        description
      }
      setPreview(tx)
      
      // Reset form
      setItemId('')
      setItemSearch('')
      setQuantity('')
      setDescription('')
      
    } catch (err) {
      console.error('Błąd wysyłania transakcji:', err)
      setErrors(prev => ({ ...prev, submit: 'Błąd wysyłania operacji. Spróbuj ponownie.' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTransactionTypeLabel = (type: TransactionType): string => {
    switch(type) {
      case 'RECEIPT': return 'Przyjęcie do magazynu'
      case 'ISSUE_TO_PRODUCTION': return 'Wydanie na produkcję'
      default: return type
    }
  }

  const getTransactionTypeColor = (type: TransactionType): string => {
    switch(type) {
      case 'RECEIPT': return 'bg-success-bg text-success-text border-success'
      case 'ISSUE_TO_PRODUCTION': return 'bg-primary/10 text-primary border-primary'
      default: return 'bg-surface-secondary text-main border-main'
    }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-main mb-2">Operacja magazynowa</h1>
        <p className="text-sm text-secondary">Zarejestruj wydanie lub przyjęcie produktów/komponentów</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Główny formularz */}
        <form className="lg:col-span-2 space-y-6" onSubmit={e => { e.preventDefault(); onSubmit() }}>
          {/* 1. Typ operacji - duże przyciski */}
          <div className="bg-surface border border-main rounded-xl p-6">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">1. Typ operacji</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'RECEIPT' as TransactionType, label: 'Przyjęcie', icon: Package, color: 'success' },
                { value: 'ISSUE_TO_PRODUCTION' as TransactionType, label: 'Na produkcję', icon: Factory, color: 'primary' },
              ].map(op => {
                const IconComponent = op.icon
                return (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setTxType(op.value)}
                  className={`relative p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    txType === op.value
                      ? `border-${op.color === 'success' ? 'success' : op.color === 'error' ? 'error' : 'primary'} bg-${op.color === 'success' ? 'success' : op.color === 'error' ? 'error' : 'primary'}/10 ring-2 ring-${op.color === 'success' ? 'success' : op.color === 'error' ? 'error' : 'primary'}/30`
                      : 'border-main bg-surface hover:bg-surface-hover'
                  }`}
                >
                  <div className={`${txType === op.value ? `text-${op.color === 'success' ? 'success' : op.color === 'error' ? 'error' : 'primary'}` : 'text-main'}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div className={`font-bold text-center ${txType === op.value ? `text-${op.color === 'success' ? 'success' : op.color === 'error' ? 'error' : 'primary'}` : 'text-main'}`}>
                    {op.label}
                  </div>
                </button>
              )})}
            </div>
            <div className="mt-3 text-xs text-secondary italic flex items-center gap-2">
              <Info className="w-4 h-4" /> Wybrałeś: <span className="font-semibold text-main">{getTransactionTypeLabel(txType)}</span>
            </div>
          </div>

          {/* 2. Wybór pozycji */}
          <div className="bg-surface border border-main rounded-xl p-6">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">2. Wybierz pozycję</h2>
            <div className="space-y-2">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={itemSearch} 
                    onChange={e => handleItemSearch(e.target.value)}
                    onFocus={() => setIsItemDropdownOpen(true)}
                    placeholder="Wpisz nazwę produktu/komponentu..."
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition ${
                      errors.item 
                        ? 'border-error bg-error-bg text-error-text' 
                        : itemId 
                        ? 'border-primary bg-primary/5 text-main'
                        : 'border-main bg-surface text-main'
                    }`}
                  />
                  {itemId && (
                    <button
                      type="button"
                      onClick={handleClearItemSearch}
                      className="p-2 rounded-lg hover:bg-surface-secondary transition text-secondary hover:text-main"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Dropdown z wynikami */}
                {isItemDropdownOpen && itemSearch.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-main rounded-lg shadow-lg z-10">
                    {isSearchingItems ? (
                      <div className="px-4 py-3 text-sm text-secondary">Szukam...</div>
                    ) : itemSearchResults.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        {itemSearchResults.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectItem(item)}
                            className="w-full text-left px-4 py-3 hover:bg-surface-secondary border-b border-main/20 last:border-0 transition"
                          >
                            <div className="font-medium text-main">{item.name}</div>
                            <div className="text-xs text-secondary mt-1">
                              Dostępnie: {item.currentQuantity ?? 0} {item.unit ?? ''}
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
              {errors.item && <div className="text-xs text-error-text font-medium">{errors.item}</div>}
              
              {/* Podgląd wybranego itemu */}
              {itemId && getSelectedItem() && (
                <div className="mt-3 p-4 bg-primary/5 border border-primary/30 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-secondary uppercase tracking-wide">Wybrana pozycja</div>
                      <div className="text-lg font-bold text-main mt-1">{getSelectedItem()?.name}</div>
                      <div className="text-sm text-secondary mt-2 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Dostępnie: <span className="font-bold text-primary">{getSelectedItem()?.currentQuantity ?? 0} {getSelectedItem()?.unit ?? ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Ilość i Użytkownik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface border border-main rounded-xl p-6">
            <div>
              <div className="flex items-end justify-between mb-2">
                <h2 className="text-sm font-bold text-secondary uppercase tracking-wide">3. Ilość</h2>
                {itemId && getSelectedItem() && txType !== 'RECEIPT' && (
                  <span className="text-xs text-secondary">
                    Dostępnie: <span className="font-bold text-primary">{getSelectedItem()?.currentQuantity ?? 0} {getSelectedItem()?.unit ?? ''}</span>
                  </span>
                )}
              </div>
              <input 
                type="number" 
                value={quantity as any} 
                onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                placeholder={itemId && getSelectedItem() && txType !== 'RECEIPT' ? `Max: ${getSelectedItem()?.currentQuantity ?? 0}` : "0"}
                className={`w-full px-4 py-3 rounded-lg border-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition ${
                  errors.quantity 
                    ? 'border-error bg-error-bg text-error-text' 
                    : quantity !== ''
                    ? 'border-primary bg-primary/5 text-main'
                    : 'border-main bg-surface text-main'
                }`}
              />
              {errors.quantity && <div className="text-xs text-error-text font-medium mt-1">{errors.quantity}</div>}
            </div>

            <div>
              <h2 className="text-sm font-bold text-secondary uppercase tracking-wide mb-2">4. Pracownik</h2>
              {isLoadingUser ? (
                <div className="w-full px-4 py-3 rounded-lg border-2 border-main bg-surface-secondary text-secondary text-lg font-bold">
                  Ładuję...
                </div>
              ) : currentUser ? (
                <div className="w-full px-4 py-3 rounded-lg border-2 border-primary bg-primary/5">
                  <div className="text-lg font-bold text-main">{currentUser.username}</div>
                  <div className="text-sm text-secondary mt-1">ID Pracownika: <span className="font-semibold">{currentUser.employeeId || '-'}</span></div>
                </div>
              ) : (
                <div className="w-full px-4 py-3 rounded-lg border-2 border-error bg-error-bg text-error-text text-lg font-bold">
                  Błąd: Nie udało się załadować użytkownika
                </div>
              )}
              {errors.user && <div className="text-xs text-error-text font-medium mt-1">{errors.user}</div>}
            </div>
          </div>

          {/* 5. Notatka (opcjonalnie) */}
          <div className="bg-surface border border-main rounded-xl p-6">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">5. Notatka (opcjonalnie)</h2>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3} 
              placeholder="Dodaj komentarz do operacji (np. powód wydania, uwagi)..."
              className="w-full px-4 py-3 rounded-lg border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
            />
          </div>

          {/* Przycisk submit */}
          <button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 btn-submit"
          >
            <Save className="w-6 h-6"/>
            {isSubmitting ? 'Wysyłam...' : 'Zarejestruj operację'}
          </button>
          
          {errors.submit && <div className="text-sm text-error-text font-medium p-3 bg-error-bg rounded-lg">{errors.submit}</div>}
        </form>

        {/* Podgląd po prawej */}
        <aside className="bg-surface border border-main rounded-xl p-6 h-fit sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-main">Podsumowanie</h3>
            {preview && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success-bg text-success-text font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Gotowe
              </div>
            )}
          </div>

          {preview ? (
            <div className="space-y-4">
              {/* Typ operacji */}
              <div className={`p-3 rounded-lg border ${getTransactionTypeColor(preview.transactionType)}`}>
                <div className="text-xs text-secondary uppercase tracking-wide">Typ operacji</div>
                <div className="text-lg font-bold mt-1">{getTransactionTypeLabel(preview.transactionType)}</div>
              </div>

              {/* Dane szczegółowe */}
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-surface-secondary rounded-lg border border-main/20">
                  <div className="text-xs text-secondary uppercase tracking-wide">Pozycja</div>
                  <div className="text-main font-bold mt-1">{preview.item?.name ?? '-'}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-surface-secondary rounded-lg border border-main/20">
                    <div className="text-xs text-secondary uppercase tracking-wide">Ilość</div>
                    <div className="text-2xl font-bold text-primary mt-1">{preview.quantity}</div>
                  </div>

                  <div className="p-3 bg-surface-secondary rounded-lg border border-main/20">
                    <div className="text-xs text-secondary uppercase tracking-wide">Pracownik</div>
                    <div className="text-main font-semibold mt-1">
                      <span>{preview.user?.username ?? '-'}</span>
                      <div className="text-xs text-secondary mt-1">ID Pracownika: <span className="font-semibold">{preview.user?.employeeId || '-'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-surface-secondary rounded-lg border border-main/20">
                  <div className="text-xs text-secondary uppercase tracking-wide">Data</div>
                  <div className="text-sm text-main mt-1">{new Date(preview.transactionDate).toLocaleString()}</div>
                </div>

                {preview.description && (
                  <div className="p-3 bg-surface-secondary rounded-lg border border-main/20">
                    <div className="text-xs text-secondary uppercase tracking-wide">Notatka</div>
                    <div className="text-sm text-secondary mt-1 italic">"{preview.description}"</div>
                  </div>
                )}
              </div>

              {/* Reset button */}
              <button
                onClick={() => {
                  setPreview(null)
                  setItemId('')
                  setQuantity('')
                  setDescription('')
                }}
                className="w-full px-3 py-2 rounded-lg border border-main text-main bg-surface hover:bg-surface-hover transition text-sm font-medium mt-4"
              >
                ← Nowa operacja
              </button>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 border border-primary flex items-center justify-center">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <div className="text-sm text-secondary">
                <div className="font-semibold text-main mb-1">Wypełnij formularz →</div>
                <div className="text-xs">Tutaj zobaczysz podsumowanie Twojej operacji</div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default RegisterIssue
