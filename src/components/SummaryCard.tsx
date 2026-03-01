import { formatRupiah } from '../utils/format';

interface SummaryCardProps {
  income: number;
  expense: number;
  net: number;
}

export default function SummaryCard({ income, expense, net }: SummaryCardProps) {
  return (
    <div className="summary-card">
      <div className="label">Total Saldo</div>
      <div className="total">{formatRupiah(net)}</div>
      <div className="summary-row">
        <div className="summary-item">
          <div className="summary-icon income">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 11 12 6 7 11" />
              <line x1="12" y1="6" x2="12" y2="18" />
            </svg>
          </div>
          <div>
            <div className="type-label">Pemasukan</div>
            <div className="amount" style={{ color: 'var(--accent-green)' }}>{formatRupiah(income)}</div>
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-icon expense">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 13 12 18 17 13" />
              <line x1="12" y1="18" x2="12" y2="6" />
            </svg>
          </div>
          <div>
            <div className="type-label">Pengeluaran</div>
            <div className="amount" style={{ color: 'var(--accent-red)' }}>{formatRupiah(expense)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
