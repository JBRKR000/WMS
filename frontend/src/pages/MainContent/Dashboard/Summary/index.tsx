import { useEffect, useState, type FC } from 'react'
import QRCode from 'react-qr-code'

// Types mirroring backend models

type Item = {
  id: number | null
  name: string
  description?: string | null
  categoryName?: string | null
  unit?: string | null
  currentQuantity: number
  qrCode?: string | null
  itemType?: string | null
  createdAt?: string | null // ISO
  updatedAt?: string | null // ISO
  keywords?: string[] | null
}

type Transaction = {
  id: number | null
  transactionDate?: string | null // ISO with timezone
  transactionType: string // enum stored as string
  itemName?: string | null
  quantity: number
  userName?: string | null
  description?: string | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak danych' }) => (
  <div className="py-12 text-center text-sm text-main">
    <p className="text-lg">{label}</p>
  </div>
)

const StatCard: FC<{ label: string; value: string | number; icon?: string }> = ({ label, value, icon }) => {
  const labelMap: Record<string, string> = {
    categories: 'Kategorie',
    items: 'Produkty',
    users: 'Użytkownicy',
    transactions: 'Transakcje',
  }
  
  return (
    <div className="bg-surface rounded-lg p-6 border border-main">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-main font-medium uppercase tracking-wide">{labelMap[label] || label}</p>
          <p className="text-3xl font-bold text-main mt-2">{value}</p>
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  )
}

