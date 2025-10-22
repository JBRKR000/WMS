// Podstawowe typy dla systemu WMS
export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
}

export type ItemType = 'COMPONENT' | 'PRODUCT';
export type UnitType = 'PCS' | 'KG' | 'LITER' | 'METER';

export interface Item {
  id: number;
  name: string;
  description?: string;
  categoryName?: string;
  currentQuantity: number;
  unit: UnitType;
  type: ItemType;
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
  keywords?: string[];
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