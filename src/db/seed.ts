import { v4 as uuidv4 } from 'uuid';
import { db } from './database';

const now = Date.now();

const defaultCategories = [
  { name: 'Makanan', icon: '🍔', color: '#F59E0B', type: 'expense' as const },
  { name: 'Transport', icon: '🚗', color: '#3B82F6', type: 'expense' as const },
  { name: 'Belanja', icon: '🛍️', color: '#EC4899', type: 'expense' as const },
  { name: 'Hiburan', icon: '🎬', color: '#8B5CF6', type: 'expense' as const },
  { name: 'Tagihan', icon: '📄', color: '#EF4444', type: 'expense' as const },
  { name: 'Kesehatan', icon: '💊', color: '#10B981', type: 'expense' as const },
  { name: 'Pendidikan', icon: '📚', color: '#6366F1', type: 'expense' as const },
  { name: 'Lainnya', icon: '📦', color: '#6B7280', type: 'expense' as const },
  { name: 'Gaji', icon: '💰', color: '#22C55E', type: 'income' as const },
  { name: 'Freelance', icon: '💻', color: '#14B8A6', type: 'income' as const },
  { name: 'Investasi', icon: '📈', color: '#F97316', type: 'income' as const },
  { name: 'Hadiah', icon: '🎁', color: '#A855F7', type: 'income' as const },
  { name: 'Lain-lain', icon: '✨', color: '#6B7280', type: 'income' as const },
];

const defaultAccounts = [
  { name: 'Cash', icon: '💵', color: '#22C55E' },
  { name: 'Bank', icon: '🏦', color: '#3B82F6' },
  { name: 'E-Wallet', icon: '📱', color: '#8B5CF6' },
];

export async function seedDatabase() {
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    const categories = defaultCategories.map((c) => ({
      id: uuidv4(),
      ...c,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));
    await db.categories.bulkAdd(categories);
  }

  const accountCount = await db.accounts.count();
  if (accountCount === 0) {
    const accounts = defaultAccounts.map((a) => ({
      id: uuidv4(),
      ...a,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));
    await db.accounts.bulkAdd(accounts);

    // Set default account to first one (Cash)
    const firstAccount = await db.accounts.toCollection().first();
    if (firstAccount) {
      await db.meta.put({ key: 'defaultAccountId', value: firstAccount.id });
    }
  }

  // Schema version
  const schemaVersion = await db.meta.get('schemaVersion');
  if (!schemaVersion) {
    await db.meta.put({ key: 'schemaVersion', value: 1 });
  }
}