const DataTable: FC<{ 
  title: string
  data: Item[] | Transaction[]
  loading: boolean
  page: number
  totalPages: number
  size: number
  onSizeChange: (size: number) => void
  onPageChange: (page: number) => void
  onQRClick?: (qr: string) => void
  visibleColumns?: string[]
}> = ({ title, data, loading, page, totalPages, size, onSizeChange, onPageChange, onQRClick, visibleColumns }) => {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const columnLabels: Record<string, string> = {
    id: 'ID',
    name: 'Nazwa',
    description: 'Opis',
    categoryName: 'Kategoria',
    unit: 'Jednostka',
    currentQuantity: 'Ilość',
    qrCode: 'Kod QR',
    itemType: 'Typ',
    createdAt: 'Utworzono',
    updatedAt: 'Zaktualizowano',
    keywords: 'Słowa kluczowe',
    transactionDate: 'Data transakcji',
    transactionType: 'Typ transakcji',
    itemName: 'Nazwa produktu',
    quantity: 'Ilość',
    userName: 'Użytkownik',
  }

  // Generate safe ID from title
  const safeId = title.replace(/[^a-zA-Z0-9]/g, '')
  // Remove emojis from title for display
  const cleanTitle = title.replace(/[^\w\s]/g, '').trim()

  // Determine which columns to show based on table type
  const columnsToShow = visibleColumns || Object.keys(data[0] || {})

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    
    const aVal = (a as any)[sortKey]
    const bVal = (b as any)[sortKey]
    
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    let comparison = 0
    if (typeof aVal === 'string') {
      comparison = aVal.localeCompare(String(bVal))
    } else if (typeof aVal === 'number') {
      comparison = Number(aVal) - Number(bVal)
    } else {
      comparison = String(aVal).localeCompare(String(bVal))
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleColumnClick = (column: string) => {
    if (sortKey === column) {
      // Toggle sort order if clicking same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new sort column
      setSortKey(column)
      setSortOrder('asc')
    }
  }

  // Map English values to Polish
  const valueMap: Record<string, Record<string, string>> = {
    transactionType: {
      'INBOUND': 'Przyjęcie',
      'OUTBOUND': 'Wydanie',
      'ADJUSTMENT': 'Korekta',
      'RETURN': 'Zwrot',
    },
    itemType: {
      'COMPONENT': 'Komponent',
      'PRODUCT': 'Produkt',
      'RAW_MATERIAL': 'Surowiec',
    },
  }

  const formatValue = (key: string, value: string | number | boolean | null): string => {
    if (value === null || value === undefined || value === '') return '-'
    
    const stringValue = String(value).toUpperCase()
    if (valueMap[key] && valueMap[key][stringValue]) {
      return valueMap[key][stringValue]
    }
    return String(value)
  }

  return (
    <section className="bg-surface-secondary border border-main rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-main">
        <h3 className="text-lg font-semibold text-main">{cleanTitle}</h3>
        <div className="flex items-center gap-3">
          <label htmlFor={`pageSize-${safeId}`} className="text-sm text-main whitespace-nowrap">
            Wyników na stronę:
          </label>
          <input
            id={`pageSize-${safeId}`}
            type="number"
            value={size}
            onChange={(e) => {
              const newSize = parseInt(e.target.value, 10)
              console.log('Changing page size from', size, 'to', newSize)
              if (newSize > 0) {
                onSizeChange(newSize)
                onPageChange(0)
              }
            }}
            className="border border-main rounded px-3 py-1.5 text-sm bg-surface text-main w-16 focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
            min="1"
            max="100"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <EmptyState label="⏳ Ładowanie danych..." />
      ) : data.length === 0 ? (
        <EmptyState label="Brak danych" />
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-main border-b-2 border-main bg-surface">
                  {columnsToShow.map((key) => (
                    <th 
                      key={key} 
                      onClick={() => handleColumnClick(key)}
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-surface-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {columnLabels[key] || key}
                        {sortKey === key && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, idx) => (
                  <tr key={idx} className="border-b border-main hover:bg-surface transition-colors duration-150">
                    {columnsToShow.map((key) => {
                      const value = (item as any)[key]
                      
                      // Render QR code
                      if (key === 'qrCode' && value) {
                        return (
                          <td key={`${idx}-${key}`} className="px-4 py-3">
                            <div
                              onClick={() => onQRClick?.(String(value))}
                              className="cursor-pointer inline-block hover:opacity-75 transition-opacity"
                              role="button"
                              tabIndex={0}
                            >
                              <QRCode value={String(value)} size={32} level="L" />
                            </div>
                          </td>
                        )
                      }

                      // Format value
                      let display = '-'
                      if (value !== null && value !== undefined && value !== '') {
                        if (Array.isArray(value)) {
                          display = value.length > 0 ? value.join(', ') : '-'
                        } else if (typeof value === 'object') {
                          try {
                            display = JSON.stringify(value)
                          } catch {
                            display = String(value)
                          }
                        } else if (typeof value === 'number') {
                          display = value.toString()
                        } else {
                          display = formatValue(key, String(value))
                        }
                      }

                      return (
                        <td
                          key={`${idx}-${key}`}
                          className="px-4 py-3 text-main max-w-xs truncate"
                          title={display}
                        >
                          {display}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-main">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className={`px-4 py-2 rounded font-medium transition-all border border-main ${
                  page === 0
                    ? 'bg-surface-secondary text-gray-400 border border-main cursor-not-allowed'
                    : 'bg-surface border border-main rounded text-main text-sm hover:bg-surface-hover transition pagination-btn-text'
                }`}
            >
              ← Poprzednia
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-main">Strona</span>
              <span className="font-bold text-main">{page + 1}</span>
              <span className="text-main">z</span>
              <span className="font-bold text-main">{totalPages || 1}</span>
            </div>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages - 1}
              className={`px-4 py-2 rounded font-medium transition-all border border-main ${
                  page === totalPages - 1
                    ? 'bg-surface-secondary text-main opacity-40 border border-main cursor-not-allowed'
                    : 'bg-primary pagination-btn-text hover:bg-primary-hover active:scale-95'
                }`}
            >
              Następna →
            </button>
          </div>
        </>
      )}
    </section>
  )
}

const SummaryPage: FC = () => {
  const [counts, setCounts] = useState({
    categories: 0,
    items: 0,
    users: 0,
    transactions: 0,
  })
  const [loading, setLoading] = useState(true)

  const [items, setItems] = useState<Item[]>([])
  const [modalQr, setModalQr] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pageItems, setPageItems] = useState(0) // Current page for items
  const [pageTransactions, setPageTransactions] = useState(0) // Current page for transactions
  const [sizeItems, setSizeItems] = useState(5) // Page size for items
  const [sizeTransactions, setSizeTransactions] = useState(5) // Page size for transactions
  const [totalPagesItems, setTotalPagesItems] = useState(0) // Total pages for items
  const [totalPagesTransactions, setTotalPagesTransactions] = useState(0) // Total pages for transactions
  const [itemsLoading, setItemsLoading] = useState(false)
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          console.error('Brak tokenu autoryzacji')
          return
        }
        const requestOptions = {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }

        // Wysyłanie równoległych zapytań
        const [categoriesRes, itemsRes, usersRes, transactionsRes] = await Promise.all([
          fetch('/api/categories/getCategoryCount', requestOptions),
          fetch('/api/items/getItemCount', requestOptions),
          fetch('/api/users/getUserCount', requestOptions),
          fetch('/api/transactions/getTransactionCount', requestOptions),
        ])

        // Parsowanie odpowiedzi
        const [categories, items, users, transactions] = await Promise.all([
          categoriesRes.text(),
          itemsRes.text(),
          usersRes.text(),
          transactionsRes.text(),
        ])

        setCounts({
          categories: parseInt(categories, 10),
          items: parseInt(items, 10),
          users: parseInt(users, 10),
          transactions: parseInt(transactions, 10),
        })
      } catch (error) {
        console.error('Error fetching counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItemsLoading(true)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          console.error('Brak tokenu autoryzacji')
          return
        }

        const requestOptions = {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }

        console.log(`Fetching items with page=${pageItems}, size=${sizeItems}`)
        const response = await fetch(`/api/items/getAllPaginated?page=${pageItems}&size=${sizeItems}`, requestOptions)
        if (!response.ok) {
          throw new Error('Błąd podczas pobierania itemów')
        }

        const data = await response.json()
        console.log('Fetched items:', data.content.length, 'items, totalPages:', data.totalPages)
        setItems(data.content)
        setTotalPagesItems(data.totalPages)
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setItemsLoading(false)
      }
    }

    fetchItems()
  }, [pageItems, sizeItems]) // Fetch items when page or size changes

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setTransactionsLoading(true)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          console.error('Brak tokenu autoryzacji')
          return
        }

        const requestOptions = {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }

        console.log(`Fetching transactions with page=${pageTransactions}, size=${sizeTransactions}`)
        const response = await fetch(`/api/transactions/paginated?page=${pageTransactions}&size=${sizeTransactions}`, requestOptions)
        if (!response.ok) {
          throw new Error('Błąd podczas pobierania transakcji')
        }

        const data = await response.json()
        console.log('Fetched transactions:', data.content.length, 'items, totalPages:', data.totalPages)
        setTransactions(data.content)
        setTotalPagesTransactions(data.totalPages)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setTransactionsLoading(false)
      }
    }

    fetchTransactions()
  }, [pageTransactions, sizeTransactions]) // Fetch transactions when page or size changes


  const countKeys = ['categories', 'items', 'users', 'transactions'] as const;
  const icons = { categories: '📁', items: '📦', users: '👥', transactions: '💱' };

  return (
    <div className="w-full space-y-8">
      {/* QR code modal overlay */}
      {modalQr && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalQr(null)}>
          <div className="bg-surface p-6 rounded-lg border border-main shadow-lg" onClick={e => e.stopPropagation()}>
            <QRCode value={modalQr} size={256} />
            <p className="text-center text-secondary text-sm mt-3">Kliknij aby zamknąć</p>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold text-main">Podsumowanie magazynu</h1>
        <p className="text-base text-main">Szybki przegląd kluczowych metryk systemu WMS</p>
      </div>

      {/* Stats grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {countKeys.map((key) => (
          <StatCard
            key={key}
            label={key}
            value={loading ? '...' : counts[key]}
            icon={icons[key as keyof typeof icons]}
          />
        ))}
      </section>

      {/* Tables side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="Ostatnie produkty"
          data={items}
          loading={itemsLoading}
          page={pageItems}
          totalPages={totalPagesItems}
          size={sizeItems}
          onSizeChange={setSizeItems}
          onPageChange={setPageItems}
          onQRClick={setModalQr}
          visibleColumns={['name', 'description', 'qrCode']}
        />
        <DataTable
          title="Ostatnie transakcje"
          data={transactions}
          loading={transactionsLoading}
          page={pageTransactions}
          totalPages={totalPagesTransactions}
          size={sizeTransactions}
          onSizeChange={setSizeTransactions}
          onPageChange={setPageTransactions}
          onQRClick={setModalQr}
          visibleColumns={['transactionDate', 'itemName', 'quantity', 'userName']}
        />
      </div>
    </div>
  );
};

export default SummaryPage;