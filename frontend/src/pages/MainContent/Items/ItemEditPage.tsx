import { type FC, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchApi } from '../../../utils/api'
import { AuthService } from '../../../services/authService'
import { jwtDecode } from 'jwt-decode'

type Item = {
  id: number
  name: string
  description?: string | null
  categoryName?: string | null
  unit?: string
  currentQuantity: number
  qrCode?: string | null
  itemType?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  keywords?: Set<string> | string[] | null
}

type UserType = {
  id: number
  username: string
}

const ItemEditPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newQuantity, setNewQuantity] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [description, setDescription] = useState('')

  // Fetch current user from token
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

        type UserResponse = { id: number; username: string }
        const userData = await fetchApi<UserResponse>(`/users/${userId}`)
        setCurrentUser(userData)
      } catch (err) {
        console.error('Error fetching user data:', err)
      } finally {
        setIsLoadingUser(false)
      }
    }

    loadCurrentUser()
  }, [])

  useEffect(() => {
    console.log('ItemEditPage mounted with id:', id)
    fetchItem()
  }, [id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching item:', id)
      const response = await fetchApi<Item>(`/items/${id}`)
      console.log('Received response:', response)
      setItem(response)
      setNewQuantity(response.currentQuantity)
    } catch (err) {
      console.error('Error fetching item:', err)
      setError('Nie udało się pobrać danych produktu')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async () => {
    if (!item) return

    try {
      setSubmitting(true)
      setError(null)
      const difference = newQuantity - item.currentQuantity

      if (difference === 0) {
        setError('Ilość nie uległa zmianie')
        setSubmitting(false)
        return
      }

      await fetchApi<void>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          item: {
            id: item.id,
          },
          user: {
            id: currentUser?.id,
          },
          transactionType: difference > 0 ? 'RECEIPT' : 'ISSUE_TO_PRODUCTION',
          quantity: Math.abs(difference),
          description: description || `Zmiana ilości QR - ${difference > 0 ? '+' : ''}${difference} szt.`,
        }),
      })

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        navigate('/main/summary')
      }, 2000)
    } catch (err) {
      setError('Nie udało się zaktualizować ilości')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const valueMap: Record<string, Record<string, string>> = {
    itemType: {
      'COMPONENT': 'Komponent',
      'PRODUCT': 'Produkt',
      'RAW_MATERIAL': 'Surowiec',
    },
  }

  const formatItemType = (type?: string | null): string => {
    if (!type) return '-'
    return valueMap.itemType?.[type] || type
  }

  if (loading || isLoadingUser) {
    console.log('ItemEditPage: rendering loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-lg text-secondary">⏳ Ładowanie danych...</div>
      </div>
    )
  }

  if (error && !item) {
    console.log('ItemEditPage: rendering error state:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-center">
          <div className="text-lg text-error font-bold mb-4">{error}</div>
          <button
            onClick={() => navigate('/main/summary')}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg"
          >
            Powrót do podsumowania
          </button>
        </div>
      </div>
    )
  }

  if (!item) {
    console.log('ItemEditPage: rendering not found state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-lg text-error">❌ Produkt nie znaleziony</div>
      </div>
    )
  }

  console.log('ItemEditPage: rendering main content with item:', item)
  return (
    <div className="min-h-screen bg-[var(--color-surface)] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with User Info */}
        <div className="border-b border-main pb-6">
          <h1 className="text-3xl font-bold text-main mb-2">Edycja Produktu - Zmiana Ilości</h1>
          <p className="text-secondary">Produkt: <span className="font-semibold text-main">{item.name}</span></p>
          {currentUser && (
            <p className="text-secondary text-sm mt-2">Modyfikuje: <span className="font-semibold text-main">{currentUser.username}</span></p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-success-bg border-2 border-success rounded-lg p-4 text-success-text font-bold">
            ✅ Ilość została pomyślnie zaktualizowana!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-error-bg border-2 border-error rounded-lg p-4 text-error-text font-bold">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Details */}
          <div className="bg-surface-secondary border border-main rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-main mb-4">Informacje o produkcie</h2>

            <div className="space-y-4">
              {/* ID */}
              <div className="flex justify-between items-center py-3 border-b border-main">
                <span className="text-secondary font-medium">ID:</span>
                <span className="text-main font-semibold">{item.id}</span>
              </div>

              {/* Nazwa */}
              <div className="flex justify-between items-center py-3 border-b border-main">
                <span className="text-secondary font-medium">Nazwa:</span>
                <span className="text-main font-semibold">{item.name}</span>
              </div>

              {/* Opis */}
              <div className="flex justify-between items-start py-3 border-b border-main gap-4">
                <span className="text-secondary font-medium">Opis:</span>
                <span className="text-main text-right max-w-xs">{item.description || '-'}</span>
              </div>

              {/* Kategoria */}
              <div className="flex justify-between items-center py-3 border-b border-main">
                <span className="text-secondary font-medium">Kategoria:</span>
                <span className="text-main font-semibold">{item.categoryName || '-'}</span>
              </div>

              {/* Jednostka */}
              <div className="flex justify-between items-center py-3 border-b border-main">
                <span className="text-secondary font-medium">Jednostka:</span>
                <span className="text-main font-semibold">{item.unit || '-'}</span>
              </div>

              {/* Typ produktu */}
              <div className="flex justify-between items-center py-3 border-b border-main">
                <span className="text-secondary font-medium">Typ produktu:</span>
                <span className="text-main font-semibold">{formatItemType(item.itemType)}</span>
              </div>

              {/* Aktualna ilość */}
              <div className="flex justify-between items-center py-3 border-b border-main">
                <span className="text-secondary font-medium">Aktualna ilość:</span>
                <span className="text-main font-bold text-lg">{item.currentQuantity} szt.</span>
              </div>

              {/* Słowa kluczowe */}
              {item.keywords && (Array.isArray(item.keywords) ? item.keywords.length > 0 : item.keywords.size > 0) && (
                <div className="flex justify-between items-start py-3 border-b border-main gap-4">
                  <span className="text-secondary font-medium">Słowa kluczowe:</span>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {Array.from(Array.isArray(item.keywords) ? item.keywords : item.keywords).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-medium border border-primary"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quantity Modifier */}
          <div className="bg-surface-secondary border border-main rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-main mb-4">Zmiana ilości</h2>

            <div className="space-y-4">
              {/* Current Quantity Display */}
              <div className="bg-surface rounded-lg p-4 border border-main">
                <p className="text-secondary text-sm mb-2">Obecna ilość:</p>
                <p className="text-3xl font-bold text-main">{item.currentQuantity} szt.</p>
              </div>

              {/* New Quantity Input */}
              <div>
                <label className="block text-secondary font-medium mb-2">Nowa ilość:</label>
                <input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-main rounded-lg bg-surface text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Difference Display */}
              <div className={`rounded-lg p-4 border-2 ${
                newQuantity > item.currentQuantity
                  ? 'bg-success-bg border-success'
                  : newQuantity < item.currentQuantity
                  ? 'bg-error-bg border-error'
                  : 'bg-surface border-main'
              }`}>
                <p className="text-secondary text-sm mb-1">Zmiana:</p>
                <p className={`text-2xl font-bold ${
                  newQuantity > item.currentQuantity
                    ? 'text-success'
                    : newQuantity < item.currentQuantity
                    ? 'text-error'
                    : 'text-secondary'
                }`}>
                  {newQuantity > item.currentQuantity ? '+' : ''}
                  {newQuantity - item.currentQuantity} szt.
                </p>
              </div>

              {/* Quick Adjustment Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setNewQuantity(Math.max(0, newQuantity - 10))}
                  className="bg-surface hover:bg-error/20 text-main border border-main rounded-lg font-medium transition py-2"
                >
                  -10
                </button>
                <button
                  onClick={() => setNewQuantity(Math.max(0, newQuantity - 1))}
                  className="bg-surface hover:bg-error/20 text-main border border-main rounded-lg font-medium transition py-2"
                >
                  -1
                </button>
                <button
                  onClick={() => setNewQuantity(newQuantity + 1)}
                  className="bg-surface hover:bg-success/20 text-main border border-main rounded-lg font-medium transition py-2"
                >
                  +1
                </button>
                <button
                  onClick={() => setNewQuantity(newQuantity + 10)}
                  className="bg-surface hover:bg-success/20 text-main border border-main rounded-lg font-medium transition py-2"
                >
                  +10
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-secondary font-medium mb-2">Notatka (opcjonalnie):</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dodaj opis zmian (np. 'Dopasowanie stanu faktycznego')"
                  className="w-full px-4 py-2 border border-main rounded-lg bg-surface text-main focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none h-24"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleQuantityChange}
                disabled={submitting || newQuantity === item.currentQuantity}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {submitting ? '⏳ Zapisywanie...' : '✓ Zatwierdź zmianę ilości'}
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => navigate('/main/summary')}
                className="w-full bg-surface hover:bg-surface-hover text-main font-bold py-3 rounded-lg transition border border-main"
              >
                ✕ Anuluj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemEditPage