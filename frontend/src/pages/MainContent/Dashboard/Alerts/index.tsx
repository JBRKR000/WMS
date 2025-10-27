import { type FC, useMemo, useState, useEffect } from 'react'
import { Search, FileText, AlertTriangle, Box, TrendingDown, Package, AlertCircle, Eye } from 'lucide-react'
import { fetchApi } from '../../../../utils/api'

// Use backend Transaction model fields only
type Item = {
  id?: number | null
  name: string
  description?: string | null
  categoryName?: string | null
  unit?: string | null
  currentQuantity?: number
  threshold?: number
  itemType?: string
}
type Transaction = {
  id?: number | null
  transactionDate?: string | null
  transactionType: string
  itemName: string
  quantity: number
  userName: string
  description?: string | null
  categoryName?: string | null
}

// Alert entry derived from existing models (no separate alerts table)
type AlertEntry = {
  id?: number | null
  source: 'transaction' | 'item'
  message: string
  createdAt?: string | null
  transaction?: Transaction | null
  item?: Item | null
}

const Alerts: FC = () => {
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'transaction' | 'item'>('all')
  const [items, setItems] = useState<Item[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch items and transactions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch low stock items from new endpoint
        type LowStockResponse = {
          content: Item[]
          totalElements: number
          totalPages: number
        }
        const lowStockData = await fetchApi<LowStockResponse>('/items/lowstock?page=0&size=1000')
        setItems(lowStockData?.content || [])

        // Fetch all transactions
        type TransactionsResponse = {
          content: Transaction[]
          totalElements: number
          totalPages: number
        }
        const txData = await fetchApi<TransactionsResponse>('/transactions/paginated?page=0&size=1000')
        setTransactions(txData?.content || [])
      } catch (err) {
        console.error('Błąd pobierania danych:', err)
        setItems([])
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Generate alerts from items with low quantity
  const alerts: AlertEntry[] = useMemo(() => {
    const lowStockAlerts: AlertEntry[] = items.map((item) => ({
      id: item.id,
      source: 'item',
      message: `⚠️ Niski stan magazynowy: ${item.name} - Dostępne: ${item.currentQuantity ?? 0} ${item.unit ?? 'szt.'} (próg: ${item.threshold ?? '-'})`,
      createdAt: new Date().toISOString(),
      item
    }))

    // Transaction alerts (for reference)
    const txAlerts: AlertEntry[] = transactions.slice(0, 5).map((tx, idx) => ({
      id: (999000 + idx),
      source: 'transaction',
      message: `Transakcja: ${tx.transactionType} - ${tx.itemName}`,
      createdAt: tx.transactionDate,
      transaction: tx
    }))

    return [...lowStockAlerts, ...txAlerts]
  }, [items, transactions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return alerts.filter(a => {
      if (sourceFilter !== 'all' && a.source !== sourceFilter) return false
      if (!q) return true
      return (
        String(a.id).includes(q) ||
        a.message.toLowerCase().includes(q) ||
        (a.item?.name ?? '').toLowerCase().includes(q) ||
        (a.transaction?.transactionType ?? '').toLowerCase().includes(q)
      )
    })
  }, [alerts, query, sourceFilter])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-surface-secondary min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-error-bg rounded-lg">
          <AlertTriangle className="w-6 h-6 text-error" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-main">Alerty Systemowe</h1>
          <p className="text-sm text-secondary mt-1">Monitorowanie niskiego stanu magazynowego i aktywności</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Low Stock */}
        <div className="bg-error-bg border-l-4 border-error rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-error-text font-semibold">Niski Stan</p>
              <p className="text-2xl font-bold text-error mt-1">{alerts.filter(a => a.source === 'item').length}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-error opacity-20" />
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-primary-bg border-l-4 border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary font-semibold">Transakcje</p>
              <p className="text-2xl font-bold text-primary mt-1">{alerts.filter(a => a.source === 'transaction').length}</p>
            </div>
            <Box className="w-8 h-8 text-primary opacity-20" />
          </div>
        </div>

        {/* Total Alerts */}
        <div className="bg-warning-bg border-l-4 border-warning rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning-text font-semibold">Razem Alertów</p>
              <p className="text-2xl font-bold text-warning mt-1">{alerts.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning opacity-20" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex items-center bg-surface border border-main rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-secondary mr-3" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj alertów..."
            className="flex-1 bg-surface text-main placeholder-secondary focus:outline-none text-sm"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value as any)}
          className="px-4 py-2 bg-surface border border-main rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">Wszystkie źródła</option>
          <option value="item">Niski Stan Magazynowy</option>
          <option value="transaction">Transakcje</option>
        </select>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-secondary text-sm">Ładowanie alertów...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-main rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-secondary mx-auto mb-4 opacity-30" />
          <p className="text-secondary font-medium">Brak alertów do wyświetlenia</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li
              key={a.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                a.source === 'item' && (a.item?.currentQuantity ?? 0) <= 10
                  ? 'bg-error-bg border-error text-error-text'
                  : 'bg-surface border-main text-main hover:bg-surface-hover'
              }`}
            >
              {/* Icon */}
              <div className="mt-1 flex-shrink-0">
                {a.source === 'item' ? (
                  <Package className="w-5 h-5 text-error" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{a.message}</p>

                {a.source === 'item' && a.item && (
                  <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="opacity-70">Pozycja:</span> {a.item.name}
                    </div>
                    <div>
                      <span className="opacity-70">Ilość:</span> {a.item.currentQuantity} {a.item.unit}
                    </div>
                    <div>
                      <span className="opacity-70">Kategoria:</span> {a.item.categoryName ?? '-'}
                    </div>
                    <div>
                      <span className="opacity-70">Próg minimalny:</span> {a.item.threshold ?? '-'}
                    </div>
                    <div>
                      <span className="opacity-70">Opis:</span> {a.item.description ?? '-'}
                    </div>
                  </div>
                )}

                {a.source === 'transaction' && a.transaction && (
                  <div className="mt-2 grid grid-cols-2 gap-3 text-xs opacity-70">
                    <div>
                      <span className="opacity-70">Typ:</span> {a.transaction.transactionType}
                    </div>
                    <div>
                      <span className="opacity-70">Ilość:</span> {a.transaction.quantity}
                    </div>
                    <div>
                      <span className="opacity-70">Item:</span> {a.transaction.itemName}
                    </div>
                    <div>
                      <span className="opacity-70">Użytkownik:</span> {a.transaction.userName}
                    </div>
                  </div>
                )}

                <div className="text-xs opacity-60 mt-2">{formatDate(a.createdAt)}</div>
              </div>

              {/* Action Button */}
              <button
                className={`flex-shrink-0 mt-1 px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  a.source === 'item' && (a.item?.currentQuantity ?? 0) <= 10
                    ? 'bg-error text-white hover:bg-red-700'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default Alerts
