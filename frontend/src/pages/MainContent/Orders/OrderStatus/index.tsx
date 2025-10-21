import { type FC, useEffect, useMemo, useState } from 'react'
import { Eye, X, Search, AlertCircle, CheckCircle2, XCircle, Package, Users, FileText, Tag, Save, Loader } from 'lucide-react'
import { TransactionService, type TransactionForOrder } from '../../../../services/transactionService'
import { AuthService } from '../../../../services/authService'

type Transaction = TransactionForOrder & {
  item?: { id?: number | null; name: string } | null
  user?: { id?: number | null; username: string } | null
}

const OrderStatus: FC = () => {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [originalStatus, setOriginalStatus] = useState<Record<number, string>>({})
  const [changes, setChanges] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const fetchOrderTransactions = async () => {
      try {
        const data = await TransactionService.getOrderTransactions()
        // Pokazuj wszystkie statusy: PENDING, COMPLETED, CANCELLED
        // (bez filtracji - dostępne dla edycji)
        const mappedData: Transaction[] = data.map(t => ({
          ...t,
          item: t.itemId && t.itemName ? { id: t.itemId, name: t.itemName } : null,
          user: t.userId && t.userName ? { id: t.userId, username: t.userName } : null,
        }))
        setTransactions(mappedData)
        // Zachowaj oryginalne statusy
        const originalStatuses: Record<number, string> = {}
        mappedData.forEach(t => {
          if (t.id) {
            originalStatuses[t.id] = t.transactionStatus || ''
          }
        })
        setOriginalStatus(originalStatuses)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    }
    fetchOrderTransactions()
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return transactions
    return transactions.filter(t => (
      String(t.id).includes(qq) ||
      (t.item?.name ?? '').toLowerCase().includes(qq) ||
      (t.user?.username ?? '').toLowerCase().includes(qq) ||
      (t.transactionType ?? '').toLowerCase().includes(qq)
    ))
  }, [transactions, q])

  const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : '-'

  const handleStatusChange = (transactionId: number | null | undefined, newStatus: string) => {
    if (!transactionId) return
    
    // Jeśli nowy status = oryginalny status, usuń z changes
    if (newStatus === originalStatus[transactionId]) {
      setChanges(prev => {
        const updated = { ...prev }
        delete updated[transactionId]
        return updated
      })
    } else {
      // W innym przypadku, dodaj do changes
      setChanges(prev => ({ ...prev, [transactionId]: newStatus }))
    }
    
    // Aktualizuj status w lokalnym state
    setTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { ...t, transactionStatus: newStatus }
          : t
      )
    )
    // Aktualizuj selected, jeśli jest otwarty
    if (selected?.id === transactionId) {
      setSelected({ ...selected, transactionStatus: newStatus })
    }
  }

  const handleSaveChanges = async () => {
    if (Object.keys(changes).length === 0) {
      setNotification({ type: 'error', message: 'Brak zmian do zapisania' })
      return
    }

    setSaving(true)
    try {
      const token = AuthService.getToken()
      if (!token) {
        setNotification({ type: 'error', message: 'Brak autoryzacji' })
        setSaving(false)
        return
      }

      const savePromises = Object.entries(changes).map(([id, status]) =>
        fetch(`/api/transactions/${id}/status?status=${status}`, { 
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        })
      )
      const results = await Promise.all(savePromises)
      const allSuccess = results.every(r => r.ok)
      
      if (allSuccess) {
        setNotification({ type: 'success', message: 'Zmiany zapisane pomyślnie!' })
        setChanges({})
      } else {
        setNotification({ type: 'error', message: 'Błąd podczas zapisywania zmian' })
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      setNotification({ type: 'error', message: 'Błąd podczas zapisywania zmian' })
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadgeStyle = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-warning-bg', border: 'border-warning', text: 'text-warning-text', icon: AlertCircle }
      case 'COMPLETED':
        return { bg: 'bg-success-bg', border: 'border-success', text: 'text-success-text', icon: CheckCircle2 }
      case 'CANCELLED':
        return { bg: 'bg-error-bg', border: 'border-error', text: 'text-error-text', icon: XCircle }
      default:
        return { bg: 'bg-surface-secondary', border: 'border-main', text: 'text-secondary', icon: AlertCircle }
    }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-surface via-surface-secondary to-surface min-h-screen">
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-4xl font-bold text-main">Zarządzanie Zamówieniami</h2>
          <p className="text-secondary text-sm mt-2">Szybka edycja statusów zamówień w jednym miejscu</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
            <input 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Szukaj po ID, pozycji, użytkowniku..." 
              className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-main rounded-xl text-main placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-sm font-medium text-secondary bg-surface border border-main px-4 py-3 rounded-xl">
              {filtered.length} z {transactions.length} zamówień
            </div>
            {Object.keys(changes).length > 0 && (
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-4 py-3 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Zapisz ({Object.keys(changes).length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="bg-surface border border-main rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-6 py-4 border-b border-main">
          <h3 className="text-lg font-bold text-main">Lista zamówień</h3>
          <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            {transactions.length} {transactions.length === 1 ? 'zamówienie' : transactions.length < 5 ? 'zamówienia' : 'zamówień'}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
            <div className="text-secondary font-medium">Brak zamówień spełniających kryteria</div>
            <div className="text-xs text-muted mt-1">Spróbuj zmienić filtry wyszukiwania</div>
          </div>
        ) : (
          <div className="divide-y divide-main">
            {filtered.map((t, idx) => {
              const statusStyle = getStatusBadgeStyle(t.transactionStatus)
              return (
                <div 
                  key={t.id} 
                  className={`p-4 hover:bg-surface-secondary transition-all ${idx % 2 === 1 ? 'bg-surface/50' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-muted bg-surface px-2 py-1 rounded">#{t.id}</span>
                          <span className="text-xs text-secondary">{formatDate(t.transactionDate)}</span>
                        </div>
                        <h4 className="font-semibold text-main text-base">{t.item?.name ?? '—'}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-secondary">
                          <span className="inline-flex items-center gap-1"><Users className="w-4 h-4" /> {t.user?.username ?? '—'}</span>
                          <span className="inline-flex items-center gap-1"><Package className="w-4 h-4" /> {t.quantity} szt.</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <select 
                        value={t.transactionStatus || ''} 
                        onChange={e => handleStatusChange(t.id, e.target.value)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text} hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      >
                        <option value="PENDING">Przyjęte do realizacji</option>
                        <option value="COMPLETED">Wydane</option>
                        <option value="CANCELLED">Anulowane</option>
                      </select>
                      <button 
                        onClick={() => setSelected(t)} 
                        className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium text-sm transition-all inline-flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4"/>
                        Szczegóły
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-surface border-2 border-main rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b-2 border-main px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-main">Szczegóły Zamówienia</h3>
                  <div className="text-sm text-secondary mt-1">ID: <span className="font-mono font-semibold text-primary">#{selected.id}</span> • {formatDate(selected.transactionDate)}</div>
                </div>
                <button 
                  onClick={() => setSelected(null)} 
                  className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Pozycja
                  </div>
                  <div className="text-lg font-bold text-main">{selected.item?.name ?? '—'}</div>
                </div>

                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Ilość
                  </div>
                  <div className="text-lg font-bold text-primary">{selected.quantity} szt.</div>
                </div>

                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Użytkownik
                  </div>
                  <div className="text-lg font-bold text-main">{selected.user?.username ?? '—'}</div>
                </div>

                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Typ transakcji
                  </div>
                  <div className="text-lg font-bold text-main">{selected.transactionType}</div>
                </div>
              </div>

              {selected.description && (
                <div className="bg-surface-secondary rounded-lg p-4 border border-main">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Opis
                  </div>
                  <div className="text-main leading-relaxed whitespace-pre-wrap">{selected.description}</div>
                </div>
              )}
            </div>

            <div className="bg-surface-secondary border-t-2 border-main px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setSelected(null)} 
                className="px-6 py-2 rounded-lg border-2 border-main text-main hover:bg-main hover:text-white font-medium transition-all"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`rounded-xl shadow-lg p-4 flex items-center gap-3 border-2 ${
            notification.type === 'success' 
              ? 'bg-success-bg border-green-400 text-success-text' 
              : 'bg-error-bg border-red-400 text-error-text'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </main>
  )
}

export default OrderStatus

