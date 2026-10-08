import { defaultPersistedState, migrateAndValidate } from '../persistence';

describe('persistence schema', () => {
  it('migrates version one data explicitly', () => {
    const result = migrateAndValidate({
      version: 1,
      sourceCurrency: 'USD',
      targetCurrencies: ['EUR', 'EUR', 'USD'],
      onboardingComplete: true,
      hapticsEnabled: false,
      rateCache: null,
    });
    expect(result.state).toMatchObject({
      version: 3,
      sourceCurrency: 'USD',
      defaultCurrency: 'USD',
      targetCurrencies: ['EUR'],
      themePreference: 'system',
      numberFormat: 'system',
      customRates: [],
    });
    expect(result.issue).toMatch(/upgraded/);
  });

  it('resets invalid data and surfaces a recoverable notice', () => {
    const result = migrateAndValidate({ version: 3, sourceCurrency: 'not-a-code' });
    expect(result.state).toEqual(defaultPersistedState);
    expect(result.issue).toMatch(/reset/);
  });

  it('migrates version two preferences to explicit defaults', () => {
    const result = migrateAndValidate({
      version: 2,
      sourceCurrency: 'KES',
      targetCurrencies: ['USD'],
      onboardingComplete: true,
      hapticsEnabled: true,
      themePreference: 'dark',
      customRates: [],
      rateCache: null,
    });

    expect(result.state).toMatchObject({
      version: 3,
      sourceCurrency: 'KES',
      defaultCurrency: 'KES',
      numberFormat: 'system',
    });
    expect(result.issue).toMatch(/upgraded/);
  });

  it('rejects invalid custom rates rather than accepting partial data', () => {
    const result = migrateAndValidate({
      ...defaultPersistedState,
      customRates: [{ base: 'USD', quote: 'EUR', rate: -1, savedAt: 'today', enabled: true }],
    });
    expect(result.state).toEqual(defaultPersistedState);
    expect(result.issue).not.toBeNull();
  });
});
