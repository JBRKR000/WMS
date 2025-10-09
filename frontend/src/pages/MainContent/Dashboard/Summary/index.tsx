import { useEffect, useState, type FC } from 'react'

// Types mirroring backend models
type Category = {
  id: number | null
  name: string
  description?: string | null
}

type Role = {
  id: number | null
  roleName: string
}

type User = {
  id: number | null
  username: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role?: Role | null
}

type Item = {
  id: number | null
  name: string
  description?: string | null
  categoryName?: string | null
  unit?: string | null
  currentQuantity: number
  qrCode?: string | null
  createdAt?: string | null // ISO
  updatedAt?: string | null // ISO
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
  <div className="text-sm text-secondary py-6 text-center">{label}</div>
)

const SummaryPage: FC = () => {
  const [counts, setCounts] = useState({
    categories: 0,
    items: 0,
    users: 0,
    transactions: 0,
  })
  const [loading, setLoading] = useState(true)

  const [items, setItems] = useState<Item[]>([])
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

        const response = await fetch(`/api/items/getAllPaginated?page=${pageItems}&size=${sizeItems}`, requestOptions)
        if (!response.ok) {
          throw new Error('Błąd podczas pobierania itemów')
        }

        const data = await response.json()
        setItems(data.content) // Ustaw dane itemów
        setTotalPagesItems(data.totalPages) // Ustaw liczbę stron
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

        const response = await fetch(`/api/transactions/paginated?page=${pageTransactions}&size=${sizeTransactions}`, requestOptions)
        if (!response.ok) {
          throw new Error('Błąd podczas pobierania transakcji')
        }

        const data = await response.json()
        setTransactions(data.content) // Ustaw dane transakcji
        setTotalPagesTransactions(data.totalPages) // Ustaw liczbę stron
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setTransactionsLoading(false)
      }
    }

    fetchTransactions()
  }, [pageTransactions, sizeTransactions]) // Fetch transactions when page or size changes

  const handleNextPage = (type: 'items' | 'transactions') => {
    if (type === 'items' && pageItems < totalPagesItems - 1) {
      setPageItems(prevPage => prevPage + 1)
    } else if (type === 'transactions' && pageTransactions < totalPagesTransactions - 1) {
      setPageTransactions(prevPage => prevPage + 1)
    }
  }

  const handlePreviousPage = (type: 'items' | 'transactions') => {
    if (type === 'items' && pageItems > 0) {
      setPageItems(prevPage => prevPage - 1)
    } else if (type === 'transactions' && pageTransactions > 0) {
      setPageTransactions(prevPage => prevPage - 1)
    }
  }

  const handleSizeChange = (type: 'items' | 'transactions', event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10)
    if (newSize > 0) {
      if (type === 'items') {
        setSizeItems(newSize)
        setPageItems(0) // Resetuj stronę do 0 po zmianie rozmiaru
      } else if (type === 'transactions') {
        setSizeTransactions(newSize)
        setPageTransactions(0) // Resetuj stronę do 0 po zmianie rozmiaru
      }
    }
  }

  const countKeys = ['categories', 'items', 'users', 'transactions'] as const;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 bg-surface text-main">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold">Podsumowanie magazynu</h2>
          <p className="text-sm text-secondary mt-1">Widok odzwierciedlający struktury bazy danych</p>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {countKeys.map((key) => (
          <div key={key} className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
            <p className="text-sm text-secondary capitalize">Liczba {key}</p>
            <p className="text-2xl font-bold mt-1">{loading ? '...' : counts[key]}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[{ title: 'Items', data: items, loading: itemsLoading, page: pageItems, totalPages: totalPagesItems, size: sizeItems, setSize: setSizeItems, setPage: setPageItems },
          { title: 'Transactions', data: transactions, loading: transactionsLoading, page: pageTransactions, totalPages: totalPagesTransactions, size: sizeTransactions, setSize: setSizeTransactions, setPage: setPageTransactions }].map((section, index) => (
          <section key={index} className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <div className="flex items-center gap-2">
                <label htmlFor={`pageSize${section.title}`} className="text-sm text-secondary">
                  Wyników na stronę:
                </label>
                <input
                  id={`pageSize${section.title}`}
                  type="number"
                  value={section.size}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value, 10);
                    if (newSize > 0) {
                      section.setSize(newSize);
                      section.setPage(0);
                    }
                  }}
                  className="border border-main rounded px-2 py-1 text-sm bg-surface text-main"
                  min="1"
                />
              </div>
            </div>            

            {section.loading ? (
              <EmptyState label="Ładowanie danych..." />
            ) : section.data.length === 0 ? (
              <EmptyState label={`Brak ${section.title.toLowerCase()} w bazie`} />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-secondary">
                      {Object.keys(section.data[0] || {}).map((key, idx) => (
                        <th key={idx} className="px-3 py-2 capitalize">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.data.map((item, idx) => (
                      <tr key={idx} className="border-t border-main">
                        {Object.values(item).map((value, idy) => (
                          <td key={idy} className="px-3 py-2 text-secondary">{value || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => section.setPage(section.page - 1)}
                disabled={section.page === 0}
                className={`px-4 py-2 rounded transition-colors ${section.page === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover'}`}
              >
                Poprzednia
              </button>
              <p className="text-sm text-secondary">
                Strona {section.page + 1} z {section.totalPages}
              </p>
              <button
                onClick={() => section.setPage(section.page + 1)}
                disabled={section.page === section.totalPages - 1}
                className={`px-4 py-2 rounded transition-colors ${section.page === section.totalPages - 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover'}`}
              >
                Następna
              </button>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default SummaryPage;