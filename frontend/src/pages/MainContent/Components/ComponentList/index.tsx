import { Search, Tag, Box, Eye, X, Edit3, Trash2 } from 'lucide-react'
import EditItemModal from '../../../../components/items/editModal'
import { type FC, useMemo, useState, useEffect } from 'react'

// DTO model from backend for paginated PRODUCTS and COMPONENTS
// Item model from backend (fields only)
type LocationSummary = { id?: number; code: string; name: string; type: string }
export type ItemDTO = {
  id: number
  name: string
  description?: string | null
  categoryName?: string | null
  unit?: string | null
  currentQuantity?: number
  threshold?: number
  qrCode?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  itemType: 'PRODUCT' | 'COMPONENT'
  keywords: string[]
  location?: LocationSummary | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak komponentów' }) => (
  <div className="py-12 text-center text-sm text-secondary">
    <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <Box className="w-8 h-8" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Dodaj komponenty, aby zobaczyć je tutaj</div>
  </div>
)

const ComponentList: FC = () => {
  // replace placeholder with fetched components
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [view, setView] = useState<'cards' | 'compact'>('cards')
  const [modal, setModal] = useState<ItemDTO | null>(null)
  const [items, setItems] = useState<ItemDTO[]>([])
  const [editingItem, setEditingItem] = useState<ItemDTO | null>(null)
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)

  // fetch paginated items and filter only COMPONENTS
  const loadComponents = async () => {
    try {
      const authToken = localStorage.getItem('authToken')
      if (!authToken) return
      const res = await fetch(`/api/items/getProductsAndComponentsPaginated?page=0&size=100`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!res.ok) throw new Error('Failed to load components')
      const data = await res.json()
      const comps: ItemDTO[] = data.content.filter((item: ItemDTO) => item.itemType === 'COMPONENT')
      setItems(comps)
    } catch (error) {
      console.error('Error loading components:', error)
    }
  }

  useEffect(() => {
    loadComponents()
  }, [])

  const categories = useMemo(() => {
    const map = new Map<number, string>()
    items.forEach(i => { if (i.categoryName != null) map.set(i.id, i.categoryName) })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(i => {
      if (!q) return true
      return (
        (String(i.id)).includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.description ?? '').toLowerCase().includes(q) ||
        (i.qrCode ?? '').toLowerCase().includes(q) ||
        (i.categoryName ?? '').toLowerCase().includes(q)
      )
    })
  }, [items, query])

  const handleDeleteItem = async (itemId: number) => {
    try {
      const authToken = localStorage.getItem('authToken')
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      if (!response.ok) throw new Error('Failed to delete item')
      
      // Refresh components list
      setDeletingItemId(null)
      await loadComponents()
    } catch (error) {
      console.error('Error deleting component:', error)
      alert('Błąd podczas usuwania komponentu')
      setDeletingItemId(null)
    }
  }

  // Removed unused formatDate function

  return (
    <main className="p-4 md:p-6 lg:p-8">
      {/* Hero / summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Komponenty magazynowe</h1>
          <p className="text-sm text-secondary mt-1">Widok bazujący na modelu Item. Wyświetlane pola: id, name, description, category, unit, currentQuantity, qrCode, createdAt, updatedAt.</p>
          <div className="mt-3 flex items-center gap-3 text-sm text-secondary">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-main">Łącznie: <span className="font-semibold text-main ml-1">{items.length}</span></div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-main">Kategorie: <span className="font-semibold text-main ml-1">{categories.length}</span></div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-surface border border-main rounded-2xl px-3 py-1 w-full md:w-80">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj po nazwie, opisie, QR" className="w-full bg-surface text-main placeholder-secondary focus:outline-none text-sm" />
          </div>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-surface border border-main rounded-2xl text-sm text-main">
            <option value="">Wszystkie kategorie</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>

          <div className="inline-flex items-center gap-2">
            <button onClick={() => setView('cards')} className={`px-3 py-2 rounded-full border border-main text-sm bg-surface`}>
              <Tag className="w-4 h-4" style={view === 'cards' ? { color: 'var(--color-primary)' } : { color: 'var(--color-text-secondary)' }} />
            </button>
            <button onClick={() => setView('compact')} className={`px-3 py-2 rounded-full border border-main text-sm bg-surface`}>
              <Box className="w-4 h-4" style={view === 'compact' ? { color: 'var(--color-primary)' } : { color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === 'compact' ? (
          <ul className="space-y-2">
            {filtered.map((it, idx) => (
              <li key={it.id ?? idx} className="group flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-main rounded-lg hover:border-primary hover:shadow-md transition">
                {/* Lewa strona - informacje */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    {/* ID badge */}
                    <div className="flex-shrink-0 bg-primary/10 text-primary px-3 py-2 rounded-lg font-bold text-sm">
                      #{it.id}
                    </div>
                    
                    {/* Główne info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-main line-clamp-1">{it.name}</h4>
                      <p className="text-sm text-secondary line-clamp-1 mt-0.5">{it.description ?? 'Brak opisu'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-secondary">
                        <span className="inline-flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded">
                          <span className="font-medium">Kategoria:</span> {it.categoryName ?? '-'}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded font-bold text-primary">
                          {it.currentQuantity ?? 0} <span className="text-secondary">{it.unit ?? ''}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prawa strona - akcje */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button onClick={() => setModal(it)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-main text-main bg-surface hover:bg-primary hover:text-white hover:border-primary transition text-sm font-medium"><Eye className="w-4 h-4"/>Szczegóły</button>
                  <button onClick={() => { setEditingItem(it); setIsEditItemModalOpen(true); }} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-main text-main bg-surface hover:bg-primary hover:text-white hover:border-primary transition text-sm font-medium"><Edit3 className="w-4 h-4"/>Edytuj</button>
                  <button 
                    onClick={() => deletingItemId === it.id ? handleDeleteItem(it.id) : setDeletingItemId(it.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all duration-300 text-sm font-medium ${
                      deletingItemId === it.id 
                        ? 'border-error bg-error text-white' 
                        : 'border-error text-error-text bg-surface hover:bg-error hover:text-white'
                    }`}
                  >
                    <Trash2 className="w-4 h-4"/>
                    <span className="hidden sm:inline">{deletingItemId === it.id ? 'Potwierdź?' : 'Usuń'}</span>
                  </button>
                  {/* Mobile: menu ikona */}
                  <button onClick={() => setModal(it)} className="sm:hidden p-2 text-secondary hover:text-main">
                    <Eye className="w-5 h-5"/>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((it, idx) => (
              <article key={it.id ?? idx} className="group relative bg-surface border border-main rounded-xl shadow-sm hover:shadow-lg transform transition hover:-translate-y-1 overflow-hidden">
                {/* Header bar z kategorią */}
                <div className="bg-primary/10 px-4 py-2 border-b border-main/20">
                  <div className="text-xs font-medium text-primary uppercase tracking-wide">{it.categoryName ?? 'Brak kategorii'}</div>
                </div>

                {/* Główna zawartość */}
                <div className="p-4">
                  {/* ID i nazwa */}
                  <div className="mb-3">
                    <div className="text-xs text-secondary mb-1">ID #{it.id}</div>
                    <h3 className="text-base font-bold text-main line-clamp-2">{it.name}</h3>
                  </div>

                  {/* Opis */}
                  <p className="text-sm text-secondary line-clamp-2 mb-4">{it.description ?? 'Brak opisu'}</p>

                  {/* Info row - ilość i jednostka */}
                  <div className="bg-surface-secondary rounded-lg p-3 mb-4 border border-main/10">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs text-secondary uppercase tracking-wide">Dostępna ilość</div>
                        <div className="text-2xl font-bold text-main mt-1">{it.currentQuantity ?? 0}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-secondary uppercase tracking-wide">Jednostka</div>
                        <div className="text-lg font-semibold text-primary mt-1">{it.unit ?? '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Akcje */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setModal(it)} className="flex-1 inline-flex items-center justify-center gap-2 px-2 py-2 rounded-lg border border-main text-main bg-surface tile-action-hover text-sm font-medium"><Eye className="w-4 h-4"/>Szczegóły</button>
                    <button onClick={() => { setEditingItem(it); setIsEditItemModalOpen(true); }} className="flex-1 inline-flex items-center justify-center gap-2 px-2 py-2 rounded-lg border border-main text-main bg-surface tile-action-hover text-sm font-medium"><Edit3 className="w-4 h-4"/>Edytuj</button>
                    <button 
                      onClick={() => deletingItemId === it.id ? handleDeleteItem(it.id) : setDeletingItemId(it.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border transition-all duration-300 text-sm font-medium ${
                        deletingItemId === it.id 
                          ? 'border-error bg-error text-white' 
                          : 'border-error text-error-text bg-surface hover:bg-error hover:text-white'
                      }`}
                    >
                      <Trash2 className="w-4 h-4"/>
                      <span>{deletingItemId === it.id ? 'Potwierdź?' : 'Usuń'}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal - Details */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="w-full max-w-2xl border rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="p-6 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{modal.name}</h3>
                <div style={{ color: 'var(--color-surface)', opacity: 0.8 }} className="text-sm mt-1">ID: {modal.id}</div>
              </div>
              <button 
                onClick={() => setModal(null)} 
                style={{ color: 'var(--color-surface)', opacity: 0.6 }}
                className="hover:opacity-100 hover:bg-white/10 rounded-lg p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div style={{ backgroundColor: 'var(--color-surface)' }} className="p-6 max-h-96 overflow-y-auto space-y-6">
              
              {/* Main metrics grid */}
              <div className="grid grid-cols-2 gap-4">
                <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4">
                  <div style={{ color: 'var(--color-accent)' }} className="text-xs font-semibold mb-1">Dostępna ilość</div>
                  <div className="flex items-baseline gap-2">
                    <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold">{modal.currentQuantity ?? 0}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{modal.unit ?? '-'}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4">
                  <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold mb-1">Sektor</div>
                  <div className="flex flex-col gap-1">
                    <div style={{ color: 'var(--color-text)' }} className="text-lg font-bold">{modal.location?.code ?? '-'}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">{modal.location?.name ?? '-'}</div>
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="space-y-3">
                {modal.description && (
                  <div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-1">Opis</div>
                    <div style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text)' }} className="rounded p-3 text-sm">{modal.description}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Kategoria</div>
                    <div style={{ color: 'var(--color-text)' }} className="font-medium mt-1 text-sm">{modal.categoryName ?? '-'}</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Typ</div>
                    <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="inline-block px-2 py-1 rounded text-xs font-semibold mt-1">
                      {modal.itemType === 'COMPONENT' ? 'Komponent' : 'Produkt'}
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              {modal.qrCode && (
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-2">Kod QR</div>
                  <div style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }} className="text-xs font-mono p-2 rounded border break-all">{modal.qrCode}</div>
                </div>
              )}

              {/* Keywords */}
              {modal.keywords && modal.keywords.length > 0 && (
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-2">Słowa kluczowe</div>
                  <div className="flex flex-wrap gap-2">
                    {modal.keywords.map((keyword, idx) => (
                      <span key={idx} style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="px-2 py-1 rounded text-xs font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="font-semibold">Utworzone</div>
                  <div style={{ color: 'var(--color-text)' }} className="mt-1 text-xs">{modal.createdAt ? new Date(modal.createdAt).toLocaleString('pl-PL') : '-'}</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="font-semibold">Zmieniono</div>
                  <div style={{ color: 'var(--color-text)' }} className="mt-1 text-xs">{modal.updatedAt ? new Date(modal.updatedAt).toLocaleString('pl-PL') : '-'}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border-t px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setModal(null)} 
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="px-4 py-2 rounded-lg border font-medium hover:opacity-80 transition-opacity"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          isOpen={isEditItemModalOpen}
          onClose={() => { setIsEditItemModalOpen(false); setEditingItem(null); }}
          item={{
            id: editingItem.id,
            name: editingItem.name,
            description: editingItem.description ?? null,
            categoryName: editingItem.categoryName ?? null,
            unit: editingItem.unit ?? null,
            currentQuantity: editingItem.currentQuantity ?? 0,
            threshold: editingItem.threshold ?? undefined,
            qrCode: editingItem.qrCode ?? null,
            itemType: 'COMPONENT',
            keywords: editingItem.keywords ?? [],
          }}
          onSubmit={async () => {
            setIsEditItemModalOpen(false);
            setEditingItem(null);
            await loadComponents(); // Refresh components list
          }}
        />
      )}
    </main>
  )
}

export default ComponentList
