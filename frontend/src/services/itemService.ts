import { type Item } from '../types';
import { fetchApi } from '../utils/api';

export const ItemService = {
  getAll: () => fetchApi<Item[]>('/items'),
  
  getById: (id: number) => fetchApi<Item>(`/items/${id}`),
  
  create: (item: Omit<Item, 'id'>) => 
    fetchApi<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
    
  update: (id: number, item: Partial<Item>) =>
    fetchApi<Item>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
    
  delete: (id: number) =>
    fetchApi<void>(`/items/${id}`, {
      method: 'DELETE',
    }),
};