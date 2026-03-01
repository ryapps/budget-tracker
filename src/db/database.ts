import Dexie, { type Table } from 'dexie';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  amount: number; // integer, Rupiah
  categoryId: string;
  accountId: string;
  note?: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt?: number | null;
  syncStatus?: 'local' | 'synced' | 'dirty';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface Meta {
  key: string;
  value: unknown;
}

export interface OutboxItem {
  id: string; // uuid
  entityType: 'transaction' | 'category' | 'account';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
}

export class BudgetTrackerDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  accounts!: Table<Account>;
  meta!: Table<Meta>;
  outbox!: Table<OutboxItem>;

  constructor() {
    super('BudgetTrackerDB');
    this.version(2).stores({
      transactions: 'id, date, type, categoryId, accountId, createdAt, updatedAt, deletedAt, syncStatus',
      categories: 'id, name, type, deletedAt',
      accounts: 'id, name, deletedAt',
      meta: 'key',
    });
  }
}

export const db = new BudgetTrackerDB();
