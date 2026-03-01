import { getMonthDisplayName, navigateMonth } from '../utils/format';

interface MonthPickerProps {
  month: string;
  onChange: (month: string) => void;
}

export default function MonthPicker({ month, onChange }: MonthPickerProps) {
  return (
    <div className="month-picker">
      <button onClick={() => onChange(navigateMonth(month, -1))} aria-label="Bulan sebelumnya">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="month-label">{getMonthDisplayName(month)}</span>
      <button onClick={() => onChange(navigateMonth(month, 1))} aria-label="Bulan berikutnya">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
