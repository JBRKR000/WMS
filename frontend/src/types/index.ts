// Podstawowe typy dla systemu WMS
export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Item {
  id: number;
  name: string;
  quantity: number;
  category: string;
  type: 'COMPONENT' | 'PRODUCT';
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export type TransactionType = 'RECEIPT' | 'ISSUE_TO_PRODUCTION' | 'ISSUE_TO_SALES' | 'ORDER' | 'RETURN';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Transaction {
  id?: number;
  transactionDate?: Date;
  transactionType: TransactionType;
  itemId: number;
  quantity: number;
  userId?: number;
  transactionStatus: TransactionStatus;
  description?: string;
}