/**
 * Safe numeric & currency formatting utilities
 * Prevents "Cannot read properties of undefined (reading 'toLocaleString')" errors
 */

export function safeNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

export function formatFCFA(val: any): string {
  const num = safeNumber(val, 0);
  return num.toLocaleString('fr-FR');
}

export function formatNumber(val: any): string {
  const num = safeNumber(val, 0);
  return num.toLocaleString('fr-FR');
}

export function safeDateString(dateVal: any, options?: Intl.DateTimeFormatOptions): string {
  if (!dateVal) return 'Date inconnue';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Date inconnue';
    return d.toLocaleString('fr-FR', options);
  } catch (_) {
    return 'Date inconnue';
  }
}
