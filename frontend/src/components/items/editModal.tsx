import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// Type for fetched keywords
type KeywordDTO = { id: number; value: string }

// Type for locations with occupancy
type LocationDTO = {
  id: number
  code: string
  name: string
  unitType: 'PCS' | 'KG' | 'LITER' | 'METER'
}

type LocationOccupancyDTO = {
  locationId: number
  locationCode: string
  locationName: string
  maxCapacity: number
  currentOccupancy: number
  occupancyPercentage: number
}

export interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: number
    name: string
    description?: string | null
    categoryName?: string | null
    unit?: string | null
    currentQuantity?: number
    threshold?: number
    qrCode?: string | null
    keywords?: string[]
    itemType?: string | null
  }
  onSubmit: () => void
}

const EditItemModal: FC<EditItemModalProps> = ({ isOpen, onClose, item, onSubmit }) => {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description ?? '')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [unit, setUnit] = useState(item.unit ?? '')
  const [currentQuantity, setCurrentQuantity] = useState(item.currentQuantity ?? 0)
  const [originalQuantity, setOriginalQuantity] = useState(item.currentQuantity ?? 0)
  const [qrCode, setQrCode] = useState(item.qrCode ?? '')
  const [availableKeywords, setAvailableKeywords] = useState<KeywordDTO[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<KeywordDTO[]>([])
  const [keywordSearch, setKeywordSearch] = useState<string>('')
  const [confirmSave, setConfirmSave] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [currentLocationId, setCurrentLocationId] = useState<number | null>(null)
  const [locations, setLocations] = useState<LocationDTO[]>([])
  const [locationsOccupancy, setLocationsOccupancy] = useState<Map<number, LocationOccupancyDTO>>(new Map())
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName(item.name)
      setDescription(item.description ?? '')
      setUnit(item.unit ?? '')
      setCurrentQuantity(item.currentQuantity ?? 0)
      setOriginalQuantity(item.currentQuantity ?? 0)
      setQrCode(item.qrCode ?? '')
      setKeywordSearch('')
      setConfirmSave(false)
      setError(null)
      setLocationError(null)
      setSelectedLocationId(null)
      ;(async () => {
        try {
          const authToken = localStorage.getItem('authToken')
          const resCat = await fetch('/api/categories', { headers: { Authorization: `Bearer ${authToken}` } })
          if (!resCat.ok) throw new Error('Failed to load categories')
          const dataCat = await resCat.json()
          setCategories(dataCat)
          
          // Find category ID by name
          const foundCategory = dataCat.find((c: any) => c.name === item.categoryName)
          setCategoryId(foundCategory?.id ?? null)

          const resItemKw = await fetch(`/api/keywords/byItemId/${item.id}`, { headers: { Authorization: `Bearer ${authToken}` } })
          if (!resItemKw.ok) throw new Error('Failed to load item keywords')
          const itemKwDTO: KeywordDTO[] = await resItemKw.json()
          setSelectedKeywords(itemKwDTO)
          
          const resAllKw = await fetch('/api/keywords', { headers: { Authorization: `Bearer ${authToken}` } })
          if (!resAllKw.ok) throw new Error('Failed to load all keywords')
          const allKwDTO: KeywordDTO[] = await resAllKw.json()
          setAvailableKeywords(allKwDTO)

          // Load locations
          const resLoc = await fetch('/api/locations', { headers: { Authorization: `Bearer ${authToken}` } })
          if (!resLoc.ok) throw new Error('Failed to load locations')
          const locationsData: LocationDTO[] = await resLoc.json()
          setLocations(locationsData)

          // Load occupancy for each location
          const occupancyMap = new Map<number, LocationOccupancyDTO>()
          await Promise.all(
            locationsData.map(async (loc) => {
              try {
                const resOccupancy = await fetch(`/api/locations/${loc.id}/occupancy`, {
                  headers: { Authorization: `Bearer ${authToken}` }
                })
                if (resOccupancy.ok) {
                  const occupancyData: LocationOccupancyDTO = await resOccupancy.json()
                  occupancyMap.set(loc.id, occupancyData)
                }
              } catch (err) {
                console.warn(`Failed to load occupancy for location ${loc.id}:`, err)
              }
            })
          )
          setLocationsOccupancy(occupancyMap)

          // Load current location for this item by checking all locations
          try {
            for (const loc of locationsData) {
              try {
                const resItemLocs = await fetch(`/api/locations/${loc.id}/items`, { 
                  headers: { Authorization: `Bearer ${authToken}` } 
                })
                if (resItemLocs.ok) {
                  const itemLocsData = await resItemLocs.json()
                  // itemLocsData.items is an array of InventoryLocation objects
                  const itemLoc = itemLocsData.items?.find((il: any) => il.itemId === item.id || il.item?.id === item.id)
                  if (itemLoc) {
                    const locId = itemLoc.locationId || itemLoc.location?.id
                    if (locId) {
                      setCurrentLocationId(locId)
                      setSelectedLocationId(locId)
                      console.log(`Found current location ${locId} for item ${item.id}`)
                      break
                    }
                  }
                }
              } catch (err) {
                console.warn(`Failed to check location ${loc.id}:`, err)
              }
            }
          } catch (err) {
            console.warn('Failed to load current location:', err)
          }
        } catch (err) {
          console.error('Error loading categories or keywords:', err)
          setError('Błąd podczas ładowania danych')
        }
      })()
    }
  }, [isOpen, item])

  const handleLocationChange = (locationId: string) => {
    if (!locationId) {
      setSelectedLocationId(null)
      setLocationError(null)
      return
    }

    const locId = Number(locationId)
    const selectedLocation = locations.find(l => l.id === locId)

    if (!selectedLocation) {
      setLocationError('Lokacja nie znaleziona')
      setSelectedLocationId(null)
      return
    }

    // Validate unit type
    if (selectedLocation.unitType !== unit) {
      setLocationError(`Jednostka lokacji (${selectedLocation.unitType}) nie zgadza się z jednostką itemu (${unit})`)
      setSelectedLocationId(null)
      return
    }

    // Validate location capacity
    const occupancy = locationsOccupancy.get(locId)
    if (occupancy) {
      // If item is already in this location, we need to account for it
      // Calculate available capacity: max - (current - old quantity of this item if it's already there)
      const isItemAlreadyInLocation = currentLocationId === locId
      const spaceUsedByThisItem = isItemAlreadyInLocation ? originalQuantity : 0
      const otherItemsOccupancy = occupancy.currentOccupancy - spaceUsedByThisItem
      const availableCapacity = occupancy.maxCapacity - otherItemsOccupancy
      
      if (currentQuantity > availableCapacity) {
        setLocationError(`Brak wystarczającej pojemności: dostępne ${availableCapacity} ${unit}, a potrzebujesz ${currentQuantity}`)
        setSelectedLocationId(null)
        return
      }
    }

    setSelectedLocationId(locId)
    setLocationError(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const authToken = localStorage.getItem('authToken')
      
      // Update item details (name, description, category, unit, keywords) - but NOT quantity
      const requestBody: any = {
        name,
        description: description || null,
        unit, // Send unit as string (backend will convert)
        currentQuantity: originalQuantity, // Keep original quantity, don't update it
        keywords: selectedKeywords.map(k => ({ value: k.value }))
      }
      
      // Only add category if selected
      if (categoryId) {
        requestBody.category = { id: categoryId }
      }

      console.log('Sending PUT request:', { url: `/api/items/${item.id}`, body: requestBody })

      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('PUT response:', response.status, response.statusText, response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Błąd podczas aktualizacji pozycji')
      }

      // Handle location change using LocationService
      // Distinguish between "adding location" (currentLocationId is null) and "changing location"
      if (selectedLocationId && selectedLocationId !== currentLocationId) {
        try {
          // Get user ID for transaction
          let userId: number = 1
          try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
              const user = JSON.parse(userStr)
              if (user.id) userId = user.id
            }
          } catch (e) {
            console.warn('Could not parse user from localStorage, using default user ID')
          }

          // CASE 1: Item HAD a previous location - need to remove from old and add to new
          if (currentLocationId) {
            console.log(`Changing item ${item.id} location from ${currentLocationId} to ${selectedLocationId}`)
            
            // Create ISSUE transaction for old location (reduces occupancy)
            const issueResponse = await fetch('/api/transactions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
              },
              body: JSON.stringify({
                transactionType: 'ISSUE_TO_SALES',
                item: { id: item.id },
                location: { id: currentLocationId },
                user: { id: userId },
                quantity: originalQuantity,
                description: `Przeniesienie na lokację ${selectedLocationId}`,
                transactionStatus: 'COMPLETED'
              })
            })

            if (!issueResponse.ok) {
              const errorData = await issueResponse.json().catch(() => ({}))
              throw new Error(errorData.message || 'Błąd podczas tworzenia transakcji wyjścia')
            }

            console.log(`ISSUE transaction created for item ${item.id} at old location ${currentLocationId}`)

            // Remove the item from old location
            await fetch(`/api/locations/${currentLocationId}/remove-item/${item.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${authToken}` }
            })

            // Add item to new location
            const addResponse = await fetch(`/api/locations/${selectedLocationId}/add-item/${item.id}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${authToken}` }
            })

            if (!addResponse.ok) {
              const errorData = await addResponse.json().catch(() => ({}))
              throw new Error(errorData.error || 'Błąd podczas przypisywania lokacji')
            }

            console.log(`Item ${item.id} added to location ${selectedLocationId}`)

            // Create RECEIPT transaction for the new location (to record the move in transaction history)
            const transactionResponse = await fetch('/api/transactions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
              },
              body: JSON.stringify({
                transactionType: 'RECEIPT',
                item: { id: item.id },
                location: { id: selectedLocationId },
                user: { id: userId },
                quantity: currentQuantity,
                description: `Przeniesienie z lokacji ${currentLocationId}`,
                transactionStatus: 'COMPLETED'
              })
            })

            if (!transactionResponse.ok) {
              const errorData = await transactionResponse.json().catch(() => ({}))
              throw new Error(errorData.message || 'Błąd podczas tworzenia transakcji')
            }

            console.log(`RECEIPT transaction created for item ${item.id} at location ${selectedLocationId}`)
          } else {
            // CASE 2: Item has NO previous location - just add the location
            // Obłożenie będzie liczone z item.currentQuantity, nie z transakcji
            console.log(`Adding first location ${selectedLocationId} for item ${item.id} (currentQuantity=${currentQuantity})`)
            
            // Add item to location (just the relationship)
            const addResponse = await fetch(`/api/locations/${selectedLocationId}/add-item/${item.id}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${authToken}` }
            })

            if (!addResponse.ok) {
              const errorData = await addResponse.json().catch(() => ({}))
              throw new Error(errorData.error || 'Błąd podczas przypisywania lokacji')
            }

            console.log(`Item ${item.id} added to location ${selectedLocationId}`)
            // Obłożenie będzie teraz liczyć się z item.currentQuantity
          }
          
          // Pobierz zaktualizowane obłożenie nowej lokacji (TERAZ zawiera nową transakcję)
          try {
            const occupancyResponse = await fetch(`/api/locations/${selectedLocationId}/occupancy`, {
              headers: { Authorization: `Bearer ${authToken}` }
            })
            if (occupancyResponse.ok) {
              const updatedOccupancy = await occupancyResponse.json()
              const newMap = new Map(locationsOccupancy)
              newMap.set(selectedLocationId, updatedOccupancy)
              setLocationsOccupancy(newMap)
              console.log(`Updated occupancy for location ${selectedLocationId}:`, updatedOccupancy)
            }
          } catch (occErr) {
            console.warn('Failed to update occupancy after location change:', occErr)
          }
          
          // Pobierz RÓWNIEŻ zaktualizowane obłożenie starej lokacji jeśli była
          if (currentLocationId && currentLocationId !== selectedLocationId) {
            try {
              const oldOccupancyResponse = await fetch(`/api/locations/${currentLocationId}/occupancy`, {
                headers: { Authorization: `Bearer ${authToken}` }
              })
              if (oldOccupancyResponse.ok) {
                const oldUpdatedOccupancy = await oldOccupancyResponse.json()
                const newMap = new Map(locationsOccupancy)
                newMap.set(currentLocationId, oldUpdatedOccupancy)
                setLocationsOccupancy(newMap)
                console.log(`Updated occupancy for old location ${currentLocationId}:`, oldUpdatedOccupancy)
              }
            } catch (occErr) {
              console.warn('Failed to update occupancy for old location:', occErr)
            }
          }
        } catch (locErr) {
          console.error('Error managing item location:', locErr)
          throw new Error(locErr instanceof Error ? locErr.message : 'Błąd podczas przypisywania lokacji')
        }
      }
      
      // Jeśli zmienisz ilość BEZ zmiany lokacji, utwórz transakcję
      // WAŻNE: Transakcja MUSI zawierać lokację!
      const locationChanged = selectedLocationId && selectedLocationId !== currentLocationId
      if (currentQuantity !== originalQuantity && !locationChanged) {
        // Jeśli nie mamy wybranej lokacji i zmieniamy ilość, to błąd
        if (!currentLocationId) {
          setError('Nie można zmienić ilości bez przypisanej lokacji')
          setLoading(false)
          return
        }

        const quantityDifference = currentQuantity - originalQuantity
        
        console.log('Creating transaction:', {
          originalQuantity,
          currentQuantity,
          quantityDifference,
          itemId: item.id,
          locationId: currentLocationId
        })
        
        // Get current user info from auth token or localStorage
        let userId: number = 1 // Default fallback user ID
        try {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            const user = JSON.parse(userStr)
            if (user.id) userId = user.id
          }
        } catch (e) {
          console.warn('Could not parse user from localStorage, using default user ID')
        }

        // Create transaction for quantity change - MUSI zawierać locationId!
        const transactionResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            transactionType: quantityDifference > 0 ? 'RECEIPT' : 'ISSUE_TO_SALES',
            item: { id: item.id },
            location: { id: currentLocationId }, // DODANE: Lokacja do transakcji!
            user: { id: userId },
            quantity: Math.abs(quantityDifference),
            description: `Modyfikacja zasobu - zmiana ilości z ${originalQuantity} na ${currentQuantity}`,
            transactionStatus: 'COMPLETED'
          })
        })

        console.log('Transaction response:', transactionResponse.status, transactionResponse.ok)

        if (!transactionResponse.ok) {
          const errorData = await transactionResponse.json().catch(() => ({}))
          throw new Error(errorData.message || 'Błąd podczas tworzenia transakcji')
        }

        // Pobierz zaktualizowane obłożenie lokacji po transakcji
        try {
          const occupancyResponse = await fetch(`/api/locations/${currentLocationId}/occupancy`, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
          if (occupancyResponse.ok) {
            const updatedOccupancy = await occupancyResponse.json()
            const newMap = new Map(locationsOccupancy)
            newMap.set(currentLocationId, updatedOccupancy)
            setLocationsOccupancy(newMap)
            console.log(`Updated occupancy for location ${currentLocationId}:`, updatedOccupancy)
          }
        } catch (occErr) {
          console.warn('Failed to update occupancy after quantity change:', occErr)
        }
      }

      onSubmit()
      onClose()
    } catch (err) {
      console.error('Error updating item:', err)
      setError(err instanceof Error ? err.message : 'Nieznany błąd')
    } finally {
      setLoading(false)
      setConfirmSave(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="w-full max-w-2xl border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="p-6 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">Edytuj pozycję</h3>
            <div style={{ color: 'var(--color-surface)', opacity: 0.8 }} className="text-sm mt-1">ID: {item.id}</div>
          </div>
          <button 
            onClick={onClose} 
            style={{ color: 'var(--color-surface)', opacity: 0.6 }}
            className="hover:opacity-100 hover:bg-white/10 rounded-lg p-2 transition-all"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div style={{ backgroundColor: 'var(--color-surface)' }} className="p-6 max-h-96 overflow-y-auto space-y-4">
          {error && (
            <div style={{ backgroundColor: 'var(--color-error-bg)', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} className="p-3 border rounded-lg text-sm">
              {error}
            </div>
          )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Nazwa</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Opis</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              rows={3}
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Kategoria</label>
            <select
              value={categoryId ?? ''}
              onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            >
              <option value="">Wybierz kategorię</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Jednostka</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                disabled={loading}
              >
                <option value="">Wybierz jednostkę</option>
                <option value="PCS">sztuki</option>
                <option value="KG">kilogramy</option>
                <option value="LITER">litry</option>
                <option value="METER">metry</option>
              </select>
            </div>
            <div>
              <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Ilość</label>
              <input
                type="number"
                value={currentQuantity}
                onChange={e => {
                  const newValue = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                  setCurrentQuantity(newValue)
                  
                  // Re-validate location capacity if location is selected
                  if (selectedLocationId) {
                    const occupancy = locationsOccupancy.get(selectedLocationId)
                    if (occupancy) {
                      // Account for this item's old quantity if it's already in the selected location
                      const isItemAlreadyInLocation = currentLocationId === selectedLocationId
                      const spaceUsedByThisItem = isItemAlreadyInLocation ? originalQuantity : 0
                      const otherItemsOccupancy = occupancy.currentOccupancy - spaceUsedByThisItem
                      const availableCapacity = occupancy.maxCapacity - otherItemsOccupancy
                      
                      if (newValue > availableCapacity) {
                        setLocationError(`Brak wystarczającej pojemności: dostępne ${availableCapacity} ${unit}, a potrzebujesz ${newValue}`)
                      } else {
                        setLocationError(null)
                      }
                    }
                  }
                }}
                style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  color: 'var(--color-text)',
                  borderColor: locationError ? 'var(--color-error)' : 'var(--color-border)'
                }}
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                disabled={loading}
              />
              {currentQuantity !== originalQuantity && !locationError && (
                <div style={{ color: 'var(--color-accent)' }} className="text-xs mt-2 font-semibold">
                  ℹ Zmiana o {currentQuantity - originalQuantity} — transakcja zostanie utworzona w systemie
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Kod QR</label>
            <input
              type="text"
              value={qrCode}
              disabled
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
                opacity: 0.6
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Lokacja przechowywania</label>
            <select
              value={selectedLocationId ?? ''}
              onChange={e => handleLocationChange(e.target.value)}
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text)',
                borderColor: locationError ? 'var(--color-error)' : 'var(--color-border)'
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            >
              <option value="">Brak przypisanej lokacji</option>
              {locations.map(loc => {
                const occupancy = locationsOccupancy.get(loc.id)
                const occupancyText = occupancy 
                  ? ` (${Math.round(occupancy.currentOccupancy)}/${Math.round(occupancy.maxCapacity)})` 
                  : ''
                const unitMismatch = loc.unitType !== unit
                return (
                  <option 
                    key={loc.id} 
                    value={loc.id}
                    disabled={unitMismatch}
                    style={{
                      color: unitMismatch ? '#999' : 'inherit'
                    }}
                  >
                    {loc.code} - {loc.name}{occupancyText}
                    {unitMismatch ? ` (${loc.unitType} ≠ ${unit})` : ''}
                  </option>
                )
              })}
            </select>
            {locationError && (
              <div style={{ color: 'var(--color-error)' }} className="text-xs mt-2 font-semibold">
                ⚠ {locationError}
              </div>
            )}
            {selectedLocationId && locationsOccupancy.has(selectedLocationId) && (
              <div style={{ color: 'var(--color-accent)' }} className="text-xs mt-2 font-semibold">
                ℹ Obłożenie: {Math.round(locationsOccupancy.get(selectedLocationId)!.currentOccupancy)}/{Math.round(locationsOccupancy.get(selectedLocationId)!.maxCapacity)} ({Math.round(locationsOccupancy.get(selectedLocationId)!.occupancyPercentage)}%)
              </div>
            )}
          </div>
          <div>
            <label style={{ color: 'var(--color-text-secondary)' }} className="block text-sm font-semibold mb-2">Słowa kluczowe</label>
            <div className="flex flex-wrap gap-2 items-center">
              {selectedKeywords.map(k => (
                <div key={k.id} style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }} className="flex items-center px-3 py-1 rounded-full text-sm">
                  {k.value}
                  <button 
                    type="button"
                    onClick={() => setSelectedKeywords(prev => prev.filter(x => x.id !== k.id))} 
                    style={{ color: 'var(--color-surface)', opacity: 0.8 }}
                    className="ml-1 hover:opacity-100"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="relative flex-1 min-w-fit">
                <input
                  type="text"
                  value={keywordSearch}
                  onChange={e => setKeywordSearch(e.target.value)}
                  placeholder="Wyszukaj słowo kluczowe"
                  style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)'
                  }}
                  className="px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-full"
                  disabled={loading}
                />
                {keywordSearch && (
                  <ul style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} className="absolute z-10 border rounded-lg mt-1 max-h-40 overflow-auto w-full shadow-lg">
                    {availableKeywords.filter(k => k.value.toLowerCase().includes(keywordSearch.toLowerCase()) && !selectedKeywords.some(s => s.id === k.id)).map(k => (
                      <li 
                        key={k.id} 
                        onClick={() => { 
                          setSelectedKeywords(prev => [...prev, k]); 
                          setKeywordSearch('') 
                        }} 
                        className="px-3 py-2 hover:opacity-80 cursor-pointer text-sm transition-opacity"
                      >
                        {k.value}
                      </li>
                    ))}
                    {!availableKeywords.some(k => k.value.toLowerCase().includes(keywordSearch.toLowerCase()) && !selectedKeywords.some(s => s.id === k.id)) && (
                      <li style={{ color: 'var(--color-text-secondary)' }} className="px-3 py-2 text-sm">Brak wyników</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
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
            className="px-4 py-2 rounded-lg border font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            disabled={loading}
          >
            Anuluj
          </button>
          <button
            onClick={() => confirmSave ? handleSubmit() : setConfirmSave(true)}
            disabled={loading || !!locationError}
            title={locationError ? `Popraw błąd: ${locationError}` : ''}
            style={{
              backgroundColor: confirmSave ? 'var(--color-success)' : 'var(--color-primary)',
              color: 'var(--color-surface)'
            }}
            className="px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            {confirmSave ? (loading ? 'Zapisywanie...' : 'Potwierdź zapis') : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditItemModal
