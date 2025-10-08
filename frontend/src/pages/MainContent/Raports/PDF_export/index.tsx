import { type FC, useMemo, useState } from 'react'
import { Download, Eye } from 'lucide-react'

type Item = { id?: number | null; name: string }
type User = { id?: number | null; username: string }
type Transaction = { id?: number | null; transactionDate?: string | null; transactionType: string; item?: Item | null; quantity: number; user?: User | null }

const sample: Transaction[] = [
  { id: 4001, transactionDate: new Date().toISOString(), transactionType: 'RECEIPT', item: { id: 1, name: 'Płytka PCB' }, quantity: 120, user: { id: 5, username: 'mag1' } },
  { id: 4002, transactionDate: new Date(Date.now() - 1000*60*60*24).toISOString(), transactionType: 'ISSUE_TO_SALES', item: { id: 2, name: 'Kabel HDMI' }, quantity: 50, user: { id: 8, username: 'log1' } },
]

const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : '-'

const PDFExport: FC = () => {
  const [template, setTemplate] = useState<'summary'|'detailed'|'labels'>('summary')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [preview, setPreview] = useState<Transaction[] | null>(null)

  const transactions = sample

  const filtered = useMemo(() => {
    const fromD = from ? new Date(from) : null
    const toD = to ? new Date(to) : null
    if (toD) toD.setHours(23,59,59,999)
    return transactions.filter(t => {
      if (!t.transactionDate) return false
      const d = new Date(t.transactionDate)
      if (fromD && d < fromD) return false
      if (toD && d > toD) return false
      return true
    })
  }, [transactions, from, to])

  const buildPreview = () => setPreview(filtered)

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">Eksport PDF (prostsza wersja)</h1>
          <p className="text-sm text-secondary mt-1">Prosty kreator raportu: wybierz szablon i zakres dat, kliknij Podgląd, a następnie Eksport.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => alert('Eksport (UI-only)')} className="px-3 py-2 rounded-full border border-main bg-white inline-flex items-center gap-2"><Download className="w-4 h-4"/>Eksportuj</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Szablon</div>
          <div className="mt-3">
            <select value={template} onChange={e => setTemplate(e.target.value as any)} className="w-full px-3 py-2 rounded-2xl border border-main text-sm">
              <option value="summary">Podsumowanie</option>
              <option value="detailed">Szczegółowy</option>
              <option value="labels">Etykiety</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Zakres dat</div>
          <div className="mt-3 flex gap-2">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-1/2 px-3 py-2 rounded-2xl border border-main text-sm" />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-1/2 px-3 py-2 rounded-2xl border border-main text-sm" />
          </div>
          <div className="mt-3">
            <button onClick={buildPreview} className="px-3 py-2 rounded-full border border-main bg-white inline-flex items-center gap-2"><Eye className="w-4 h-4"/>Podgląd</button>
          </div>
        </div>

        <div className="bg-white border border-main rounded-lg p-4">
          <div className="text-xs text-secondary">Informacje</div>
          <div className="mt-3 text-sm text-secondary">Po kliknięciu Podgląd zobaczysz prostą listę transakcji dla wybranego zakresu. Export wykonuje się po stronie klienta (UI-only).</div>
        </div>
      </div>

      <section className="bg-surface-secondary border border-main rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-main">Podgląd raportu</h3>
          <div className="text-sm text-secondary">Szablon: {template}</div>
        </div>

        {!preview ? (
          <div className="p-8 text-center text-secondary">Brak podglądu. Ustaw zakres dat i kliknij Podgląd.</div>
        ) : preview.length === 0 ? (
          <div className="p-8 text-center text-secondary">Brak danych dla wybranego zakresu</div>
        ) : (
          <div className="space-y-2">
            {preview.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white border border-main rounded p-2">
                <div className="text-sm text-main">#{p.id} • {p.item?.name}</div>
                <div className="text-xs text-secondary">{formatDate(p.transactionDate)} • {p.quantity} szt.</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default PDFExport
