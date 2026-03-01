import { useLiveQuery } from 'dexie-react-hooks';
import { getTodayDate } from '../utils/format';
import { db, type Transaction } from './database';

export interface TransactionFilters {
  month?: string; // YYYY-MM
  type?: 'income' | 'expense';
  categoryId?: string;
  accountId?: string;
  searchNote?: string;
  limit?: number;
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useLiveQuery(async () => {
    let results: Transaction[] = [];

    if (filters.month) {
      const firstDay = `${filters.month}-01`;
      const lastDay = `${filters.month}-31`; // 31 is safe for lexical comparison
      
      // Efficient IndexedDB range query
      results = await db.transactions
        .where('date')
        .between(firstDay, lastDay, true, true)
        .reverse()
        .sortBy('date');
    } else {
      // Fallback if no month
      results = await db.transactions.orderBy('date').reverse().toArray();
    }

    // In-memory filters
    results = results.filter((t) => !t.deletedAt);

    if (filters.type) {
      results = results.filter((t) => t.type === filters.type);
    }
    if (filters.categoryId) {
      results = results.filter((t) => t.categoryId === filters.categoryId);
    }
    if (filters.accountId) {
      results = results.filter((t) => t.accountId === filters.accountId);
    }
    if (filters.searchNote) {
      const query = filters.searchNote.toLowerCase();
      results = results.filter((t) => t.note && t.note.toLowerCase().includes(query));
    }

    // Pagination limit
    if (filters.limit && filters.limit > 0) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }, [filters.month, filters.type, filters.categoryId, filters.accountId, filters.searchNote, filters.limit]);
}

export function useRecentTransactions(limit: number = 5) {
  return useLiveQuery(async () => {
    const results = await db.transactions
      .orderBy('createdAt')
      .reverse()
      .toArray();
    return results.filter((t) => !t.deletedAt).slice(0, limit);
  }, [limit]);
}

export function useCategories(type?: 'income' | 'expense' | 'both') {
  return useLiveQuery(async () => {
    let results = await db.categories.toArray();
    results = results.filter((c) => !c.deletedAt);
    if (type && type !== 'both') {
      results = results.filter((c) => c.type === type || c.type === 'both');
    }
    return results;
  }, [type]);
}

export function useAccounts() {
  return useLiveQuery(async () => {
    const results = await db.accounts.toArray();
    return results.filter((a) => !a.deletedAt);
  });
}

export function useSummary(month: string) {
  return useLiveQuery(async () => {
    const results = await db.transactions.toArray();
    const filtered = results.filter(
      (t) => !t.deletedAt && t.date.startsWith(month)
    );

    const income = filtered
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      net: income - expense,
    };
  }, [month]);
}

export function useTotalBalance() {
  return useLiveQuery(async () => {
    const results = await db.transactions.toArray();
    const valid = results.filter((t) => !t.deletedAt);
    
    const income = valid
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = valid
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return income - expense;
  });
}

export function useTopExpenseCategories(month: string, limit: number = 3) {
  return useLiveQuery(async () => {
    const results = await db.transactions.toArray();
    const expenses = results.filter(
      (t) => !t.deletedAt && t.date.startsWith(month) && t.type === 'expense'
    );

    const categoryTotals: Record<string, number> = {};
    for (const t of expenses) {
      if (!categoryTotals[t.categoryId]) categoryTotals[t.categoryId] = 0;
      categoryTotals[t.categoryId] += t.amount;
    }

    const sortedGroups = Object.keys(categoryTotals)
      .map(categoryId => ({ categoryId, total: categoryTotals[categoryId] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    return sortedGroups;
  }, [month, limit]);
}

export function useMeta(key: string) {
  return useLiveQuery(() => db.meta.get(key), [key]);
}

export async function setMeta(key: string, value: unknown) {
  await db.meta.put({ key, value });
}

export function useTrackingStreak() {
  return useLiveQuery(async () => {
    const transactions = await db.transactions
      .orderBy('date')
      .reverse()
      .toArray();

    const validTransactions = transactions.filter((t) => !t.deletedAt);
    
    if (validTransactions.length === 0) {
      return { currentStreak: 0, isBroken: true };
    }

    // Extract unique dates
    const uniqueDates = Array.from(new Set(validTransactions.map(t => t.date))).sort((a, b) => b.localeCompare(a));

    const todayStr = getTodayDate();
    
    // Get yesterday's date string
    const today = new Date(todayStr + 'T00:00:00');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = 0;
    let expectedDate = '';

    // Check if the streak is active today or was active yesterday
    if (uniqueDates[0] === todayStr) {
      expectedDate = todayStr;
    } else if (uniqueDates[0] === yesterdayStr) {
      expectedDate = yesterdayStr;
    } else {
      // Top date is older than yesterday
      return { currentStreak: 0, isBroken: true };
    }

    // Now count backwards continuously
    for (const dateStr of uniqueDates) {
      if (dateStr === expectedDate) {
        currentStreak++;
        // Calculate the day before `expectedDate`
        const dateObj = new Date(expectedDate + 'T00:00:00');
        dateObj.setDate(dateObj.getDate() - 1);
        expectedDate = dateObj.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    const isBroken = currentStreak === 0 || (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr);

    return { currentStreak, isBroken };
  });
}

// Transaction CRUD
export async function addTransaction(
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'>
) {
  const { v4: uuidv4 } = await import('uuid');
  const now = Date.now();
  await db.transactions.add({
    id: uuidv4(),
    ...data,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'local',
  });
  
  // Save defaults for Quick Add
  await setMeta('lastUsedAccount', data.accountId);
  if (data.type === 'income') {
    await setMeta('lastUsedIncomeCategory', data.categoryId);
  } else {
    await setMeta('lastUsedExpenseCategory', data.categoryId);
  }
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, 'id' | 'createdAt'>>
) {
  await db.transactions.update(id, {
    ...data,
    updatedAt: Date.now(),
    syncStatus: 'dirty',
  });
}

export async function deleteTransaction(id: string) {
  await db.transactions.update(id, {
    deletedAt: Date.now(),
    updatedAt: Date.now(),
    syncStatus: 'dirty',
  });
}

export async function restoreTransaction(id: string) {
  await db.transactions.update(id, {
    deletedAt: null,
    updatedAt: Date.now(),
    syncStatus: 'dirty',
  });
}

// Category CRUD
export async function addCategory(data: {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}) {
  const { v4: uuidv4 } = await import('uuid');
  const now = Date.now();
  await db.categories.add({
    id: uuidv4(),
    ...data,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
}

export async function deleteCategory(id: string) {
  await db.categories.update(id, {
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

// Account CRUD
export async function addAccount(data: {
  name: string;
  icon: string;
  color: string;
}) {
  const { v4: uuidv4 } = await import('uuid');
  const now = Date.now();
  await db.accounts.add({
    id: uuidv4(),
    ...data,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
}

export async function deleteAccount(id: string) {
  await db.accounts.update(id, {
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}
