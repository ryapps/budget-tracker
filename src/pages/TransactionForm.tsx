import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import type { Transaction } from '../db/database';
import { addTransaction, deleteTransaction, restoreTransaction, updateTransaction, useAccounts, useCategories, useMeta } from '../db/hooks';
import { formatRupiah, getTodayDate } from '../utils/format';

interface TransactionFormProps {
  transaction?: Transaction;
  onClose: () => void;
}

export default function TransactionForm({ transaction, onClose }: TransactionFormProps) {
  const isEdit = !!transaction;
  const categories = useCategories();
  const accounts = useAccounts();
  const defaultAccountMeta = useMeta('defaultAccountId');

  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [date, setDate] = useState(transaction?.date || getTodayDate());
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
  const [accountId, setAccountId] = useState(transaction?.accountId || '');
  const [note, setNote] = useState(transaction?.note || '');



  // Set default account on load
  useEffect(() => {
    if (!isEdit && !accountId && defaultAccountMeta?.value) {
      setAccountId(defaultAccountMeta.value as string);
    }
  }, [defaultAccountMeta, isEdit, accountId]);

  // Set default category when type changes
  useEffect(() => {
    if (!isEdit && categories) {
      const filteredCats = categories.filter((c) => c.type === type || c.type === 'both');
      if (filteredCats.length > 0 && !filteredCats.find((c) => c.id === categoryId)) {
        setCategoryId(filteredCats[0].id);
      }
    }
  }, [type, categories, isEdit, categoryId]);

  const filteredCategories = categories?.filter((c) => c.type === type || c.type === 'both') || [];

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setAmount(numericValue);
  };

  const displayAmount = amount ? formatRupiah(parseInt(amount, 10) || 0) : '';

  const handleSubmit = async () => {
    const amountNum = parseInt(amount, 10) || 0;
    if (amountNum <= 0) {
      toast('Masukkan jumlah yang valid', 'error');
      return;
    }
    if (!categoryId) {
      toast('Pilih kategori', 'error');
      return;
    }
    if (!accountId) {
      toast('Pilih akun', 'error');
      return;
    }

    try {
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, {
          type,
          date,
          amount: amountNum,
          categoryId,
          accountId,
          note: note || undefined,
        });
        toast('Transaksi berhasil diupdate');
      } else {
        await addTransaction({
          type,
          date,
          amount: amountNum,
          categoryId,
          accountId,
          note: note || undefined,
        });
        toast('Transaksi berhasil ditambahkan');
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan transaksi', 'error');
    }
  };

  const handleDelete = async () => {
    if (transaction) {
      onClose(); // Close immediately for snappy UX
      await deleteTransaction(transaction.id);
      toast('Transaksi dihapus', 'success', {
        label: 'Undo',
        onClick: async () => {
          await restoreTransaction(transaction.id);
          toast('Transaksi dipulihkan');
        }
      });
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
    >
      {/* Type Toggle */}
      <div className="form-group">
        <label>Tipe</label>
        <div className="type-toggle">
          <button
            className={type === 'expense' ? 'active-expense' : ''}
            onClick={() => setType('expense')}
          >
            Pengeluaran
          </button>
          <button
            className={type === 'income' ? 'active-income' : ''}
            onClick={() => setType('income')}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="form-group">
        <label>Jumlah (Rp)</label>
        <input
          className="form-input"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={displayAmount}
          onChange={(e) => handleAmountChange(e.target.value)}
          style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 700,
            textAlign: 'center',
            color: type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)',
          }}
        />
      </div>

      {/* Date */}
      <div className="form-group">
        <label>Tanggal</label>
        <input
          className="form-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Category */}
      <div className="form-group">
        <label>Kategori</label>
        <select
          className="form-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Pilih Kategori</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Account */}
      <div className="form-group">
        <label>Akun</label>
        <select
          className="form-select"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="">Pilih Akun</option>
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div className="form-group">
        <label>Catatan (opsional)</label>
        <input
          className="form-input"
          type="text"
          placeholder="Tambahkan catatan..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
        <button className="btn-primary" onClick={handleSubmit}>
          {isEdit ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </button>
        {isEdit && (
          <button className="btn-danger" onClick={handleDelete}>
            Hapus Transaksi
          </button>
        )}
      </div>
    </Modal>
  );
}
