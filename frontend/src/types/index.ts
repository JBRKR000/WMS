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

export interface Transaction {
  id: number;
  type: 'IN' | 'OUT';
  itemId: number;
  quantity: number;
  timestamp: Date;
  userId: number;
}