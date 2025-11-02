import type { FC } from 'react'
import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateCategoryOrKeywordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { type: 'category' | 'keyword'; name: string; description?: string }) => void
  categories: { id: number; name: string }[] // Lista istniejących kategorii
}

const CreateCategoryOrKeywordModal: FC<CreateCategoryOrKeywordModalProps> = ({ isOpen, onClose, onSubmit, categories }) => {
  const [type, setType] = useState<'category' | 'keyword'>('category')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="w-full max-w-2xl border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="p-6 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">
              {type === 'category' ? 'Utwórz kategorię' : 'Dodaj słowo kluczowe'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ color: 'var(--color-surface)', opacity: 0.6 }}
            className="hover:opacity-100 hover:bg-white/10 rounded-lg p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div style={{ backgroundColor: 'var(--color-surface)' }} className="p-6 max-h-96 overflow-y-auto space-y-4">
          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Typ</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setType('category')}
                style={{
                  backgroundColor: type === 'category' ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                  color: type === 'category' ? 'var(--color-surface)' : 'var(--color-text-secondary)',
                  borderColor: 'var(--color-border)'
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${type === 'category' ? '' : 'hover:opacity-80'}`}
              >
                Kategoria
              </button>
              <button
                onClick={() => setType('keyword')}
                style={{
                  backgroundColor: type === 'keyword' ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                  color: type === 'keyword' ? 'var(--color-surface)' : 'var(--color-text-secondary)',
                  borderColor: 'var(--color-border)'
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${type === 'keyword' ? '' : 'hover:opacity-80'}`}
              >
                Słowo kluczowe
              </button>
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">
              {type === 'category' ? 'Nazwa kategorii' : 'Słowo kluczowe'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'category' ? 'Wprowadź nazwę kategorii' : 'Wprowadź słowo kluczowe'}
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {type === 'category' && (
            <div>
              <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Opis</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Wprowadź opis kategorii"
                style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)'
            }}
            className="px-4 py-2 rounded-lg border font-medium hover:opacity-80 transition-opacity"
          >
            Anuluj
          </button>
          <button
            onClick={() => {
              onSubmit({ type, name, description: type === 'category' ? description : undefined })
              setName('')
              setDescription('')
              onClose()
            }}
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }}
            className="px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateCategoryOrKeywordModal