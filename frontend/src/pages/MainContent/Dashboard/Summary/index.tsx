import { type FC } from 'react'

// Types mirroring backend models
type Category = {
  id: number | null
  name: string
  description?: string | null
}

type Role = {
  id: number | null
  roleName: string
}

type User = {
  id: number | null
  username: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role?: Role | null
}

type Item = {
  id: number | null
  name: string
  description?: string | null
  category?: Category | null
  unit?: string | null
  currentQuantity: number
  qrCode?: string | null
  createdAt?: string | null // ISO
  updatedAt?: string | null // ISO
}

type Transaction = {
  id: number | null
  transactionDate?: string | null // ISO with timezone
  transactionType: string // enum stored as string
  item?: Item | null
  quantity: number
  user?: User | null
  description?: string | null
}

const EmptyState: FC<{ label?: string }> = ({ label = 'Brak danych' }) => (
  <div className="text-sm text-secondary py-6 text-center">{label}</div>
)

const SummaryPage: FC = () => {
  const categories: Category[] = []
  const items: Item[] = []
  const users: User[] = []
  const transactions: Transaction[] = []

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-main">Podsumowanie magazynu</h2>
          <p className="text-sm text-secondary mt-1">Widok odzwierciedlający struktury bazy danych (items, categories, users, transactions)</p>
        </div>
        
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
          <p className="text-sm text-secondary">Liczba kategorii</p>
          <p className="text-2xl font-bold text-main mt-1">{categories.length}</p>
        </div>
        <div className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
          <p className="text-sm text-secondary">Liczba pozycji (items)</p>
          <p className="text-2xl font-bold text-main mt-1">{items.length}</p>
        </div>
        <div className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
          <p className="text-sm text-secondary">Liczba użytkowników</p>
          <p className="text-2xl font-bold text-main mt-1">{users.length}</p>
        </div>
        <div className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
          <p className="text-sm text-secondary">Liczba transakcji</p>
          <p className="text-2xl font-bold text-main mt-1">{transactions.length}</p>
        </div>
      </section>
      <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-main">Items (pozycje magazynowe)</h3>
          <p className="text-sm text-secondary">Pola: id, name, currentQuantity, unit, qrCode, createdAt, updatedAt, category</p>
        </div>

        {items.length === 0 ? (
          <EmptyState label="Brak pozycji w bazie" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Nazwa</th>
                  <th className="px-3 py-2">Kategoria</th>
                  <th className="px-3 py-2">Ilość</th>
                  <th className="px-3 py-2">Jednostka</th>
                  <th className="px-3 py-2">QR</th>
                  <th className="px-3 py-2">Utworzono</th>
                  <th className="px-3 py-2">Zaktualizowano</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id ?? Math.random()} className="border-t border-main">
                    <td className="px-3 py-2 text-secondary">{it.id}</td>
                    <td className="px-3 py-2 text-main">{it.name}</td>
                    <td className="px-3 py-2 text-secondary">{it.category?.name ?? '-'}</td>
                    <td className="px-3 py-2 text-main">{it.currentQuantity}</td>
                    <td className="px-3 py-2 text-secondary">{it.unit ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary">{it.qrCode ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary">{it.createdAt ?? '-'}</td>
                    <td className="px-3 py-2 text-secondary">{it.updatedAt ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-main">Transactions</h3>
            <p className="text-sm text-secondary">Pola: id, transactionDate, transactionType, item, quantity, user, description</p>
          </div>

          {transactions.length === 0 ? (
            <EmptyState label="Brak transakcji w bazie" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Typ</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Ilość</th>
                    <th className="px-3 py-2">Użytkownik</th>
                    <th className="px-3 py-2">Opis</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id ?? Math.random()} className="border-t border-main">
                      <td className="px-3 py-2 text-secondary">{t.id}</td>
                      <td className="px-3 py-2 text-secondary">{t.transactionDate ?? '-'}</td>
                      <td className="px-3 py-2 text-main">{t.transactionType}</td>
                      <td className="px-3 py-2 text-secondary">{t.item?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-main">{t.quantity}</td>
                      <td className="px-3 py-2 text-secondary">{t.user?.username ?? '-'}</td>
                      <td className="px-3 py-2 text-secondary">{t.description ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-main mb-3">Categories</h3>
            {categories.length === 0 ? (
              <EmptyState label="Brak kategorii w bazie" />
            ) : (
              <ul className="space-y-2">
                {categories.map(c => (
                  <li key={c.id ?? Math.random()} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-main">{c.name}</p>
                      <p className="text-xs text-secondary">{c.description ?? '-'}</p>
                    </div>
                    <div className="text-sm text-secondary">ID: {c.id}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-surface-secondary border border-main rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-main mb-3">Users</h3>
            {users.length === 0 ? (
              <EmptyState label="Brak użytkowników w bazie" />
            ) : (
              <ul className="space-y-2">
                {users.map(u => (
                  <li key={u.id ?? Math.random()} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-main">{u.username} <span className="text-xs text-secondary">({u.email})</span></p>
                      <p className="text-xs text-secondary">{u.firstName ?? ''} {u.lastName ?? ''}</p>
                    </div>
                    <div className="text-sm text-secondary">Rola: {u.role?.roleName ?? '-'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default SummaryPage
