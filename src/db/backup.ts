import { db } from './database';
import { setMeta } from './hooks';

export async function exportData(): Promise<void> {
  const transactions = await db.transactions.toArray();
  const categories = await db.categories.toArray();
  const accounts = await db.accounts.toArray();
  const meta = await db.meta.toArray();

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    categories,
    accounts,
    meta,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budget-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  await setMeta('lastBackupTime', Date.now());
}

export async function importData(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.transactions || !data.categories || !data.accounts) {
      return { success: false, message: 'Format file tidak valid.' };
    }

    // Clear existing data and replace
    await db.transaction('rw', [db.transactions, db.categories, db.accounts, db.meta], async () => {
      await db.transactions.clear();
      await db.categories.clear();
      await db.accounts.clear();
      await db.meta.clear();

      if (data.transactions.length > 0) {
        await db.transactions.bulkAdd(data.transactions);
      }
      if (data.categories.length > 0) {
        await db.categories.bulkAdd(data.categories);
      }
      if (data.accounts.length > 0) {
        await db.accounts.bulkAdd(data.accounts);
      }
      if (data.meta && data.meta.length > 0) {
        await db.meta.bulkAdd(data.meta);
      }
    });

    return { success: true, message: `Data berhasil dipulihkan! (${data.transactions.length} transaksi)` };
  } catch (err) {
    console.error('Import error:', err);
    return { success: false, message: 'Gagal membaca file. Pastikan format JSON valid.' };
  }
}

export async function resetAllData(): Promise<void> {
  await db.transaction('rw', [db.transactions, db.categories, db.accounts, db.meta], async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.accounts.clear();
    await db.meta.clear();
  });
}
