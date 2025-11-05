import { fetchApi } from '../utils/api';

export interface OrderLine {
  id?: number;
  itemId: number;
  quantity: number;
  itemName?: string;
  itemCategory?: string;
  unit?: string;
  transactionId?: number;
}

export interface OrderDTO {
  id?: number;
  orderNumber?: string;
  orderStatus?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdBy?: string;
  description?: string;
  itemCount?: number;
  totalQuantity?: number;
  orderLines?: OrderLine[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderStatusHistory {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  changedBy: string;
  changeReason: string;
  createdAt: string;
}

export const OrderService = {
  /**
   * Tworzy nowe zamówienie
   */
  create: (order: Omit<OrderDTO, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<OrderDTO>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }),

  /**
   * Pobiera zamówienie po ID
   */
  getById: (id: number) =>
    fetchApi<OrderDTO>(`/orders/${id}`),

  /**
   * Pobiera zamówienie po numerze
   */
  getByNumber: (orderNumber: string) =>
    fetchApi<OrderDTO>(`/orders/number/${orderNumber}`),

  /**
   * Pobiera wszystkie zamówienia z paginacją
   */
  getAll: (page: number = 0, size: number = 10) =>
    fetchApi<{
      content: OrderDTO[];
      totalElements: number;
      totalPages: number;
      currentPage: number;
    }>(`/orders?page=${page}&size=${size}`),

  /**
   * Filtruje zamówienia po statusie
   */
  getByStatus: (status: 'PENDING' | 'COMPLETED' | 'CANCELLED', page: number = 0, size: number = 10) =>
    fetchApi<{
      content: OrderDTO[];
      totalElements: number;
      totalPages: number;
    }>(`/orders/status/${status}?page=${page}&size=${size}`),

  /**
   * Filtruje zamówienia po użytkowniku
   */
  getByUser: (userId: number, page: number = 0, size: number = 10) =>
    fetchApi<{
      content: OrderDTO[];
      totalElements: number;
      totalPages: number;
    }>(`/orders/user/${userId}?page=${page}&size=${size}`),

  /**
   * Zmienia status zamówienia
   */
  updateStatus: (id: number, status: 'PENDING' | 'COMPLETED' | 'CANCELLED', reason?: string) =>
    fetchApi<OrderDTO>(`/orders/${id}/status?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`, {
      method: 'PATCH',
    }),

  /**
   * Pobiera historię zmian statusu
   */
  getStatusHistory: (orderId: number) =>
    fetchApi<OrderStatusHistory[]>(`/orders/${orderId}/history`),

  /**
   * Usuwa zamówienie
   */
  delete: (id: number) =>
    fetchApi<void>(`/orders/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Pobiera liczbę wszystkich zamówień
   */
  getCount: () =>
    fetchApi<number>(`/orders/count`),
};
