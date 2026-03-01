import type { Account, Category, Transaction } from '../db/database';
import { formatDateRelative, formatRupiah } from '../utils/format';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  onClick?: () => void;
}

export default function TransactionItem({ transaction, category, account, onClick }: TransactionItemProps) {
  const isExpense = transaction.type === 'expense';

  return (
    <div className="transaction-item" onClick={onClick}>
      <div
        className="cat-icon"
        style={{
          background: category?.color ? `${category.color}20` : 'var(--bg-surface)',
        }}
      >
        {category?.icon || '📦'}
      </div>
      <div className="info">
        <div className="category-name">
          {category?.name || 'Tidak diketahui'}
        </div>
        <div className="meta">
          <span>{account?.name || '—'}</span>
          <span>•</span>
          <span>{formatDateRelative(transaction.date)}</span>
          {transaction.note && (
            <>
              <span>•</span>
              <span>{transaction.note}</span>
            </>
          )}
        </div>
      </div>
      <div className="amount-col">
        <div className={`amount ${transaction.type}`}>
          {isExpense ? '-' : '+'}{formatRupiah(transaction.amount)}
        </div>
      </div>
    </div>
  );
}
