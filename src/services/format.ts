export function getDecimalSeparator(locale: string): string {
  return new Intl.NumberFormat(locale).formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
}

export function currencyDigits(currency: string, locale: string): number {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
}

export function formatCurrencyValue(
  value: number,
  currency: string,
  locale: string,
  expanded = false,
): string {
  const nativeDigits = currencyDigits(currency, locale);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: nativeDigits,
    maximumFractionDigits: expanded ? 6 : nativeDigits,
  }).format(value);
}

export function formatConvertedValue(
  value: number,
  currency: string,
  locale: string,
  expanded = false,
): string {
  const nativeDigits = currencyDigits(currency, locale);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: nativeDigits,
    maximumFractionDigits: expanded ? 6 : nativeDigits,
  }).format(value);
}

export function formatPlainNumber(value: number, locale: string, maximumFractionDigits = 12): string {
  return new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits }).format(value);
}

export function formatRelativeUpdate(iso: string, locale: string, now = Date.now()): string {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return 'unknown';
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) {
    return `${new Intl.NumberFormat(locale).format(minutes)} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${new Intl.NumberFormat(locale).format(hours)} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(timestamp);
}
