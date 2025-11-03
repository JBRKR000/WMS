import { fetchApi } from '../utils/api';

export interface Location {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationThreshold {
  id: number;
  locationId: number;
  minThreshold: number;
  maxThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationOccupancy {
  locationId: number;
  locationCode: string;
  locationName: string;
  locationDescription: string;
  maxCapacity: number;
  minThreshold: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  itemCount: number;
  isAboveThreshold: boolean;
  isActive: boolean;
}

export interface InventoryLocation {
  id: number;
  itemId: number;
  locationId: number;
  createdAt: string;
  updatedAt: string;
}

export const LocationService = {
  // Locations
  getAll: () => fetchApi<Location[]>('/locations'),
  
  getById: (id: number) => fetchApi<Location>(`/locations/${id}`),
  
  create: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => 
    fetchApi<Location>('/locations', {
      method: 'POST',
      body: JSON.stringify(location),
    }),
    
  update: (id: number, location: Partial<Location>) =>
    fetchApi<Location>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(location),
    }),
    
  delete: (id: number) =>
    fetchApi<void>(`/locations/${id}`, {
      method: 'DELETE',
    }),

  // Occupancy and Thresholds
  getOccupancy: (locationId: number) =>
    fetchApi<LocationOccupancy>(`/locations/${locationId}/occupancy`),

  getItemCount: (locationId: number) =>
    fetchApi<{ locationId: number; itemCount: number }>(`/locations/${locationId}/item-count`),

  checkCapacity: (locationId: number, itemId: number) =>
    fetchApi<{ locationId: number; itemId: number; canAdd: boolean; message: string }>(
      `/locations/${locationId}/check-capacity?itemId=${itemId}`,
      { method: 'POST' }
    ),

  getTotalQuantity: (locationId: number, itemId: number) =>
    fetchApi<{ locationId: number; itemId: number; totalQuantity: number }>(
      `/locations/${locationId}/item/${itemId}/quantity`
    ),

  isBelowThreshold: (locationId: number, itemId: number) =>
    fetchApi<{ locationId: number; itemId: number; isBelowMinThreshold: boolean; message: string }>(
      `/locations/${locationId}/item/${itemId}/below-threshold`
    ),

  // Inventory Locations
  getItemsInLocation: (locationId: number) =>
    fetchApi<{ locationId: number; items: InventoryLocation[]; count: number }>(
      `/locations/${locationId}/items`
    ),

  addItemToLocation: (locationId: number, itemId: number) =>
    fetchApi<{ success: boolean; message: string; inventoryLocation: InventoryLocation }>(
      `/locations/${locationId}/add-item/${itemId}`,
      { method: 'POST' }
    ),

  removeItemFromLocation: (locationId: number, itemId: number) =>
    fetchApi<{ success: boolean; message: string; locationId: number; itemId: number }>(
      `/locations/${locationId}/remove-item/${itemId}`,
      { method: 'DELETE' }
    ),

  // Thresholds
  getThreshold: (locationId: number) =>
    fetchApi<LocationThreshold>(`/location-thresholds/location/${locationId}`),

  createThreshold: (threshold: Omit<LocationThreshold, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<LocationThreshold>('/location-thresholds', {
      method: 'POST',
      body: JSON.stringify(threshold),
    }),

  updateThreshold: (id: number, threshold: Partial<LocationThreshold>) =>
    fetchApi<LocationThreshold>(`/location-thresholds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(threshold),
    }),
};
