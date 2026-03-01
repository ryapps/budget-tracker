import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstallPrompt from '../components/InstallPrompt';
import MonthPicker from '../components/MonthPicker';
import SummaryCard from '../components/SummaryCard';
import TransactionItem from '../components/TransactionItem';
import {
  addTransaction,
  useAccounts,
  useCategories,
  useMeta,
  useRecentTransactions,
  useSummary,
  useTopExpenseCategories,
  useTrackingStreak,
} from '../db/hooks';
import { formatRupiah, getCurrentMonth, getTodayDate } from '../utils/format';

export default function Dashboard() {
  const [month, setMonth] = useState(getCurrentMonth());
  const navigate = useNavigate();
  const summary = useSummary(month);
  const streakData = useTrackingStreak();
  const topExpenses = useTopExpenseCategories(month, 3);
  const recentTransactions = useRecentTransactions(5);
  const categories = useCategories();
  const accounts = useAccounts();

  const lastUsedAccountMeta = useMeta('lastUsedAccount');
  const lastUsedIncomeCatMeta = useMeta('lastUsedIncomeCategory');
  const lastUsedExpenseCatMeta = useMeta('lastUsedExpenseCategory');

  // Quick Add State
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'income' | 'expense'>('expense');
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  const getCategoryById = (id: string) => categories?.find((c) => c.id === id);
  const getAccountById = (id: string) => accounts?.find((a) => a.id === id);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount || !categories || !accounts) return;

    const amountNum = parseInt(quickAmount.replace(/\D/g, ''), 10);
    if (!amountNum) return;

    let defaultCategoryId = '';
    if (quickType === 'income' && lastUsedIncomeCatMeta?.value) {
      defaultCategoryId = lastUsedIncomeCatMeta.value as string;
    } else if (quickType === 'expense' && lastUsedExpenseCatMeta?.value) {
      defaultCategoryId = lastUsedExpenseCatMeta.value as string;
    }

    if (!defaultCategoryId || !categories.find(c => c.id === defaultCategoryId)) {
      const fallback = categories.find(c => c.type === quickType || c.type === 'both');
      if (fallback) defaultCategoryId = fallback.id;
    }

    let defaultAccountId = '';
    if (lastUsedAccountMeta?.value && accounts.find(a => a.id === lastUsedAccountMeta.value)) {
      defaultAccountId = lastUsedAccountMeta.value as string;
    } else if (accounts.length > 0) {
      defaultAccountId = accounts[0].id;
    }

    if (!defaultCategoryId || !defaultAccountId) {
      alert('Kategori atau akun belum tersedia!');
      return;
    }

    await addTransaction({
      amount: amountNum,
      type: quickType,
      categoryId: defaultCategoryId,
      accountId: defaultAccountId,
      date: getTodayDate(),
      note: 'Quick Add',
    });

    setQuickAmount('');
    amountInputRef.current?.focus();
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 'var(--spacing-md)' }}>
        <h1>Dashboard</h1>
        <div style={{
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--accent-green-dim)',
          color: 'var(--accent-green)',
          fontSize: 'var(--font-xs)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M8 12l3 3 5-5" />
          </svg>
          Offline
        </div>
      </div>

      <InstallPrompt />

      {/* Tracking Streak */}
      {streakData && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)',
          padding: '0 4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', fontWeight: 600, color: streakData.currentStreak > 0 ? 'var(--accent-orange, #f97316)' : 'var(--text-secondary)' }}>
            <span>🔥</span>
            <span>{streakData.currentStreak} Day Streak</span>
          </div>
          {(streakData.isBroken || streakData.currentStreak === 0) && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Yuk, catat transaksimu hari ini!
            </span>
          )}
        </div>
      )}

      <MonthPicker month={month} onChange={setMonth} />

      {summary && (
        <>
          <SummaryCard
            income={summary.income}
            expense={summary.expense}
            net={summary.net}
          />
          <div className="card" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)', marginTop: '-8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Cash Flow ({month})</span>
            </div>
            <div style={{ 
              display: 'flex', 
              height: '14px', 
              borderRadius: 'var(--radius-pill)', 
              overflow: 'hidden', 
              background: 'var(--bg-surface)' 
            }}>
              {summary.income > 0 && (
                <div style={{ 
                  width: `${(summary.income / (summary.income + summary.expense)) * 100}%`, 
                  background: 'var(--gradient-income)',
                  transition: 'width var(--transition-base)'
                }}></div>
              )}
              {summary.expense > 0 && (
                <div style={{ 
                  width: `${(summary.expense / (summary.income + summary.expense)) * 100}%`, 
                  background: 'var(--gradient-expense)',
                  transition: 'width var(--transition-base)'
                }}></div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
              <span style={{ color: 'var(--accent-green)' }}>
                {summary.income + summary.expense > 0 ? Math.round((summary.income / (summary.income + summary.expense)) * 100) : 0}% In
              </span>
              <span style={{ color: 'var(--accent-red)' }}>
                {summary.income + summary.expense > 0 ? Math.round((summary.expense / (summary.income + summary.expense)) * 100) : 0}% Out
              </span>
            </div>
          </div>
        </>
      )}

      {/* Quick Add Form */}
      <div className="card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
        <div style={{ marginBottom: 'var(--spacing-md)', fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          Quick Add ({quickType === 'expense' ? 'Pengeluaran' : 'Pemasukan'})
        </div>
        <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button 
            type="button"
            onClick={() => setQuickType(quickType === 'expense' ? 'income' : 'expense')}
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--radius-md)', 
              background: quickType === 'expense' ? 'var(--accent-red-dim)' : 'var(--accent-green-dim)',
              color: quickType === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {quickType === 'expense' ? '−' : '+'}
          </button>
          <input 
            ref={amountInputRef}
            type="text" 
            inputMode="numeric"
            placeholder="Rp 0" 
            value={quickAmount ? formatRupiah(parseInt(quickAmount.replace(/\D/g, ''), 10) || 0) : ''}
            onChange={(e) => setQuickAmount(e.target.value.replace(/\D/g, ''))}
            style={{ 
              flex: 1, 
              minWidth: 0,
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '0 var(--spacing-md)',
              color: quickType === 'income' ? 'var(--accent-green)' : 'var(--accent-red)',
              fontSize: 'var(--font-lg)',
              fontWeight: 700,
              textAlign: 'center'
            }}
          />
          <button 
            type="submit"
            disabled={!quickAmount}
            style={{
              padding: '0 var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              fontWeight: 600,
              opacity: quickAmount ? 1 : 0.5,
              transition: 'all var(--transition-fast)'
            }}
          >
            Simpan
          </button>
        </form>
      </div>

      {/* Top 3 Expenses array */}
      {topExpenses && topExpenses.length > 0 && summary && summary.expense > 0 && (
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div className="section-header">
            <h2>Top Pengeluaran ({month})</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {topExpenses.map((expense) => {
              const cat = getCategoryById(expense.categoryId);
              if (!cat) return null;
              
              const percentage = Math.round((expense.total / summary.expense) * 100);
              const displayPercentage = isNaN(percentage) ? 0 : percentage;

              return (
                <div key={expense.categoryId} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <div className="cat-icon" style={{ 
                        width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', 
                        background: cat.color + '20', color: cat.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                      }}>
                        {cat.icon}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 'var(--font-sm)' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-red)', fontSize: 'var(--font-sm)' }}>
                        {formatRupiah(expense.total)}
                      </span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                        {displayPercentage}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Mini Progress Bar */}
                  <div style={{ 
                    width: '100%', 
                    height: '4px', 
                    background: 'var(--bg-surface)', 
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${displayPercentage}%`,
                      height: '100%',
                      background: cat.color || 'var(--accent-red)',
                      borderRadius: 'var(--radius-pill)',
                      transition: 'width var(--transition-base)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="section-header">
        <h2>Transaksi Terbaru</h2>
        <span className="see-all" onClick={() => navigate('/transactions')}>Lihat Semua</span>
      </div>

      <div className="transaction-list">
        {recentTransactions && recentTransactions.length > 0 ? (
          recentTransactions.map((t) => (
            <div key={t.id} style={{ pointerEvents: 'none' }}>
              <TransactionItem
                transaction={t}
                category={getCategoryById(t.categoryId)}
                account={getAccountById(t.accountId)}
                onClick={() => {}}
              />
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>Belum ada transaksi.</p>
          </div>
        )}
      </div>

    </div>
  );
}
