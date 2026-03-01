import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MonthPicker from '../components/MonthPicker';
import TransactionItem from '../components/TransactionItem';
import type { Transaction } from '../db/database';
import { db } from '../db/database';
import { useAccounts, useCategories, useSummary, useTransactions, type TransactionFilters } from '../db/hooks';
import { formatRupiah, getCurrentMonth } from '../utils/format';
import TransactionForm from './TransactionForm';

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [month, setMonth] = useState(getCurrentMonth());
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [accountFilter, setAccountFilter] = useState<string | undefined>(undefined);
  const [searchNote, setSearchNote] = useState('');
  const [debouncedSearchNote, setDebouncedSearchNote] = useState('');
  const [limit, setLimit] = useState(50);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | undefined>(undefined);

  const filters: TransactionFilters = {
    month,
    type: typeFilter,
    categoryId: categoryFilter,
    accountId: accountFilter,
    searchNote: debouncedSearchNote.trim() || undefined,
    limit,
  };

  const transactions = useTransactions(filters);
  const categories = useCategories();
  const accounts = useAccounts();
  const summary = useSummary(month);

  const getCategoryById = (id: string) => categories?.find((c) => c.id === id);
  const getAccountById = (id: string) => accounts?.find((a) => a.id === id);

  // Handle URL params for add/edit
  useEffect(() => {
    const addParam = searchParams.get('add');
    const editId = searchParams.get('edit');
    if (addParam === 'true') {
      setEditTransaction(undefined);
      setShowForm(true);
      setSearchParams({});
    }
    if (editId) {
      db.transactions.get(editId).then((t) => {
        if (t) {
          setEditTransaction(t);
          setShowForm(true);
        }
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Reset limit when filters change
  useEffect(() => {
    setLimit(50);
  }, [month, typeFilter, categoryFilter, accountFilter, searchNote]);

  // Group transactions by date
  const groupedTransactions = transactions
    ? transactions.reduce<Record<string, Transaction[]>>((groups, t) => {
        if (!groups[t.date]) groups[t.date] = [];
        groups[t.date].push(t);
        return groups;
      }, {})
    : {};

  // Debounce Search Note
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchNote(searchNote);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchNote]);

  // Infinite Scroll Observer
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || !transactions || transactions.length < limit) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLimit((prev) => prev + 50);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(loader);

    return () => {
      if (loader) observer.unobserve(loader);
    };
  }, [transactions, limit]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Transaksi</h1>
      </div>

      <MonthPicker month={month} onChange={setMonth} />

      {/* Summary mini */}
      {summary && (
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)',
        }}>
          <div style={{
            flex: 1,
            padding: 'var(--spacing-md)',
            background: 'var(--accent-green-dim)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: '2px' }}>Pemasukan</div>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--accent-green)' }}>{formatRupiah(summary.income)}</div>
          </div>
          <div style={{
            flex: 1,
            padding: 'var(--spacing-md)',
            background: 'var(--accent-red-dim)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: '2px' }}>Pengeluaran</div>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--accent-red)' }}>{formatRupiah(summary.expense)}</div>
          </div>
        </div>
      )}

      {/* Search Note */}
      <div style={{ marginBottom: 'var(--spacing-sm)' }}>
        <input 
          type="text" 
          placeholder=" Cari catatan..." 
          value={searchNote}
          onChange={(e) => setSearchNote(e.target.value)}
          style={{
            width: '100%',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-sm)',
          }}
        />
      </div>

      {/* Filters Dropdowns */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${!typeFilter ? 'active' : ''}`}
          onClick={() => setTypeFilter(undefined)}
        >
          Semua
        </button>
        <button
          className={`filter-chip ${typeFilter === 'income' ? 'active' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'income' ? undefined : 'income')}
        >
          Pemasukan
        </button>
        <button
          className={`filter-chip ${typeFilter === 'expense' ? 'active' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'expense' ? undefined : 'expense')}
        >
          Pengeluaran
        </button>
        <div className="filter-chip">
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || undefined)}
          >
            <option value="">Semua Kategori</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-chip">
          <select
            value={accountFilter || ''}
            onChange={(e) => setAccountFilter(e.target.value || undefined)}
          >
            <option value="">Semua Akun</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List grouped by date */}
      {transactions && transactions.length > 0 ? (
        <>
          {Object.entries(groupedTransactions)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, txns]) => (
              <div className="transaction-date-group" key={date}>
                <div className="date-label">{
                  (() => {
                    const d = new Date(date + 'T00:00:00');
                    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
                  })()
                }</div>
                <div className="transaction-list">
                  {txns.map((t) => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      category={getCategoryById(t.categoryId)}
                      account={getAccountById(t.accountId)}
                      onClick={() => {
                        setEditTransaction(t);
                        setShowForm(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            
          {/* Infinite Scroll Loader Target */}
          {transactions.length >= limit && (
            <div ref={loaderRef} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Memuat lebih banyak...
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Tidak ada transaksi yang sesuai kriteria.</p>
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => { setEditTransaction(undefined); setShowForm(true); }}>
        +
      </button>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={editTransaction}
          onClose={() => { setShowForm(false); setEditTransaction(undefined); }}
        />
      )}
    </div>
  );
}
