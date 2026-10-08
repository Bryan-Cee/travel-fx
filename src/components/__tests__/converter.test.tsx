import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import ConverterScreen from '@/app/index';
import RatesScreen from '@/app/rates';
import { useAppStore } from '@/store/use-app-store';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

describe('converter workflow', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    useAppStore.setState({
      initialized: true,
      onboardingComplete: true,
      sourceCurrency: 'USD',
      targetCurrencies: ['EUR'],
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
    expect(screen.getByText('0.90')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Clear'));
    await fireEvent.press(screen.getByLabelText('2'));
    expect(screen.getByText('1.80')).toBeTruthy();
  });

  it('promotes a target to source while preserving its value', async () => {
    const screen = await render(<ConverterScreen />);
    await fireEvent.press(screen.getByLabelText('EUR 0.9'));
    expect(useAppStore.getState().sourceCurrency).toBe('EUR');
    expect(useAppStore.getState().targetCurrencies).toContain('USD');
    expect(screen.getByLabelText('EUR expression 0.9')).toBeTruthy();
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
});
