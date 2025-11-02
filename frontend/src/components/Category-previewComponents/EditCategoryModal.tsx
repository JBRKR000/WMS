import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: { id: number; name: string; description?: string | null }
  onSubmit: (data: { id: number; name: string; description?: string }) => void
  onDelete: (id: number) => void
}

const EditCategoryModal: FC<EditCategoryModalProps> = ({ isOpen, onClose, category, onSubmit, onDelete }) => {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(category.name)
      setDescription(category.description ?? '')
      setConfirmSave(false)
    }
  }, [isOpen, category])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="w-full max-w-2xl border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="p-6 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">Edytuj kategorię</h3>
            <div style={{ color: 'var(--color-surface)', opacity: 0.8 }} className="text-sm mt-1">ID: {category.id}</div>
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
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Nazwa kategorii</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Opis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }} className="border-t px-6 py-4 flex justify-between gap-3">
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => (confirmSave ? onSubmit({ id: category.id, name, description }) : setConfirmSave(true))}
              style={{
                backgroundColor: confirmSave ? 'var(--color-success)' : 'var(--color-primary)',
                color: 'var(--color-surface)'
              }}
              className={`px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all ${confirmSave ? 'w-auto' : ''}`}
            >
              {confirmSave ? 'Potwierdź edycję' : 'Zapisz'}
            </button>
            <button
              onClick={() => (confirmDelete ? onDelete(category.id) : setConfirmDelete(true))}
              style={{
                backgroundColor: confirmDelete ? 'var(--color-error)' : 'var(--color-error-bg)',
                color: confirmDelete ? 'white' : 'var(--color-error)'
              }}
              className={`px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all`}
            >
              {confirmDelete ? 'Potwierdź usunięcie' : 'Usuń'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditCategoryModal
