import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import ConverterScreen from '@/app/index';
import RatesScreen from '@/app/rates';
import SettingsScreen from '@/app/settings';
import { useAppStore } from '@/store/use-app-store';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

describe('converter workflow', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockBack.mockClear();
    useAppStore.setState({
      initialized: true,
      onboardingComplete: true,
      sourceCurrency: 'USD',
      defaultCurrency: 'USD',
      targetCurrencies: ['EUR'],
      numberFormat: 'system',
      hapticsEnabled: false,
      error: null,
      storageNotice: null,
      refreshing: false,
      customRates: [],
      rateCache: {
        base: 'USD',
        fetchedAt: new Date().toISOString(),
        rates: {
          EUR: { base: 'USD', quote: 'EUR', rate: 0.9, sourceDate: '2026-10-07' },
        },
      },
    });
  });

  it('updates converted values from calculator input', async () => {
    const screen = await render(<ConverterScreen />);
    expect(screen.getByLabelText('EUR amount input').props.accessibilityValue.text).toBe('0.90');
    await fireEvent.press(screen.getByLabelText('Clear'));
    await fireEvent.press(screen.getByLabelText('2'));
    expect(screen.getByLabelText('EUR amount input').props.accessibilityValue.text).toBe('1.80');
  });

  it('clears any pressed currency input before accepting a new value', async () => {
    const screen = await render(<ConverterScreen />);
    await fireEvent.press(screen.getByLabelText('EUR amount input'));
    expect(useAppStore.getState().sourceCurrency).toBe('USD');
    expect(screen.getByLabelText('EUR amount input').props.accessibilityValue.text).toBe('');
    expect(screen.getByLabelText('USD amount input').props.accessibilityValue.text).toBe('—');
    expect(screen.getByLabelText('Edit EUR conversion rate')).toBeTruthy();
    expect(screen.getByLabelText('Delete EUR conversion')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('2'));
    expect(screen.getByLabelText('EUR amount input').props.accessibilityValue.text).toBe('2');
    expect(screen.getByLabelText('USD amount input').props.accessibilityValue.text).toBe('2.22');
  });

  it('clears a selected sub-cent input without affecting keypad entry', async () => {
    useAppStore.setState({
      sourceCurrency: 'IDR',
      defaultCurrency: 'IDR',
      targetCurrencies: ['USD'],
      rateCache: {
        base: 'USD',
        fetchedAt: new Date().toISOString(),
        rates: {
          IDR: { base: 'USD', quote: 'IDR', rate: 16000, sourceDate: '2026-10-07' },
        },
      },
    });
    const screen = await render(<ConverterScreen />);

    await fireEvent.press(screen.getByLabelText('USD amount input'));
    expect(screen.getByLabelText('USD amount input').props.accessibilityValue.text).toBe('');
    expect(screen.getByLabelText('IDR amount input').props.accessibilityValue.text).toBe('—');
    await fireEvent.press(screen.getByLabelText('1'));
    expect(screen.getByLabelText('IDR amount input').props.accessibilityValue.text).toBe('16,000');
  });

  it('normalizes the active expression when number separators change', async () => {
    const screen = await render(<ConverterScreen />);

    await act(async () => {
      useAppStore.getState().setNumberFormat('period-comma');
    });
    expect(screen.getByLabelText('USD amount input').props.accessibilityValue.text).toBe('1,00');
    expect(screen.getByLabelText('EUR amount input').props.accessibilityValue.text).toBe('0,90');
  });

  it('keeps unavailable offline rows from clearing the active amount', async () => {
    useAppStore.setState({ rateCache: null });
    const screen = await render(<ConverterScreen />);

    await fireEvent.press(screen.getByLabelText('EUR amount input'));
    expect(screen.getByLabelText('USD amount input').props.accessibilityValue.text).toBe('1.00');
    expect(screen.getByLabelText('EUR amount input').props.accessibilityValue.text).toBe('—');
  });

  it('retains calculator precision behind the two-decimal result', async () => {
    useAppStore.setState({
      targetCurrencies: ['IDR'],
      rateCache: {
        base: 'USD',
        fetchedAt: new Date().toISOString(),
        rates: {
          IDR: { base: 'USD', quote: 'IDR', rate: 16000, sourceDate: '2026-10-07' },
        },
      },
    });
    const screen = await render(<ConverterScreen />);

    await fireEvent.press(screen.getByLabelText('Clear'));
    await fireEvent.press(screen.getByLabelText('1'));
    await fireEvent.press(screen.getByLabelText('Divide'));
    await fireEvent.press(screen.getByLabelText('3'));
    await fireEvent.press(screen.getByLabelText('Equals'));
    expect(screen.getByLabelText('USD amount input').props.accessibilityValue.text).toBe('0.33');
    expect(screen.getByLabelText('IDR amount input').props.accessibilityValue.text).toBe('5,333');
  });

  it('opens the add-currency flow', async () => {
    const screen = await render(<ConverterScreen />);
    await fireEvent.press(screen.getByText('＋ Add currency'));
    expect(mockPush).toHaveBeenCalledWith('/currency-picker');
  });

  it('hides and restores the calculator keypad', async () => {
    const screen = await render(<ConverterScreen />);
    expect(screen.getByLabelText('Calculator keypad')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('keypad-overlay').props.style).position).toBe('absolute');
    await fireEvent.press(screen.getByLabelText('Hide keypad'));
    expect(screen.queryByLabelText('Calculator keypad')).toBeNull();
    await fireEvent.press(screen.getByLabelText('USD amount input'));
    expect(screen.getByLabelText('Calculator keypad')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Hide keypad'));
    expect(screen.queryByLabelText('Calculator keypad')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Show keypad'));
    expect(screen.getByLabelText('Calculator keypad')).toBeTruthy();
  });

  it('opens the rates destination from bottom navigation', async () => {
    const screen = await render(<ConverterScreen />);
    expect(screen.getByTestId('navigation-icon-convert', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('navigation-icon-rates', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('navigation-icon-settings', { includeHiddenElements: true })).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Open rates'));
    expect(mockReplace).toHaveBeenCalledWith('/rates');
  });

  it('opens pair-specific custom-rate editing from Rates', async () => {
    const screen = await render(<RatesScreen />);
    await fireEvent.press(screen.getByText('Set custom'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/custom-rate',
      params: { base: 'USD', quote: 'EUR' },
    });
  });

  it('edits and deletes a conversion from its swipe actions', async () => {
    const screen = await render(<ConverterScreen />);

    await fireEvent.press(screen.getByLabelText('Edit EUR conversion rate'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/custom-rate',
      params: { base: 'USD', quote: 'EUR' },
    });

    await fireEvent.press(screen.getByLabelText('Delete EUR conversion'));
    expect(useAppStore.getState().targetCurrencies).not.toContain('EUR');
  });

  it('shows provider and badged custom conversions as separate cards', async () => {
    useAppStore.setState({
      customRates: [{
        base: 'USD',
        quote: 'EUR',
        rate: 0.8,
        savedAt: '2026-10-08T05:00:00.000Z',
        enabled: true,
      }],
    });
    const screen = await render(<ConverterScreen />);

    expect(screen.getByLabelText('EUR amount input').props.accessibilityValue.text).toBe('0.90');
    expect(screen.getByLabelText('Custom EUR amount input').props.accessibilityValue.text).toBe('0.80');
    expect(screen.getByText('CUSTOM')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Custom EUR amount input'));
    expect(screen.getByLabelText('Custom EUR amount input').props.accessibilityValue.text).toBe('');
    expect(screen.getByLabelText('EUR amount input').props.accessibilityValue.text).toBe('—');
    expect(screen.getByText('CUSTOM')).toBeTruthy();
    expect(screen.getByLabelText('Edit custom EUR conversion rate')).toBeTruthy();
    expect(screen.getByLabelText('Delete custom EUR rate')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('EUR amount input'));
    await fireEvent.press(screen.getByLabelText('Delete custom EUR rate'));
    expect(useAppStore.getState().customRates).toEqual([]);
    expect(useAppStore.getState().targetCurrencies).toContain('EUR');
  });

  it('opens default currency and number format preferences from Settings', async () => {
    const screen = await render(<SettingsScreen />);

    await fireEvent.press(screen.getByLabelText('Default currency, USD'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/currency-picker',
      params: { mode: 'default' },
    });

    await fireEvent.press(screen.getByLabelText('Number format, System'));
    expect(mockPush).toHaveBeenCalledWith('/number-format');
  });
});
