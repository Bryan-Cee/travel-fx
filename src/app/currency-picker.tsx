import { router } from 'expo-router';

import { CurrencyList } from '@/components/currency-list';
import { Screen } from '@/components/screen';
import { useAppStore } from '@/store/use-app-store';

export default function CurrencyPickerScreen() {
  const currencies = useAppStore((state) => state.currencies);
  const source = useAppStore((state) => state.sourceCurrency);
  const targets = useAppStore((state) => state.targetCurrencies);
  const addTarget = useAppStore((state) => state.addTarget);
  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <CurrencyList
        currencies={currencies}
        excluded={[source, ...targets]}
        onSelect={(currency) => {
          addTarget(currency.code);
          router.back();
        }}
      />
    </Screen>
  );
}
