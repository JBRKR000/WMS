import { Search, ShoppingCart, Box, Eye, Star, X, Edit3, Trash2 } from 'lucide-react'
import EditItemModal from '../../../../components/items/editModal'
import { type FC, useMemo, useState, useEffect } from 'react'

// There is no dedicated Product model in backend — reuse Item fields for Products UI
type Category = { id?: number | null; name: string }
type Product = {
  id?: number | null
  name: string
  description?: string | null
  category?: Category | null
  unit?: string | null
  currentQuantity?: number
  threshold?: number
  qrCode?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak produktów' }) => (
  <div className="py-12 text-center text-sm text-secondary">
    <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-surface border border-main flex items-center justify-center text-secondary">
      <ShoppingCart className="w-8 h-8" />
    </div>
    <div className="font-medium text-main">{label}</div>
    <div className="text-xs text-secondary mt-1">Dodaj produkty aby móc nimi zarządzać</div>
  </div>
)

const Products: FC = () => {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('') // holds selected category name
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [favoriteOnly] = useState(false)
  const [preview, setPreview] = useState<Product | null>(null)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)

  // fetched products list
  const [products, setProducts] = useState<Product[]>([])
  // fetched categories for filtering
  const [categories, setCategories] = useState<Category[]>([])

  const loadProducts = async () => {
    try {
      const authToken = localStorage.getItem('authToken')
      if (!authToken) return
      const res = await fetch(`/api/items/getProductsAndComponentsPaginated?page=0&size=100`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      const prods: Product[] = data.content
        .filter((item: any) => item.itemType === 'PRODUCT')
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.categoryName ? { name: item.categoryName } : null,
          unit: item.unit,
          currentQuantity: item.currentQuantity,
          threshold: item.threshold,
          qrCode: item.qrCode,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
      setProducts(prods)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // fetch categories for filter
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const authToken = localStorage.getItem('authToken')
        if (!authToken) return
        const res = await fetch('/api/categories', {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        const mapped: Category[] = data.map((c: any) => ({ id: c.id, name: c.name }))
        setCategories(mapped)
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    loadCategories()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(p => {
      if (categoryFilter && p.category?.name !== categoryFilter) return false
      if (favoriteOnly) return false // placeholder: no favorite flag in model
      if (!q) return true
      return (
        (String(p.id ?? '')).includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.qrCode ?? '').toLowerCase().includes(q)
      )
    })
  }, [products, query, categoryFilter, favoriteOnly])

  const handleDeleteItem = async (itemId: number) => {
    try {
      const authToken = localStorage.getItem('authToken')
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      if (!response.ok) throw new Error('Failed to delete item')
      
      // Refresh products list
      setDeletingItemId(null)
      await loadProducts()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Błąd podczas usuwania produktu')
      setDeletingItemId(null)
    }
  }


  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Produkty</h1>
          <p className="text-sm text-secondary mt-1">Przegląd produktów oparty o model Item — pola dostępne: id, name, description, category, unit, currentQuantity, qrCode, createdAt, updatedAt.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-surface border border-main rounded-2xl px-3 py-1 w-full md:w-80">
            <Search className="h-4 w-4 text-secondary mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj produktów" className="w-full bg-surface text-main placeholder-secondary text-sm focus:outline-none" />
          </div>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-surface border border-main rounded-2xl text-sm text-main">
            <option value="">Wszystkie kategorie</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <div className="flex items-center gap-2">
            <button onClick={() => setView('grid')} className={`px-3 py-2 rounded-full border border-main text-sm ${view === 'grid' ? 'bg-primary text-white' : 'bg-surface text-main'}`}><Box className="w-4 h-4"/></button>
            <button onClick={() => setView('list')} className={`px-3 py-2 rounded-full border border-main text-sm ${view === 'list' ? 'bg-primary text-white' : 'bg-surface text-main'}`}><Star className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === 'list' ? (
          <ul className="space-y-2">
            {filtered.map((p, idx) => (
              <li key={p.id ?? idx} className="group flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-main rounded-lg hover:border-primary hover:shadow-md transition">
                {/* Lewa strona - informacje */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    {/* ID badge */}
                    <div className="flex-shrink-0 bg-primary/10 text-primary px-3 py-2 rounded-lg font-bold text-sm">
                      #{p.id}
                    </div>
                    
                    {/* Główne info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-main line-clamp-1">{p.name}</h4>
                      <p className="text-sm text-secondary line-clamp-1 mt-0.5">{p.description ?? 'Brak opisu'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-secondary">
                        <span className="inline-flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded">
                          <span className="font-medium">Kategoria:</span> {p.category?.name ?? '-'}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded font-bold text-primary">
                          {p.currentQuantity ?? 0} <span className="text-secondary">{p.unit ?? ''}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prawa strona - akcje */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button onClick={() => setPreview(p)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-main text-main bg-surface hover:bg-primary hover:text-white hover:border-primary transition text-sm font-medium"><Eye className="w-4 h-4"/>Podgląd</button>
                  <button onClick={() => { setEditingItem(p); setIsEditItemModalOpen(true); }} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-main text-main bg-surface hover:bg-primary hover:text-white hover:border-primary transition text-sm font-medium"><Edit3 className="w-4 h-4"/>Edytuj</button>
                  <button 
                    onClick={() => deletingItemId === p.id ? handleDeleteItem(p.id!) : setDeletingItemId(p.id!)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all duration-300 text-sm font-medium ${
                      deletingItemId === p.id 
                        ? 'border-error bg-error text-white' 
                        : 'border-error text-error-text bg-surface hover:bg-error hover:text-white'
                    }`}
                  >
                    <Trash2 className="w-4 h-4"/>
                    <span className="hidden sm:inline">{deletingItemId === p.id ? 'Potwierdź?' : 'Usuń'}</span>
                  </button>
                  {/* Mobile: menu ikona */}
                  <button onClick={() => setPreview(p)} className="sm:hidden p-2 text-secondary hover:text-main">
                    <Eye className="w-5 h-5"/>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, idx) => (
              <article key={p.id ?? idx} className="group relative bg-surface border border-main rounded-xl shadow-sm hover:shadow-lg transform transition hover:-translate-y-1 overflow-hidden">
                {/* Header bar z kategorią */}
                <div className="bg-primary/10 px-4 py-2 border-b border-main/20">
                  <div className="text-xs font-medium text-primary uppercase tracking-wide">{p.category?.name ?? 'Brak kategorii'}</div>
                </div>

                {/* Główna zawartość */}
                <div className="p-4">
                  {/* ID i nazwa */}
                  <div className="mb-3">
                    <div className="text-xs text-secondary mb-1">ID #{p.id}</div>
                    <h3 className="text-base font-bold text-main line-clamp-2">{p.name}</h3>
                  </div>

                  {/* Opis */}
                  <p className="text-sm text-secondary line-clamp-2 mb-4">{p.description ?? 'Brak opisu'}</p>

                  {/* Info row - ilość i jednostka */}
                  <div className="bg-surface-secondary rounded-lg p-3 mb-4 border border-main/10">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs text-secondary uppercase tracking-wide">Dostępna ilość</div>
                        <div className="text-2xl font-bold text-main mt-1">{p.currentQuantity ?? 0}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-secondary uppercase tracking-wide">Jednostka</div>
                        <div className="text-lg font-semibold text-primary mt-1">{p.unit ?? '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Akcje */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setPreview(p)} className="flex-1 inline-flex items-center justify-center gap-2 px-2 py-2 rounded-lg border border-main text-main bg-surface hover:bg-primary hover:text-white hover:border-primary transition text-sm font-medium"><Eye className="w-4 h-4"/>Podgląd</button>
                    <button onClick={() => { setEditingItem(p); setIsEditItemModalOpen(true); }} className="flex-1 inline-flex items-center justify-center gap-2 px-2 py-2 rounded-lg border border-main text-main bg-surface hover:bg-primary hover:text-white hover:border-primary transition text-sm font-medium"><Edit3 className="w-4 h-4"/>Edytuj</button>
                    <button 
                      onClick={() => deletingItemId === p.id ? handleDeleteItem(p.id!) : setDeletingItemId(p.id!)}
                      className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border transition-all duration-300 text-sm font-medium ${
                        deletingItemId === p.id 
                          ? 'border-error bg-error text-white' 
                          : 'border-error text-error-text bg-surface hover:bg-error hover:text-white'
                      }`}
                    >
                      <Trash2 className="w-4 h-4"/>
                      <span>{deletingItemId === p.id ? 'Potwierdź?' : 'Usuń'}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

  {/* Preview modal */}
  {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="w-full max-w-2xl border rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="p-6 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{preview.name}</h3>
                <div style={{ color: 'var(--color-surface)', opacity: 0.8 }} className="text-sm mt-1">ID: {preview.id}</div>
              </div>
              <button 
                onClick={() => setPreview(null)} 
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
                    <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold">{preview.currentQuantity ?? 0}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{preview.unit ?? '-'}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border rounded-lg p-4">
                  <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold mb-1">Próg minimalny</div>
                  <div className="flex items-baseline gap-2">
                    <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold">{preview.threshold || '-'}</div>
                    {preview.threshold && <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{preview.unit ?? '-'}</div>}
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="space-y-3">
                {preview.description && (
                  <div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-1">Opis</div>
                    <div style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text)' }} className="rounded p-3 text-sm">{preview.description}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Kategoria</div>
                    <div style={{ color: 'var(--color-text)' }} className="font-medium mt-1 text-sm">{preview.category?.name ?? '-'}</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                    <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">Typ</div>
                    <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="inline-block px-2 py-1 rounded text-xs font-semibold mt-1">
                      Produkt
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              {preview.qrCode && (
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-2">Kod QR</div>
                  <div style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }} className="text-xs font-mono p-2 rounded border break-all">{preview.qrCode}</div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="font-semibold">Utworzono</div>
                  <div style={{ color: 'var(--color-text)' }} className="mt-1 text-xs">{preview.createdAt ? new Date(preview.createdAt).toLocaleString('pl-PL') : '-'}</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="rounded p-3">
                  <div style={{ color: 'var(--color-text-secondary)' }} className="font-semibold">Zmieniono</div>
                  <div style={{ color: 'var(--color-text)' }} className="mt-1 text-xs">{preview.updatedAt ? new Date(preview.updatedAt).toLocaleString('pl-PL') : '-'}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border-t px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setPreview(null)} 
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
      {/* Edit Item Modal UI */}
      {editingItem && (
        <EditItemModal
          isOpen={isEditItemModalOpen}
          onClose={() => { setIsEditItemModalOpen(false); setEditingItem(null); }}
          item={{
            id: editingItem.id!,
            name: editingItem.name,
            description: editingItem.description ?? null,
            categoryName: editingItem.category?.name ?? null,
            unit: editingItem.unit ?? null,
            currentQuantity: editingItem.currentQuantity ?? 0,
            threshold: editingItem.threshold ?? undefined,
            qrCode: editingItem.qrCode ?? null,
            itemType: 'PRODUCT',
          }}
          onSubmit={async () => {
            setIsEditItemModalOpen(false);
            setEditingItem(null);
            await loadProducts(); // Refresh products list
          }}
        />
      )}
    </main>
  )
}

export default Products
