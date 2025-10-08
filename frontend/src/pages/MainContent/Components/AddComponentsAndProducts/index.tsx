import { type FC, useMemo, useState } from 'react'
import { PlusCircle, Box, X } from 'lucide-react'

type Category = { id?: number | null; name: string }
type ItemForm = {
  name: string
  description?: string
  categoryId?: number | ''
  unit?: string
  currentQuantity?: number | ''
  qrCode?: string
}

const AddComponentsAndProducts: FC = () => {
  // form state (UI only)
  const [form, setForm] = useState<ItemForm>({ name: '', description: '', categoryId: '', unit: '', currentQuantity: '', qrCode: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState(false)

  // placeholder categories — replace with GET /api/categories later
  const categories: Category[] = []

  const validate = (f: ItemForm) => {
    const e: Record<string, string> = {}
    if (!f.name.trim()) e.name = 'Nazwa jest wymagana'
    if (f.currentQuantity !== '' && Number(f.currentQuantity) < 0) e.currentQuantity = 'Ilość nie może być ujemna'
    return e
  }

  const onSave = () => {
    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length === 0) {
      // UI-only: show preview success toast (placeholder)
      setPreview(true)
      // In future: POST /api/items with proper body and auth
    }
  }

  const onClear = () => {
    setForm({ name: '', description: '', categoryId: '', unit: '', currentQuantity: '', qrCode: '' })
    setErrors({})
    setPreview(false)
  }

  const filledPreview = useMemo(() => ({
    id: Math.floor(Math.random() * 100000),
    name: form.name || '—',
    description: form.description || '',
    category: categories.find(c => String(c.id) === String(form.categoryId)) ?? null,
    unit: form.unit || '-',
    currentQuantity: form.currentQuantity === '' ? null : Number(form.currentQuantity),
    qrCode: form.qrCode || '-',
  }), [form, categories])

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Dodaj komponent lub produkt</h1>
          <p className="text-sm text-secondary mt-1">Formularz jest UI-only — pola zgodne z modelem Item: name, description, category, unit, currentQuantity, qrCode.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onSave} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white"><PlusCircle className="w-5 h-5"/>Zapisz</button>
          <button onClick={onClear} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-main text-main bg-white">Wyczyść</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="lg:col-span-2 bg-surface-secondary border border-main rounded-lg p-6 space-y-4" onSubmit={e => { e.preventDefault(); onSave() }}>
          <div>
            <label className="block text-xs text-secondary">Nazwa</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" />
            {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
          </div>

          <div>
            <label className="block text-xs text-secondary">Opis</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-secondary">Kategoria</label>
              <select value={form.categoryId ?? ''} onChange={e => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : '' })} className="w-full px-3 py-2 rounded-2xl border border-main bg-white text-sm text-main">
                <option value="">Wybierz kategorię</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary">Jednostka</label>
              <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
            </div>

            <div>
              <label className="block text-xs text-secondary">Ilość</label>
              <input type="number" value={form.currentQuantity as any} onChange={e => setForm({ ...form, currentQuantity: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
              {errors.currentQuantity && <div className="text-xs text-red-500 mt-1">{errors.currentQuantity}</div>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-secondary">QR Code</label>
            <input value={form.qrCode} onChange={e => setForm({ ...form, qrCode: e.target.value })} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
          </div>

          <div className="text-sm text-secondary">Po kliknięciu Zapisz zobaczysz podgląd (UI-only). W przyszłości formularz wyśle POST /api/items.</div>
        </form>

        <aside className="bg-surface-secondary border border-main rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-main">Podgląd produktu</h3>
            <button onClick={() => { setPreview(!preview) }} className="p-1 rounded-md text-secondary hover:bg-white"><X className="w-4 h-4"/></button>
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

              <div className="text-xs text-secondary">QR</div>
              <div className="text-main">{filledPreview.qrCode}</div>

              <div className="mt-4">
                <button className="px-4 py-2 rounded-full border border-main bg-white">Zapisz produkt</button>
              </div>
            </div>
          ) : (
            <div className="py-12">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-white border border-main flex items-center justify-center text-secondary">
                <Box className="w-6 h-6" />
              </div>
              <div className="text-sm text-secondary">Włącz podgląd, aby zobaczyć jak będzie wyglądać pozycja</div>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default AddComponentsAndProducts
