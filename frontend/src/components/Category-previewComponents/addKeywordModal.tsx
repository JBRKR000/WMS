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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-main">
            {type === 'category' ? 'Utwórz kategorię' : 'Dodaj słowo kluczowe'}
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-secondary mb-2">Typ</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setType('category')}
              className={`px-4 py-2 rounded-lg text-sm ${
                type === 'category' ? 'bg-primary text-white' : 'bg-surface-secondary border border-main text-secondary'
              }`}
            >
              Kategoria
            </button>
            <button
              onClick={() => setType('keyword')}
              className={`px-4 py-2 rounded-lg text-sm ${
                type === 'keyword' ? 'bg-primary text-white' : 'bg-surface-secondary border border-main text-secondary'
              }`}
            >
              Słowo kluczowe
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-secondary mb-2">
            {type === 'category' ? 'Nazwa kategorii' : 'Słowo kluczowe'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'category' ? 'Wprowadź nazwę kategorii' : 'Wprowadź słowo kluczowe'}
            className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary-hover"
          />
        </div>

        {type === 'category' && (
          <div className="mb-4">
            <label className="block text-sm text-secondary mb-2">Opis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wprowadź opis kategorii"
              className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary-hover"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-secondary border border-main rounded-lg text-sm text-secondary hover:bg-surface-hover"
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
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateCategoryOrKeywordModal