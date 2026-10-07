import { fireEvent, render } from '@testing-library/react-native';

import ConverterScreen from '@/app/index';
import { useAppStore } from '@/store/use-app-store';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn() },
}));

describe('converter workflow', () => {
  beforeEach(() => {
    mockPush.mockClear();
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
    expect(screen.getByText('€0.90')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Clear'));
    await fireEvent.press(screen.getByLabelText('2'));
    expect(screen.getByText('€1.80')).toBeTruthy();
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
    await fireEvent.press(screen.getByText('＋ Add'));
    expect(mockPush).toHaveBeenCalledWith('/currency-picker');
  });
});
