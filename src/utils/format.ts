/**
 * Format number to Rupiah currency string
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with sign prefix
 */
export function formatRupiahSigned(amount: number, type: 'income' | 'expense'): string {
  const formatted = formatRupiah(amount);
  return type === 'expense' ? `-${formatted}` : `+${formatted}`;
}

/**
 * Parse Rupiah input string to number
 */
export function parseRupiahInput(input: string): number {
  const cleaned = input.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format date to locale string
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date relative (Today, Yesterday, or date)
 */
export function formatDateRelative(dateStr: string): string {
  const today = new Date();

  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Hari ini';
  if (dateStr === yesterdayStr) return 'Kemarin';
  return formatDate(dateStr);
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get month display name
 */
export function getMonthDisplayName(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return date.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Navigate month forward or backward
 */
export function navigateMonth(month: string, direction: 1 | -1): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + direction, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
