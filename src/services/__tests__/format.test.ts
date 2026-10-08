import {
  currencyDigits,
  formatConvertedValue,
  formatCurrencyValue,
  formatRelativeUpdate,
  getDecimalSeparator,
} from '../format';

describe('currency formatting', () => {
  it('uses locale decimal separators', () => {
    expect(getDecimalSeparator('de-DE')).toBe(',');
  });

  it('uses native currency precision by default', () => {
    expect(currencyDigits('JPY', 'en-US')).toBe(0);
    expect(formatCurrencyValue(1234.56, 'JPY', 'en-US')).toBe('¥1,235');
  });

  it('can reveal precision up to six decimals', () => {
    expect(formatCurrencyValue(1.23456789, 'USD', 'en-US', true)).toBe('$1.234568');
  });

  it('formats converted values without repeating a currency symbol', () => {
    expect(formatConvertedValue(1250, 'USD', 'en-US')).toBe('1,250.00');
    expect(formatConvertedValue(149.5, 'JPY', 'en-US')).toBe('150');
  });

  it('formats recent updates without Intl.RelativeTimeFormat', () => {
    const now = Date.parse('2026-10-08T07:00:00.000Z');

    expect(formatRelativeUpdate('2026-10-08T06:59:30.000Z', 'en-US', now)).toBe('just now');
    expect(formatRelativeUpdate('2026-10-08T06:59:00.000Z', 'en-US', now)).toBe('1 minute ago');
    expect(formatRelativeUpdate('2026-10-08T06:48:00.000Z', 'en-US', now)).toBe('12 minutes ago');
    expect(formatRelativeUpdate('2026-10-08T06:00:00.000Z', 'en-US', now)).toBe('1 hour ago');
    expect(formatRelativeUpdate('2026-10-08T04:00:00.000Z', 'en-US', now)).toBe('3 hours ago');
  });
});
