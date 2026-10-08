import { getLocales } from 'expo-localization';
import { create } from 'zustand';

import { fetchCurrencies, fetchLatestRates } from '@/services/api';
import { defaultPersistedState, loadPersistedState, resetPersistedState, savePersistedState } from '@/services/persistence';
import { isCacheFresh, upsertCustomRate } from '@/services/rates';
import {
  Currency,
  CustomRate,
  NumberFormatPreference,
  PersistedState,
  ThemePreference,
} from '@/types';

type AppStore = PersistedState & {
  currencies: Currency[];
  initialized: boolean;
  refreshing: boolean;
  error: string | null;
  storageNotice: string | null;
  initialize: () => Promise<void>;
  refreshRates: (force?: boolean) => Promise<void>;
  completeOnboarding: (target: string) => void;
  setExpressionSource: (sourceCurrency: string, targets: string[]) => void;
  addTarget: (code: string) => void;
  removeTarget: (code: string) => void;
  moveTarget: (code: string, direction: -1 | 1) => void;
  setHaptics: (enabled: boolean) => void;
  setThemePreference: (theme: ThemePreference) => void;
  setDefaultCurrency: (currency: string) => void;
  setNumberFormat: (format: NumberFormatPreference) => void;
  saveCustomRate: (customRate: CustomRate) => void;
  toggleCustomRate: (base: string, quote: string, enabled: boolean) => void;
  deleteCustomRate: (base: string, quote: string) => void;
  resetApp: () => Promise<void>;
};

function localeCurrency(): string {
  return getLocales()[0]?.currencyCode ?? 'USD';
}
function persistedSlice(state: AppStore): PersistedState {
  return {
    version: 3,
    sourceCurrency: state.sourceCurrency,
    defaultCurrency: state.defaultCurrency,
    targetCurrencies: state.targetCurrencies,
    onboardingComplete: state.onboardingComplete,
    hapticsEnabled: state.hapticsEnabled,
    themePreference: state.themePreference,
    numberFormat: state.numberFormat,
    customRates: state.customRates,
    rateCache: state.rateCache,
  };
}
let persistChain = Promise.resolve();
function queuePersist(state: AppStore): void {
  persistChain = persistChain
    .then(() => savePersistedState(persistedSlice(state)))
    .catch((error: unknown) => {
      useAppStore.setState({ error: error instanceof Error ? `Could not save settings: ${error.message}` : 'Could not save settings.' });
    });
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...defaultPersistedState,
  currencies: [],
  initialized: false,
  refreshing: false,
  error: null,
  storageNotice: null,
  initialize: async () => {
    if (get().initialized) return;
    let loaded = { state: defaultPersistedState, issue: null as string | null };
    try {
      loaded = await loadPersistedState();
    } catch (error) {
      loaded = { state: defaultPersistedState, issue: error instanceof Error ? `Could not read saved data: ${error.message}` : 'Could not read saved data.' };
    }
    const detected = localeCurrency();
    const defaultCurrency = loaded.state.onboardingComplete ? loaded.state.defaultCurrency : detected;
    const sourceCurrency = loaded.state.onboardingComplete ? defaultCurrency : detected;
    set({ ...loaded.state, defaultCurrency, sourceCurrency, storageNotice: loaded.issue });
    if (loaded.issue) {
      try {
        await savePersistedState({ ...loaded.state, defaultCurrency, sourceCurrency });
      } catch (error) {
        set({
          error: error instanceof Error
            ? `Could not persist the storage recovery: ${error.message}`
            : 'Could not persist the storage recovery.',
        });
      }
    }
    try {
      const currencies = await fetchCurrencies();
      const validDefault = currencies.some((currency) => currency.code === defaultCurrency)
        ? defaultCurrency
        : 'USD';
      set({
        currencies,
        defaultCurrency: validDefault,
        sourceCurrency: validDefault,
        targetCurrencies: get().targetCurrencies.filter((code) => code !== validDefault),
        initialized: true,
      });
    } catch (error) {
      const fallbackCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
      set({
        currencies: fallbackCodes.map((code) => ({ code, name: code, symbol: code })),
        initialized: true,
        error: error instanceof Error ? error.message : 'Could not load the currency list.',
      });
    }
    await get().refreshRates(false);
  },
  refreshRates: async (force = true) => {
    if (get().refreshing || (!force && isCacheFresh(get().rateCache))) return;
    set({ refreshing: true, error: null });
    try {
      const rateCache = await fetchLatestRates();
      set({ rateCache, refreshing: false });
      queuePersist(get());
    } catch (error) {
      set({
        refreshing: false,
        error: `${error instanceof Error ? error.message : 'Could not refresh rates.'}${get().rateCache ? ' Using saved rates.' : ''}`,
      });
    }
  },
  completeOnboarding: (target) => {
    set({ onboardingComplete: true, targetCurrencies: [target] });
    queuePersist(get());
  },
  setExpressionSource: (sourceCurrency, targets) => {
    set({ sourceCurrency, targetCurrencies: [...new Set(targets)].filter((code) => code !== sourceCurrency) });
    queuePersist(get());
  },
  addTarget: (code) => {
    if (code === get().sourceCurrency || get().targetCurrencies.includes(code)) return;
    set({ targetCurrencies: [...get().targetCurrencies, code] });
    queuePersist(get());
  },
  removeTarget: (code) => {
    set({ targetCurrencies: get().targetCurrencies.filter((target) => target !== code) });
    queuePersist(get());
  },
  moveTarget: (code, direction) => {
    const targets = [...get().targetCurrencies];
    const index = targets.indexOf(code);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= targets.length) return;
    [targets[index], targets[next]] = [targets[next], targets[index]];
    set({ targetCurrencies: targets });
    queuePersist(get());
  },
  setHaptics: (hapticsEnabled) => {
    set({ hapticsEnabled });
    queuePersist(get());
  },
  setThemePreference: (themePreference) => {
    set({ themePreference });
    queuePersist(get());
  },
  setDefaultCurrency: (defaultCurrency) => {
    const currencies = [get().sourceCurrency, ...get().targetCurrencies];
    set({
      defaultCurrency,
      sourceCurrency: defaultCurrency,
      targetCurrencies: [...new Set(currencies)].filter((code) => code !== defaultCurrency),
    });
    queuePersist(get());
  },
  setNumberFormat: (numberFormat) => {
    set({ numberFormat });
    queuePersist(get());
  },
  saveCustomRate: (customRate) => {
    set({ customRates: upsertCustomRate(get().customRates, customRate) });
    queuePersist(get());
  },
  toggleCustomRate: (base, quote, enabled) => {
    set({ customRates: get().customRates.map((custom) => custom.base === base && custom.quote === quote ? { ...custom, enabled } : custom) });
    queuePersist(get());
  },
  deleteCustomRate: (base, quote) => {
    set({ customRates: get().customRates.filter((custom) => custom.base !== base || custom.quote !== quote) });
    queuePersist(get());
  },
  resetApp: async () => {
    await resetPersistedState();
    set({
      ...defaultPersistedState,
      sourceCurrency: localeCurrency(),
      defaultCurrency: localeCurrency(),
      initialized: true,
      currencies: get().currencies,
      storageNotice: 'Local app data was reset.',
      error: null,
    });
  },
}));
