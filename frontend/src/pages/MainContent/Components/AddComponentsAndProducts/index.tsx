import { type FC, useMemo, useState, useEffect } from 'react'
import { PlusCircle, Box, X } from 'lucide-react'
import { LocationService, type Location, type LocationOccupancy } from '../../../../services/locationService'
type KeywordDTO = { id: number; value: string; itemsCount: number }
type Category = { id?: number | null; name: string }
type ItemForm = {
  name: string
  description?: string
  categoryId?: number | ''
  unit?: string
  currentQuantity?: number | ''
  threshold?: number | ''
  qrCode?: string
  type?: 'COMPONENT' | 'PRODUCT'
  locationId?: number | ''
}

const AddComponentsAndProducts: FC = () => {
  // status popup
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  // auto-dismiss status
  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [statusMessage])

  const [form, setForm] = useState<ItemForm>({ name: '', description: '', categoryId: '', unit: '', currentQuantity: '', threshold: '', qrCode: '', type: 'COMPONENT', locationId: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationOccupancy, setSelectedLocationOccupancy] = useState<LocationOccupancy | null>(null)
  // keyword states
  const [availableKeywords, setAvailableKeywords] = useState<KeywordDTO[]>([])
  const [keywordSearch, setKeywordSearch] = useState<string>('')
  const [selectedKeywords, setSelectedKeywords] = useState<KeywordDTO[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          setCategories([])
          return
        }
        const res = await fetch('/api/categories', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        const mapped: Category[] = (data ?? []).map((c: any) => ({ id: c.id, name: c.name }))
        setCategories(mapped)
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await LocationService.getAll()
        setLocations(data)
      } catch (err) {
        console.error('Error fetching locations:', err)
      }
    }
    fetchLocations()
  }, [])
  // fetch keywords list
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const authToken = localStorage.getItem('authToken')
        if (!authToken) return
        const res = await fetch('/api/keywords', { headers: { Authorization: `Bearer ${authToken}` } })
        if (!res.ok) throw new Error('Failed to fetch keywords')
        const data = await res.json()
        setAvailableKeywords(data)
      } catch (err) {
        console.error('Error fetching keywords:', err)
      }
    }
    fetchKeywords()
  }, [])

  const handleLocationChange = async (locationId: string) => {
    setForm({ ...form, locationId: locationId ? Number(locationId) : '' })
    
    if (locationId) {
      try {
        const occupancy = await LocationService.getOccupancy(Number(locationId))
        setSelectedLocationOccupancy(occupancy)
      } catch (err) {
        console.error('Error fetching location occupancy:', err)
        setSelectedLocationOccupancy(null)
      }
    } else {
      setSelectedLocationOccupancy(null)
    }
  }

  const validate = (f: ItemForm) => {
    const e: Record<string, string> = {}
    if (!f.name.trim()) e.name = 'Nazwa jest wymagana'
    if (f.currentQuantity !== '' && Number(f.currentQuantity) < 0) e.currentQuantity = 'Ilość nie może być ujemna'
    if (!f.locationId || typeof f.locationId !== 'number') e.locationId = 'Lokacja jest wymagana'
    return e
  }

  const onSave = async () => {
    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    try {
      const authToken = localStorage.getItem('authToken')
      if (!authToken) throw new Error('No auth token')
      const payload = {
        name: form.name,
        description: form.description,
        unit: form.unit,
        currentQuantity: form.currentQuantity === '' ? 0 : Number(form.currentQuantity),
        threshold: form.threshold === '' ? null : Number(form.threshold),
        category: { id: form.categoryId },
        type: form.type, // use 'type' to match entity field
        keywords: selectedKeywords.map(k => ({ value: k.value })),
      }
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save item')
      const response = await res.json()
      const createdItem = response.item
      
      // Dodaj item do lokacji
      try {
        if (!createdItem?.id) {
          console.error('Created item has no ID:', createdItem)
          throw new Error('Item created but has no ID')
        }
        await LocationService.addItemToLocation(form.locationId as number, createdItem.id)
        // Pobierz zaktualizowane obłożenie lokacji
        const updatedOccupancy = await LocationService.getOccupancy(form.locationId as number)
        setSelectedLocationOccupancy(updatedOccupancy)
      } catch (err) {
        console.error('Error adding item to location:', err)
        setStatusMessage('Błąd przy dodawaniu itemu do lokacji')
        throw err
      }
      
      // success
      setPreview(true)
      setStatusMessage('Dodano przedmiot pomyślnie')
    } catch (err) {
      console.error('Error saving item:', err)
      setStatusMessage('Błąd dodawania przedmiotu')
    }
  }

  const onClear = () => {
    setForm({ name: '', description: '', categoryId: '', unit: '', currentQuantity: '', threshold: '', qrCode: '', type: 'COMPONENT', locationId: '' })
    setErrors({})
    setPreview(false)
    setKeywordSearch('')
    setSelectedKeywords([])
    setSelectedLocationOccupancy(null)
  }

  const filledPreview = useMemo(() => ({
    id: Math.floor(Math.random() * 100000),
    name: form.name || '—',
    description: form.description || '',
    category: categories.find(c => String(c.id) === String(form.categoryId)) ?? null,
    unit: form.unit || '-',
    currentQuantity: form.currentQuantity === '' ? null : Number(form.currentQuantity),
    threshold: form.threshold === '' ? null : Number(form.threshold),
    qrCode: form.qrCode || '-',
    keywords: selectedKeywords,
    itemType: form.type || 'COMPONENT',
    location: locations.find(l => l.id === form.locationId) ?? null,
    locationOccupancy: selectedLocationOccupancy
  }), [form, categories, selectedKeywords, locations, selectedLocationOccupancy])

  return (
    <main className="p-4 md:p-6 lg:p-8 bg-surface">
      {statusMessage && (
        <div className="fixed top-4 right-4 bg-success text-white px-4 py-2 rounded shadow-lg font-medium">
          {statusMessage}
        </div>
      )}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Dodaj komponent lub produkt</h1>
          <p className="text-sm text-secondary mt-1">Formularz jest UI-only — pola zgodne z modelem Item: name, description, category, unit, currentQuantity, qrCode.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onSave} className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-add hover:bg-primary-hover transition font-medium"><PlusCircle className="w-5 h-5"/>Zapisz</button>
          <button onClick={onClear} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-main text-main bg-surface hover:bg-surface-hover transition">Wyczyść</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="lg:col-span-2 bg-surface border border-main rounded-lg p-6 space-y-4" onSubmit={e => { e.preventDefault(); onSave() }}>
          <div>
            <label className="block text-xs text-secondary">Nazwa</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            {errors.name && <div className="text-xs text-error-text mt-1">{errors.name}</div>}
          </div>

          <div>
            <label className="block text-xs text-secondary">Opis</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-secondary">Kategoria</label>
              <select value={form.categoryId ?? ''} onChange={e => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : '' })} className="w-full px-3 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Wybierz kategorię</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary">Jednostka</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Wybierz jednostkę</option>
                <option value="PCS">Sztuki</option>
                <option value="KG">Kilogramy</option>
                <option value="LITER">Litry</option>
                <option value="METER">Metry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary">Ilość</label>
              <input type="number" value={form.currentQuantity as any} onChange={e => setForm({ ...form, currentQuantity: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full px-4 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              {errors.currentQuantity && <div className="text-xs text-error-text mt-1">{errors.currentQuantity}</div>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-secondary">Lokacja</label>
            <select value={form.locationId ?? ''} onChange={e => handleLocationChange(e.target.value)} className="w-full px-4 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">Wybierz lokację</option>
              {locations.map(loc => <option key={loc.id} value={String(loc.id)}>{loc.code} - {loc.name}</option>)}
            </select>
            {errors.locationId && <div className="text-xs text-error-text mt-1">{errors.locationId}</div>}
            {selectedLocationOccupancy && (
              <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-xs text-secondary mb-1">Obłożenie lokacji:</div>
                <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all ${selectedLocationOccupancy.occupancyPercentage >= 90 ? 'bg-error' : selectedLocationOccupancy.occupancyPercentage >= 70 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${Math.min(selectedLocationOccupancy.occupancyPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs font-semibold text-main">{selectedLocationOccupancy.occupancyPercentage.toFixed(1)}% ({selectedLocationOccupancy.currentOccupancy}/{selectedLocationOccupancy.maxCapacity})</div>
              </div>
            )}
          </div>

          {/* Keywords multi-select autocomplete */}
          <div>
            <label className="block text-xs text-secondary">Słowa kluczowe</label>
            <div className="flex flex-wrap gap-2 items-center">
              {selectedKeywords.map(k => (
                <div key={k.id} className="flex items-center bg-primary/20 text-main px-3 py-1 rounded-full text-sm border border-primary/30">
                  {k.value}
                  <button onClick={() => setSelectedKeywords(prev => prev.filter(x => x.id !== k.id))} className="ml-1 text-secondary hover:text-error transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="relative">
                <input
                  value={keywordSearch}
                  onChange={e => setKeywordSearch(e.target.value)}
                  placeholder="Wyszukaj słowo kluczowe"
                  className="px-4 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {keywordSearch && (
                  <ul className="absolute z-10 bg-surface border border-main rounded mt-1 max-h-40 overflow-auto w-full shadow-lg">
                    {availableKeywords.filter(k => k.value.toLowerCase().includes(keywordSearch.toLowerCase()) && !selectedKeywords.some(s => s.id === k.id)).map(k => (
                      <li key={k.id} onClick={() => { setSelectedKeywords(prev => [...prev, k]); setKeywordSearch('') }} className="px-3 py-2 hover:bg-surface-hover cursor-pointer text-sm text-main border-b border-main last:border-b-0 transition">
                        {k.value}
                      </li>
                    ))}
                    {!availableKeywords.some(k => k.value.toLowerCase().includes(keywordSearch.toLowerCase()) && !selectedKeywords.some(s => s.id === k.id)) && (
                      <li className="px-3 py-2 text-sm text-secondary">Brak wyników</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* category, unit, quantity fields */}
          </div>
          <div>
            <label className="block text-xs text-secondary">Typ pozycji</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'COMPONENT' | 'PRODUCT' })} className="w-full px-4 py-2 rounded-2xl border border-main bg-surface text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="COMPONENT">Komponent</option>
              <option value="PRODUCT">Produkt</option>
            </select>
          </div>

          <div className="text-sm text-secondary">Po zapisaniu przedmiotu zobaczysz podgląd dodanego produktu</div>
        </form>

        <aside className="bg-surface border border-main rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-main">Podgląd produktu</h3>
            <button onClick={() => { setPreview(!preview) }} className="p-1 rounded-md text-secondary hover:bg-surface-hover transition"><X className="w-4 h-4"/></button>
          </div>

          {preview ? (
            <div className="space-y-3">
              <div className="text-xs text-secondary">Nazwa</div>
              <div className="text-main font-medium">{filledPreview.name}</div>

              <div className="text-xs text-secondary">Opis</div>
              <div className="text-secondary text-sm">{filledPreview.description || '-'}</div>

              <div className="text-xs text-secondary">Kategoria</div>
              <div className="text-main">{filledPreview.category?.name ?? '-'}</div>

              <div className="flex gap-4">
                <div>
                  <div className="text-xs text-secondary">Ilość</div>
                  <div className="text-main">{filledPreview.currentQuantity ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-secondary">Jednostka</div>
                  <div className="text-main">{filledPreview.unit}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-secondary">Słowa kluczowe</div>
                <div className="text-main">{selectedKeywords.length ? selectedKeywords.map(k => k.value).join(', ') : '-'}</div>
              </div>

              <div>
                <div className="text-xs text-secondary">Lokacja</div>
                <div className="text-main">{filledPreview.location ? `${filledPreview.location.code} - ${filledPreview.location.name}` : '-'}</div>
              </div>

              {filledPreview.locationOccupancy && (
                <div>
                  <div className="text-xs text-secondary">Obłożenie lokacji</div>
                  <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden mt-2 mb-2">
                    <div
                      className={`h-full transition-all ${filledPreview.locationOccupancy.occupancyPercentage >= 90 ? 'bg-error' : filledPreview.locationOccupancy.occupancyPercentage >= 70 ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${Math.min(filledPreview.locationOccupancy.occupancyPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-main">{filledPreview.locationOccupancy.occupancyPercentage.toFixed(1)}% ({filledPreview.locationOccupancy.currentOccupancy}/{filledPreview.locationOccupancy.maxCapacity})</div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-surface-secondary border border-main flex items-center justify-center text-secondary">
                <Box className="w-6 h-6" />
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default AddComponentsAndProducts
