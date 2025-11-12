import { type FC, useMemo, useState, useEffect } from 'react'
import { Search, FileText, Eye, X, ChevronLeft, ChevronRight, Calendar, Package, Factory, ShoppingCart, RotateCcw, BarChart3, List, Grid3x3, Info, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { fetchApi } from '../../../../utils/api'

// Transaction model fields - matches TransactionDTO structure
type Transaction = {
  id?: number | null
  transactionDate?: string | null
  transactionType: string
  itemName?: string | null
  quantity: number
  userName?: string | null
  description?: string | null
  categoryName?: string | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak transakcji' }) => (
  <div className="py-16 text-center">
    <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
      <FileText className="w-10 h-10" />
    </div>
    <h3 className="text-lg font-bold text-main mb-2">{label}</h3>
    <p className="text-sm text-secondary">Brak rekordów spełniających Twoje kryteria wyszukiwania</p>
  </div>
)

const IssueHistory: FC = () => {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [itemFilter, setItemFilter] = useState<string>('')
  const [userFilter, setUserFilter] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [detail, setDetail] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch transactions on page change
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        type TransactionResponse = {
          content: Transaction[]
          totalPages: number
          totalElements: number
        }
        const data = await fetchApi<TransactionResponse>(
          `/transactions/paginated?page=${currentPage}&size=${pageSize}`
        )
        setTransactions(data?.content || [])
        setTotalPages(data?.totalPages || 0)
      } catch (err) {
        console.error('Błąd pobierania transakcji:', err)
        setTransactions([])
        setTotalPages(0)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [currentPage, pageSize])

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const f = transactions.filter(t => {
      if (t.transactionType === 'ORDER') return false
      if (typeFilter && t.transactionType !== typeFilter) return false
      if (itemFilter && t.itemName !== itemFilter) return false
      if (userFilter && t.userName !== userFilter) return false
      if (from) {
        if (!t.transactionDate) return false
        if (new Date(t.transactionDate) < new Date(from)) return false
      }
      if (to) {
        if (!t.transactionDate) return false
        const toD = new Date(to); toD.setHours(23,59,59,999)
        if (new Date(t.transactionDate) > toD) return false
      }
      if (!qq) return true
      return (
        String(t.id).includes(qq) ||
        (t.itemName ?? '').toLowerCase().includes(qq) ||
        (t.userName ?? '').toLowerCase().includes(qq) ||
        (t.description ?? '').toLowerCase().includes(qq) ||
        (t.transactionType ?? '').toLowerCase().includes(qq)
      )
    })
    return f
  }, [transactions, q, typeFilter, itemFilter, userFilter, from, to])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  const getTransactionTypeLabel = (type: string): string => {
    switch(type) {
      case 'RECEIPT': return 'Przyjęcie'
      case 'ISSUE_TO_PRODUCTION': return 'Produkcja'
      case 'ISSUE_TO_SALES': return 'Sprzedaż'
      default: return type
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    const iconProps = "w-4 h-4"
    switch(type) {
      case 'RECEIPT': return <CheckCircle2 className={iconProps} />
      case 'ISSUE_TO_PRODUCTION': return <Factory className={iconProps} />
      case 'ISSUE_TO_SALES': return <ShoppingCart className={iconProps} />
      default: return <Package className={iconProps} />
    }
  }

  const getTransactionBadgeColor = (type: string): string => {
    switch(type) {
      case 'RECEIPT': return 'bg-success-bg text-success-text'
      case 'ISSUE_TO_PRODUCTION': return 'bg-primary/10 text-primary'
      case 'ISSUE_TO_SALES': return 'bg-error-bg text-error-text'
      case 'RETURN': return 'bg-warning-bg text-warning-text'
      default: return 'bg-surface-secondary text-secondary'
    }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-surface-secondary min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-main">Historia Transakcji</h1>
          </div>
          <p className="text-secondary text-sm ml-11">Pełny przegląd wszystkich operacji magazynowych z możliwością filtrowania i wyszukiwania</p>
        </div>

        {/* Search and Quick Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 flex items-center bg-surface border border-main rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Szukaj po ID, pozycji, użytkowniku..."
              className="w-full bg-surface text-main placeholder-muted text-sm focus:outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-main rounded-xl text-sm text-main font-medium hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none pr-10"
            >
              <option value="">Wszystkie typy</option>
              <option value="RECEIPT">Przyjęcie</option>
              <option value="ISSUE_TO_PRODUCTION">Produkcja</option>
              {/* <option value="ISSUE_TO_SALES">Sprzedaż</option> */}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary">
              {typeFilter === 'RECEIPT' && <CheckCircle2 className="w-4 h-4" />}
              {typeFilter === 'ISSUE_TO_PRODUCTION' && <Factory className="w-4 h-4" />}
              {typeFilter === 'ISSUE_TO_SALES' && <ShoppingCart className="w-4 h-4" />}
            </div>
          </div>

          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="px-4 py-3 bg-surface border border-main rounded-xl text-sm text-main font-medium hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Wszyscy użytkownicy</option>
            {Array.from(new Set(transactions.map(t => t.userName).filter(Boolean))).map((name) => (
              <option key={name} value={name || ''}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range and View Toggle */}
      <div className="bg-surface border border-main rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <label className="text-sm font-medium text-main">Od:</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-main bg-surface-secondary text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <label className="text-sm font-medium text-main">Do:</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-main bg-surface-secondary text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setView('table')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                view === 'table'
                  ? 'view-switch-active'
                  : 'bg-surface border border-main text-main hover:border-primary'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Tabela
            </button>
            <button
              onClick={() => setView('cards')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                view === 'cards'
                  ? 'view-switch-active'
                  : 'bg-surface border border-main text-main hover:border-primary'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Karty
            </button>
          </div>
        </div>
      </div>

      <section className="bg-surface border border-main rounded-xl shadow-sm overflow-hidden">
        {loading && (
          <div className="py-16 text-center">
            <div className="flex justify-center mb-4">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-main border-t-primary"></div>
            </div>
            <p className="text-secondary font-medium">Ładowanie transakcji...</p>
          </div>
        )}
        {!loading && results.length === 0 ? (
          <EmptyState />
        ) : !loading ? (
          view === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-secondary border-b border-main">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-main">ID</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-main">Data</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-main">Typ Operacji</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-main">Pozycja</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-main">Ilość</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-main">Użytkownik</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-main">Notatka</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-main">Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((t, idx) => (
                    <tr key={t.id ?? idx} className="border-b border-main hover:bg-surface-secondary transition-colors group">
                      <td className="px-4 py-4 text-sm text-secondary font-mono">{t.id}</td>
                      <td className="px-4 py-4 text-sm text-main">{formatDate(t.transactionDate)}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full font-medium text-xs inline-flex items-center gap-2 ${getTransactionBadgeColor(t.transactionType)}`}>
                          {getTransactionTypeIcon(t.transactionType)}
                          {getTransactionTypeLabel(t.transactionType)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-main">{t.itemName ?? '-'}</td>
                      <td className="px-4 py-4 text-sm text-center font-semibold text-primary">{t.quantity}</td>
                      <td className="px-4 py-4 text-sm text-secondary">{t.userName ?? '-'}</td>
                      <td className="px-4 py-4 text-sm text-secondary truncate max-w-xs">{t.description ?? '—'}</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setDetail(t)}
                          className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((t, idx) => (
                  <article
                    key={t.id ?? idx}
                    className="bg-surface-secondary border border-main rounded-lg p-5 hover:shadow-md transition-all hover:border-primary group cursor-pointer"
                  >
                    {/* Header Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full font-medium text-xs inline-flex items-center gap-2 ${getTransactionBadgeColor(t.transactionType)}`}>
                        {getTransactionTypeIcon(t.transactionType)}
                        {getTransactionTypeLabel(t.transactionType)}
                      </span>
                      <span className="text-xs text-secondary font-mono">#{t.id}</span>
                    </div>

                    {/* Item Name - Primary */}
                    <h3 className="text-lg font-bold text-main mb-2 group-hover:text-primary transition-colors truncate">
                      {t.itemName ?? 'Brak nazwy'}
                    </h3>

                    {/* Quantity Highlight */}
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                      <div className="text-xs text-secondary mb-1">Ilość</div>
                      <div className="text-2xl font-bold text-primary">{t.quantity}</div>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-3 mb-4 text-sm">
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-secondary mb-1">Data</div>
                          <div className="text-main font-medium">{formatDate(t.transactionDate)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-secondary mb-1">Użytkownik</div>
                          <div className="text-main font-medium">{t.userName ?? '—'}</div>
                        </div>
                      </div>
                      {t.description && (
                        <div className="flex items-start gap-3">
                          <Info className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs text-secondary mb-1">Notatka</div>
                            <div className="text-secondary line-clamp-2">{t.description}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Details Button */}
                    <button
                      onClick={() => setDetail(t)}
                      className="w-full px-4 py-2 rounded-lg border border-main btn-details bg-surface hover:bg-surface-hover dark:bg-primary dark:hover:bg-primary-hover transition-colors font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Szczegóły
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )
        ) : null}
        {/* Pagination Controls */}
        <div className="border-t border-main px-6 py-4 bg-surface-secondary flex items-center justify-between">
          <div className="text-sm font-medium text-main flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Strona <span className="font-bold text-primary">{currentPage + 1}</span> z <span className="font-bold text-primary">{totalPages || 1}</span> • <span className="text-secondary">{results.length} wynik{results.length !== 1 ? 'ów' : ''}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || loading}
              className="px-4 py-2 rounded-lg border border-main bg-surface text-main disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover hover:border-primary transition-all flex items-center gap-2 font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Poprzednia
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1 || loading}
              className="px-4 py-2 rounded-lg border border-main bg-surface text-main disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover hover:border-primary transition-all flex items-center gap-2 font-medium text-sm"
            >
              Następna
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-surface border border-main rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header with Badge */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-main px-6 py-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-bold text-main">Szczegóły Transakcji</h3>
                  </div>
                  <div className="text-sm text-secondary mt-1">ID: <span className="font-mono font-semibold text-primary">{detail.id}</span></div>
                </div>
                <button
                  onClick={() => setDetail(null)}
                  className="p-2 rounded-lg bg-surface hover:bg-surface-secondary transition-colors text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2 ${getTransactionBadgeColor(detail.transactionType)}`}>
                  {getTransactionTypeIcon(detail.transactionType)}
                  {getTransactionTypeLabel(detail.transactionType)}
                </span>
                <span className="text-sm text-secondary flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(detail.transactionDate)}
                </span>
              </div>
            </div>

            {/* Content Grid */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* Item */}
                  <div className="p-4 bg-surface-secondary rounded-lg border border-main">
                    <div className="text-xs font-semibold text-secondary mb-2 uppercase tracking-wide flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Pozycja
                    </div>
                    <div className="text-lg font-bold text-main">{detail.itemName ?? '—'}</div>
                  </div>

                  {/* Quantity - Highlight */}
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs font-semibold text-secondary mb-2 uppercase tracking-wide flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Ilość
                    </div>
                    <div className="text-3xl font-bold text-primary">{detail.quantity}</div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* User */}
                  <div className="p-4 bg-surface-secondary rounded-lg border border-main">
                    <div className="text-xs font-semibold text-secondary mb-2 uppercase tracking-wide flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Użytkownik
                    </div>
                    <div className="text-lg font-bold text-main">{detail.userName ?? '—'}</div>
                  </div>

                  {/* Category if present */}
                  {detail.categoryName && (
                    <div className="p-4 bg-surface-secondary rounded-lg border border-main">
                      <div className="text-xs font-semibold text-secondary mb-2 uppercase tracking-wide flex items-center gap-2">
                        <List className="w-4 h-4" />
                        Kategoria
                      </div>
                      <div className="text-lg font-bold text-main">{detail.categoryName}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description - Full Width */}
              {detail.description && (
                <div className="mt-6 p-4 bg-surface-secondary rounded-lg border border-main">
                  <div className="text-xs font-semibold text-secondary mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Notatka
                  </div>
                  <div className="text-main leading-relaxed">{detail.description}</div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-main px-6 py-4 bg-surface-secondary flex justify-end gap-3">
              <button
                onClick={() => setDetail(null)}
                className="px-6 py-2 rounded-lg border border-main bg-surface text-main hover:bg-surface-hover transition-colors font-medium"
              >
                Zamknij
              </button>
              <button
                onClick={() => setDetail(null)}
                className="px-6 py-2 rounded-lg bg-primary btn-details hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Gotowe
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default IssueHistory
