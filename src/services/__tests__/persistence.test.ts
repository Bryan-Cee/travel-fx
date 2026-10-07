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
      version: 2,
      sourceCurrency: 'USD',
      targetCurrencies: ['EUR'],
      themePreference: 'system',
      customRates: [],
    });
    expect(result.issue).toMatch(/upgraded/);
  });

  it('resets invalid data and surfaces a recoverable notice', () => {
    const result = migrateAndValidate({ version: 2, sourceCurrency: 'not-a-code' });
    expect(result.state).toEqual(defaultPersistedState);
    expect(result.issue).toMatch(/reset/);
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
