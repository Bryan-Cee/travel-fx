import { currencyDigits, formatCurrencyValue, getDecimalSeparator } from '../format';

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
});
