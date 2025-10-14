import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { X, Trash2, Edit3 } from 'lucide-react'

interface EditKeywordModalProps {
  isOpen: boolean
  onClose: () => void
  keyword: { id: number; value: string }
  onSubmit: (data: { id: number; value: string }) => void
  onDelete: (id: number) => void
}

const EditKeywordModal: FC<EditKeywordModalProps> = ({ isOpen, onClose, keyword, onSubmit, onDelete }) => {
  const [value, setValue] = useState(keyword.value)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setValue(keyword.value)
      setConfirmDelete(false)
      setConfirmSave(false)
    }
  }, [isOpen, keyword])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-main">Edytuj słowo kluczowe</h3>
          <button onClick={onClose} className="text-secondary hover:text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-secondary mb-2">Słowo kluczowe</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2 border border-main rounded-lg text-sm text-main placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary-hover"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-secondary border border-main rounded-lg text-sm text-secondary hover:bg-surface-hover"
          >
            Anuluj
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => (confirmSave
                ? onSubmit({ id: keyword.id, value: value.toLowerCase() })
                : setConfirmSave(true)
              )}
              className={
                `rounded-lg text-sm text-white transition-all duration-300 ease-in-out transform hover:scale-105 overflow-hidden ` +
                (confirmSave
                  ? 'w-52 px-4 py-2 bg-emerald-700 hover:bg-emerald-800'
                  : 'w-10 px-2 py-2 bg-primary hover:bg-primary-hover')
              }
            >
              <div className="relative flex items-center justify-center h-full">
                <span className={`transition-opacity duration-200 ${confirmSave ? 'opacity-0' : 'opacity-100'}`}>
                  <Edit3 className="w-4 h-4" />
                </span>
                <span className={`absolute transition-opacity duration-200 ${confirmSave ? 'opacity-100' : 'opacity-0'}`}>Potwierdź edycję</span>
              </div>
            </button>
            <button
              onClick={() => (confirmDelete ? onDelete(keyword.id) : setConfirmDelete(true))}
              className={
                `rounded-lg text-sm text-white transition-all duration-300 ease-in-out transform hover:scale-105 overflow-hidden ` +
                (confirmDelete
                  ? 'w-52 px-4 py-2 bg-red-700 hover:bg-red-800'
                  : 'w-10 px-2 py-2 bg-red-500 hover:bg-red-600')
              }
            >
              <div className="relative flex items-center justify-center h-full">
                <span className={`transition-opacity duration-200 ${confirmDelete ? 'opacity-0' : 'opacity-100'}`}>
                  <Trash2 className="w-4 h-4" />
                </span>
                <span className={`absolute transition-opacity duration-200 ${confirmDelete ? 'opacity-100' : 'opacity-0'}`}>Potwierdź usunięcie</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditKeywordModal
