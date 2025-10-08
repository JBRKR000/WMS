import { type FC, useMemo, useState } from 'react'
import { Truck, Search, UserPlus, Save, X } from 'lucide-react'

// We'll build the UI using Transaction/Item/User model fields only
type Category = { id?: number | null; name: string }
type Item = { id?: number | null; name: string; currentQuantity?: number; unit?: string }
type User = { id?: number | null; username: string }
type TransactionType = 'RECEIPT' | 'ISSUE_TO_PRODUCTION' | 'ISSUE_TO_SALES' | 'RETURN'

const RegisterIssue: FC = () => {
  // UI-only state
  const [itemId, setItemId] = useState<string>('')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [txType, setTxType] = useState<TransactionType>('ISSUE_TO_PRODUCTION')
  const [userId, setUserId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<any | null>(null)
  const [errors, setErrors] = useState<Record<string,string>>({})

  // placeholder data — replace with API data later
  const items: Item[] = []
  const users: User[] = []

  const itemMap = useMemo(() => new Map(items.map(i => [String(i.id), i])), [items])

  const validate = () => {
    const e: Record<string,string> = {}
    if (!itemId) e.item = 'Wybierz pozycję'
    if (quantity === '' || Number(quantity) <= 0) e.quantity = 'Podaj poprawną ilość'
    if (!userId) e.user = 'Wybierz użytkownika'
    return e
  }

  const onSubmit = () => {
    const e = validate(); setErrors(e)
    if (Object.keys(e).length > 0) return
    const it = itemMap.get(itemId)
    const tx = {
      id: Math.floor(Math.random()*100000),
      transactionDate: new Date().toISOString(),
      transactionType: txType,
      item: it ? { id: it.id, name: it.name } : null,
      quantity: Number(quantity),
      user: users.find(u => String(u.id) === userId) ?? null,
      description
    }
    setPreview(tx)
    // In future: POST /api/transactions
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Rejestracja zgłoszenia</h1>
          <p className="text-sm text-secondary mt-1">Formularz oparty na modelu Transaction — wybierz pozycję, ilość, typ i użytkownika.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onSubmit} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white"><Save className="w-5 h-5"/>Zarejestruj</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="lg:col-span-2 bg-surface-secondary border border-main rounded-lg p-6 space-y-4" onSubmit={e => { e.preventDefault(); onSubmit() }}>
          <div>
            <label className="block text-xs text-secondary">Pozycja</label>
            <div className="flex items-center gap-2">
              <select value={itemId} onChange={e => setItemId(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
                <option value="">Wybierz pozycję</option>
                {items.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
              </select>
              <button type="button" className="px-3 py-2 rounded-2xl border border-main text-sm bg-white"><Search className="w-4 h-4"/></button>
            </div>
            {errors.item && <div className="text-xs text-red-500 mt-1">{errors.item}</div>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-secondary">Ilość</label>
              <input type="number" value={quantity as any} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
              {errors.quantity && <div className="text-xs text-red-500 mt-1">{errors.quantity}</div>}
            </div>

            <div>
              <label className="block text-xs text-secondary">Typ</label>
              <select value={txType} onChange={e => setTxType(e.target.value as TransactionType)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
                <option value="RECEIPT">Przyjęcie</option>
                <option value="ISSUE_TO_PRODUCTION">Wydanie na produkcję</option>
                <option value="ISSUE_TO_SALES">Wydanie na sprzedaż</option>
                <option value="RETURN">Zwrot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary">Użytkownik</label>
              <select value={userId} onChange={e => setUserId(e.target.value)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
                <option value="">Wybierz użytkownika</option>
                {users.map(u => <option key={u.id} value={String(u.id)}>{u.username}</option>)}
              </select>
              {errors.user && <div className="text-xs text-red-500 mt-1">{errors.user}</div>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-secondary">Opis</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>
        </form>

        <aside className="bg-surface-secondary border border-main rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-main">Podgląd zgłoszenia</h3>
            <div className="text-xs text-secondary">Podgląd UI-only</div>
          </div>

          {preview ? (
            <div className="space-y-3 text-sm">
              <div className="text-xs text-secondary">ID</div>
              <div className="text-main">{preview.id}</div>

              <div className="text-xs text-secondary">Data</div>
              <div className="text-secondary text-sm">{new Date(preview.transactionDate).toLocaleString()}</div>

              <div className="text-xs text-secondary">Typ</div>
              <div className="text-main">{preview.transactionType}</div>

              <div className="text-xs text-secondary">Pozycja</div>
              <div className="text-main">{preview.item?.name ?? '-'}</div>

              <div className="text-xs text-secondary">Ilość</div>
              <div className="text-main">{preview.quantity}</div>

              <div className="text-xs text-secondary">Użytkownik</div>
              <div className="text-main">{preview.user?.username ?? '-'}</div>

              <div className="text-xs text-secondary">Opis</div>
              <div className="text-secondary text-sm">{preview.description ?? '-'}</div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-secondary">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-white border border-main flex items-center justify-center text-secondary">
                <Truck className="w-6 h-6" />
              </div>
              <div className="text-xs">Wypełnij formularz po lewej i kliknij Zarejestruj, aby zobaczyć podgląd</div>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default RegisterIssue
