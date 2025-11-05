import { type FC, useEffect, useState } from 'react';
import { Search, FileText } from 'lucide-react';

// Minimal types matching backend Transaction model
type Category = { id?: number | null; name: string }
type Item = { id?: number | null; name: string; category?: Category | null }
type Role = { id?: number | null; roleName: string }
type User = { id?: number | null; username: string; email?: string; role?: Role | null }
type Transaction = {
  id?: number | null
  transactionDate?: string | null
  transactionType: string
  item?: Item | null
  quantity: number
  user?: User | null
  description?: string | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak operacji' }) => (
  <div className="py-8 text-center text-sm text-secondary">
    <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <FileText className="w-7 h-7 text-secondary" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Brak rekordów do wyświetlenia</div>
  </div>
)

const LastOperations: FC = () => {
  const [query, setQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.error('Brak tokenu autoryzacji');
          return;
        }

        const requestOptions = {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        };

        const response = await fetch(`/api/transactions/paginated?page=${currentPage}&size=${pageSize}`, requestOptions);
        if (!response.ok) {
          throw new Error('Błąd podczas pobierania transakcji');
        }

        const data = await response.json();

        // ZAMIANA: normalizujemy odpowiedź tak, żeby zawsze mieć item.user.category jako obiekty
        const normalized = (data.content ?? []).map((tx: any) => {
          const itemObj = tx.item ?? (tx.itemName ? { name: tx.itemName, category: tx.categoryName ? { name: tx.categoryName } : undefined } : undefined);
          const userObj = tx.user ?? (tx.userName ? { username: tx.userName } : undefined);

          return {
            id: tx.id ?? tx.transaction_id,
            transactionDate: tx.transactionDate ?? tx.transaction_date,
            transactionType: tx.transactionType ?? tx.transaction_type,
            item: itemObj,
            quantity: tx.quantity ?? tx.qty,
            user: userObj,
            description: tx.description ?? tx.desc,
          } as Transaction;
        });

        setTransactions(normalized);
        setTotalElements(data.totalElements ?? 0);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, pageSize]);

  const filtered = transactions.filter(t => {
    const q = query.toLowerCase();
    return (
      String(t.id).includes(q) ||
      (t.item?.name ?? '').toLowerCase().includes(q) ||
      (t.user?.username ?? '').toLowerCase().includes(q) ||
      (t.transactionType ?? '').toLowerCase().includes(q)
    );
  });

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const typeBadge = (type: string) => {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold';
    switch (type) {
      case 'RECEIPT':
        return <span className={`${base} bg-success-bg text-success-text border border-main`}>Przyjęcie</span>;
      case 'ISSUE_TO_PRODUCTION':
      case 'ISSUE_TO_SALES':
        return <span className={`${base} bg-surface-hover text-main border border-main`}>Wydanie</span>;
      case 'RETURN':
        return <span className={`${base} bg-surface-hover text-main border border-main`}>Zwrot</span>;
      case 'ORDER':
        return <span className={`${base} bg-surface-hover text-main border border-main`}>Zamówienie</span>;
      default:
        return <span className={`${base} bg-surface-hover text-secondary border border-main`}>{type}</span>;
    }
  };

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-main">Ostatnie operacje</h2>
          <p className="text-sm text-secondary mt-1">Lista transakcji (receipt / issue / return) z bazy danych</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-surface border border-main rounded-2xl px-2 py-1 w-full sm:w-64">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj po ID, item, user, typ"
              className="w-full px-4 py-2 bg-surface rounded-2xl text-main placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm"
            />
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-secondary">Ilość rekordów: {transactions.length}</div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-secondary">Rozmiar strony:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(0);
              }}
              className="px-3 py-1 bg-surface border border-main rounded text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {loading ? (
          <EmptyState label="Ładowanie danych..." />
        ) : filtered.length === 0 ? (
          <EmptyState label="Brak ostatnich operacji w bazie" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary bg-surface-secondary">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Typ</th>
                  <th className="px-3 py-2">Pozycja</th>
                  <th className="px-3 py-2">Kategoria</th>
                  <th className="px-3 py-2">Ilość</th>
                  <th className="px-3 py-2">Użytkownik</th>
                  <th className="px-3 py-2">Opis</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => (
                  <tr
                    key={t.id ?? idx}
                    className="border-t border-main hover:bg-surface-hover odd:bg-surface even:bg-surface-secondary"
                  >
                    <td className="px-3 py-2 text-secondary align-top">{t.id ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary align-top">{formatDate(t.transactionDate)}</td>
                    <td className="px-3 py-2 align-top">{typeBadge(t.transactionType)}</td>
                    <td className="px-3 py-2 text-main align-top">{t.item?.name ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary align-top">{t.item?.category?.name?? '-'}</td>
                    <td className="px-3 py-2 text-main align-top">{t.quantity}</td>
                    <td className="px-3 py-2 text-secondary align-top">{t.user?.username ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary align-top">{t.description ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-main">
            <div className="text-sm text-secondary">
              Strona {currentPage + 1} · Razem: {totalElements} rekordów
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 bg-surface border border-main rounded text-main text-sm hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Poprzednia
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={(currentPage + 1) * pageSize >= totalElements}
                className="px-3 py-1 bg-surface border border-main rounded text-main text-sm hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Następna →
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default LastOperations;
