import { type FC, useMemo, useState } from 'react'
import { PlusCircle, Trash2, Eye, Save, X } from 'lucide-react'

// No Order model in backend — build UI using Item model fields only
type Item = { id?: number | null; name: string; unit?: string; currentQuantity?: number }

type OrderLine = { id: string; itemId?: string; qty?: number | '' }

const CreateOrder: FC = () => {
  const [customer, setCustomer] = useState('')
  const [notes, setNotes] = useState('')
  const [contact, setContact] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [status, setStatus] = useState<'draft' | 'pending' | 'confirmed'>('draft')
  const [deliveryStreet, setDeliveryStreet] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryPostal, setDeliveryPostal] = useState('')
  const [deliveryCountry, setDeliveryCountry] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([])
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [previewOpen, setPreviewOpen] = useState(false)

  // placeholder items - replace with GET /api/items
  const items: Item[] = []

  const addLine = () => setLines(l => [...l, { id: String(Date.now()), itemId: '', qty: 1 }])
  const removeLine = (id: string) => setLines(l => l.filter(x => x.id !== id))
  const updateLine = (id: string, patch: Partial<OrderLine>) => setLines(l => l.map(x => x.id === id ? { ...x, ...patch } : x))

  const validate = () => {
    const e: Record<string,string> = {}
    if (!customer.trim()) e.customer = 'Podaj odbiorcę'
    if (lines.length === 0) e.lines = 'Dodaj przynajmniej jedną pozycję'
    lines.forEach((ln, idx) => {
      if (!ln.itemId) e[`line-${idx}`] = 'Wybierz pozycję'
      if (!ln.qty || Number(ln.qty) <= 0) e[`line-qty-${idx}`] = 'Podaj poprawną ilość'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const subtotal = useMemo(() => lines.reduce((s, ln) => s + (Number(ln.qty) || 0), 0), [lines])

  const onCreate = () => {
    if (!validate()) return
    setPreviewOpen(true)
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Tworzenie zamówienia</h1>
          <p className="text-sm text-secondary mt-1">Skomponuj zamówienie z dostępnych pozycji. UI-only — pola oparte na modelu Item.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white"><Save className="w-5 h-5"/>Podgląd</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="lg:col-span-2 bg-surface-secondary border border-main rounded-lg p-6 space-y-4" onSubmit={e => { e.preventDefault(); onCreate() }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary">Odbiorca</label>
              <input value={customer} onChange={e => setCustomer(e.target.value)} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
              {errors.customer && <div className="text-xs text-red-500 mt-1">{errors.customer}</div>}
            </div>
            <div>
              <label className="block text-xs text-secondary">Kontakt (email / tel.)</label>
              <input value={contact} onChange={e => setContact(e.target.value)} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary">Ulica i numer</label>
              <input value={deliveryStreet} onChange={e => setDeliveryStreet(e.target.value)} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
            </div>
            <div>
              <label className="block text-xs text-secondary">Miasto</label>
              <input value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
            </div>
            <div>
              <label className="block text-xs text-secondary">Kod pocztowy</label>
              <input value={deliveryPostal} onChange={e => setDeliveryPostal(e.target.value)} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
            </div>
            <div>
              <label className="block text-xs text-secondary">Kraj</label>
              <input value={deliveryCountry} onChange={e => setDeliveryCountry(e.target.value)} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-main">Pozycje zamówienia</h3>
              <button type="button" onClick={addLine} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-main bg-white text-sm"><PlusCircle className="w-4 h-4"/>Dodaj pozycję</button>
            </div>

            {errors.lines && <div className="text-xs text-red-500">{errors.lines}</div>}

            <div className="space-y-3">
              {lines.map((ln, idx) => (
                <div key={ln.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-main">
                  <select value={ln.itemId} onChange={e => updateLine(ln.id, { itemId: e.target.value })} className="flex-1 px-3 py-2 rounded-2xl border border-main text-sm">
                    <option value="">Wybierz pozycję</option>
                    {items.map(it => <option key={it.id} value={String(it.id)}>{it.name}</option>)}
                  </select>
                  <input type="number" value={ln.qty ?? ''} onChange={e => updateLine(ln.id, { qty: e.target.value === '' ? '' : Number(e.target.value) })} className="w-28 px-3 py-2 rounded-2xl border border-main text-sm" />
                  <button type="button" onClick={() => removeLine(ln.id)} className="px-3 py-2 rounded-full border border-main text-red-600 bg-white"><Trash2 className="w-4 h-4"/></button>
                  <div className="text-xs text-secondary">{errors[`line-${idx}`] ?? ''}{errors[`line-qty-${idx}`] ?? ''}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-secondary">Data dostawy</label>
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
            </div>
            <div>
              <label className="block text-xs text-secondary">Priorytet</label>
              <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
                <option value="low">Niski</option>
                <option value="normal">Normalny</option>
                <option value="high">Wysoki</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
                <option value="draft">Szkic</option>
                <option value="pending">Oczekuje</option>
                <option value="confirmed">Potwierdzone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-secondary">Notatki</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-2xl border border-main bg-white text-main text-sm" />
          </div>
        </form>

        <aside className="bg-surface-secondary border border-main rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-main">Podsumowanie</h3>
            <div className="text-xs text-secondary">Szybki przegląd</div>
          </div>

          <div className="text-sm text-secondary mb-2">Numer zamówienia: <span className="font-semibold text-main">ORD-{String(Date.now()).slice(-6)}</span></div>
          <div className="text-sm text-secondary">Pozycje: <span className="font-semibold text-main">{lines.length}</span></div>
          <div className="text-sm text-secondary">Razem sztuk: <span className="font-semibold text-main">{subtotal}</span></div>
          <div className="text-sm text-secondary">Data dostawy: <span className="font-semibold text-main">{deliveryDate || '-'}</span></div>
          <div className="text-sm text-secondary">Adres dostawy: <span className="font-semibold text-main">{deliveryStreet || '-'}, {deliveryCity || '-'} {deliveryPostal || ''}, {deliveryCountry || ''}</span></div>
          <div className="text-sm text-secondary">Priorytet: <span className="font-semibold text-main">{priority}</span></div>
          <div className="text-sm text-secondary">Status: <span className="font-semibold text-main">{status}</span></div>

          <div className="mt-4">
            <button onClick={() => setPreviewOpen(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-main text-main"><Eye className="w-4 h-4"/>Podgląd zamówienia</button>
          </div>
        </aside>
      </div>

      {/* Order preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 border border-main rounded-lg p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-main">Podgląd zamówienia</h3>
            <div className="text-xs text-secondary">Odbiorca: {customer || '-'}</div>
            <div className="text-xs text-secondary">Kontakt: {contact || '-'}</div>
            <div className="text-xs text-secondary">Status: {status}</div>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-2 rounded-md text-secondary"><X className="w-5 h-5"/></button>
            </div>

            <div className="mt-4 text-sm text-secondary">
              <div className="mb-3">Notatki: {notes || '-'}</div>
              <div className="mb-3">Data dostawy: {deliveryDate || '-'}</div>
              <div className="mb-3">Adres dostawy: {deliveryStreet ? `${deliveryStreet}, ${deliveryCity} ${deliveryPostal}, ${deliveryCountry}` : '-'}</div>
              <div className="mb-3">Priorytet: {priority}</div>
              <div className="border-t border-main pt-3">
                {lines.length === 0 ? (
                  <div className="text-sm text-secondary">Brak pozycji</div>
                ) : (
                  <ul className="space-y-2">
                    {lines.map((ln, idx) => {
                      const it = items.find(i => String(i.id) === ln.itemId)
                      return (
                        <li key={ln.id} className="flex items-center justify-between">
                          <div>
                            <div className="text-main font-medium">{it?.name ?? '—'}</div>
                            <div className="text-xs text-secondary">{ln.qty ?? '-'} {it?.unit ?? ''}</div>
                          </div>
                          <div className="text-xs text-secondary">#{idx + 1}</div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPreviewOpen(false)} className="px-4 py-2 rounded-full border border-main text-main bg-white">Zamknij</button>
              <button onClick={() => { setPreviewOpen(false); alert('UI-only: zamówienie utworzone (lokalnie)') }} className="px-4 py-2 rounded-full bg-emerald-500 text-white">Utwórz zamówienie</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default CreateOrder
