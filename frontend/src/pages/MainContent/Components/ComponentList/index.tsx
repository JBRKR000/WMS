import { Search, Tag, Box, Eye, X, Edit3, Trash2 } from 'lucide-react'
import EditItemModal from '../../../../components/items/editModal'
import { type FC, useMemo, useState, useEffect } from 'react'

// DTO model from backend for paginated PRODUCTS and COMPONENTS
// Item model from backend (fields only)
export type ItemDTO = {
  id: number
  name: string
  description?: string | null
  categoryName?: string | null
  unit?: string | null
  currentQuantity?: number
  qrCode?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  itemType: 'PRODUCT' | 'COMPONENT'
  keywords: string[]
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
          <div className="flex items-center bg-white dark:bg-transparent border border-main rounded-2xl px-3 py-1 w-full md:w-80">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj po nazwie, opisie, QR" className="w-full bg-white dark:bg-gray-800/30 text-main placeholder-secondary dark:placeholder-gray-400 focus:outline-none text-sm" />
          </div>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-white border border-main rounded-2xl text-sm text-main">
            <option value="">Wszystkie kategorie</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>

          <div className="inline-flex items-center gap-2">
            <button onClick={() => setView('cards')} className={`px-3 py-2 rounded-full border border-main text-sm ${view === 'cards' ? 'bg-surface-hover' : 'bg-white'}`}><Tag className="w-4 h-4"/></button>
            <button onClick={() => setView('compact')} className={`px-3 py-2 rounded-full border border-main text-sm ${view === 'compact' ? 'bg-surface-hover' : 'bg-white'}`}><Box className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === 'compact' ? (
          <ul className="divide-y divide-main">
            {filtered.map((it, idx) => (
              <li key={it.id ?? idx} className="flex items-center justify-between py-3 hover:bg-surface-hover px-2 rounded-md">
                <div>
                  <div className="text-sm text-secondary">#{it.id}</div>
                  <div className="text-main font-medium">{it.name}</div>
                  <div className="text-xs text-secondary">{it.categoryName ?? '-'} • {it.currentQuantity ?? '-'} {it.unit ?? ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setModal(it)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Eye className="w-4 h-4"/>Szczegóły</button>
                  <button onClick={() => { setEditingItem(it); setIsEditItemModalOpen(true); }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Edit3 className="w-4 h-4"/>Edytuj</button>
                  <button 
                    onClick={() => deletingItemId === it.id ? handleDeleteItem(it.id) : setDeletingItemId(it.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      deletingItemId === it.id 
                        ? 'border-red-700 bg-red-600 text-white w-32' 
                        : 'border-red-500 text-red-500 bg-white hover:bg-red-50 w-auto'
                    }`}
                  >
                    <Trash2 className="w-4 h-4"/>
                    <span className={`transition-all duration-300 ${deletingItemId === it.id ? 'opacity-100' : 'opacity-100'}`}>
                      {deletingItemId === it.id ? 'Potwierdź' : 'Usuń'}
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((it, idx) => (
              <article key={it.id ?? idx} className="group p-4 rounded-xl bg-white border border-main shadow-sm transform transition hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-secondary">ID: {it.id}</div>
                    <h3 className="text-lg font-semibold text-main mt-1">{it.name}</h3>
                    <p className="text-xs text-secondary mt-1 line-clamp-2">{it.description ?? '-'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-main">{it.currentQuantity ?? '-'}</div>
                    <div className="text-xs text-secondary">{it.unit ?? ''}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-secondary">Kategoria: {it.categoryName ?? '-'}</div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setModal(it)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Eye className="w-4 h-4"/>Szczegóły</button>
                    <button onClick={() => { setEditingItem(it); setIsEditItemModalOpen(true); }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main text-main bg-white"><Edit3 className="w-4 h-4"/>Edytuj</button>
                    <button 
                      onClick={() => deletingItemId === it.id ? handleDeleteItem(it.id) : setDeletingItemId(it.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ease-in-out transform hover:scale-105 ${
                        deletingItemId === it.id 
                          ? 'border-red-700 bg-red-600 text-white w-32' 
                          : 'border-red-500 text-red-500 bg-white hover:bg-red-50 w-auto'
                      }`}
                    >
                      <Trash2 className="w-4 h-4"/>
                      <span className={`transition-all duration-300 ${deletingItemId === it.id ? 'opacity-100' : 'opacity-100'}`}>
                        {deletingItemId === it.id ? 'Potwierdź' : 'Usuń'}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal - UI only */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-main">{modal.name}</h3>
                <div className="text-xs text-secondary">ID: {modal.id} • Kategoria: {modal.categoryName ?? '-'}</div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-md text-secondary"><X className="w-5 h-5"/></button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
              <div>
                <div className="text-xs text-secondary">Opis</div>
                <div className="text-main mt-1">{modal.description ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-secondary">Ilość / Jednostka</div>
                <div className="text-main mt-1">{modal.currentQuantity ?? '-'} {modal.unit ?? ''}</div>
                <div className="text-xs text-secondary mt-3">QR</div>
                <div className="text-main mt-1">{modal.qrCode ?? '-'}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-full border border-main text-main bg-white">Zamknij</button>
              <button className="px-4 py-2 rounded-full border border-main text-white bg-emerald-500">Eksportuj</button>
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
