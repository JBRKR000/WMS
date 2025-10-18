import { type Transaction } from '../types';
import { fetchApi } from '../utils/api';

export interface TransactionForOrder {
  id: number | null;
  transactionDate: string | null;
  transactionType: string;
  itemId: number | null;
  itemName: string | null;
  quantity: number;
  userId: number | null;
  userName: string | null;
  description: string | null;
  categoryName: string | null;
  transactionStatus: string | null;
}

export const TransactionService = {
  getAll: () => fetchApi<Transaction[]>('/transactions'),
  
  getById: (id: number) => fetchApi<Transaction>(`/transactions/${id}`),
  
  create: (transaction: Omit<Transaction, 'id' | 'transactionDate'>) => 
    fetchApi<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    }),
    
  update: (id: number, transaction: Partial<Transaction>) =>
    fetchApi<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    }),
    
  delete: (id: number) =>
    fetchApi<void>(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  getOrderTransactions: () => fetchApi<TransactionForOrder[]>('/transactions/orders'),
};
