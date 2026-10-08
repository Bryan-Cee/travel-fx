import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CurrencyList } from '@/components/currency-list';
import { Screen } from '@/components/screen';
import { spacing, typeScale } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

export default function CurrencyPickerScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const currencies = useAppStore((state) => state.currencies);
  const source = useAppStore((state) => state.sourceCurrency);
  const targets = useAppStore((state) => state.targetCurrencies);
  const addTarget = useAppStore((state) => state.addTarget);
  const setExpressionSource = useAppStore((state) => state.setExpressionSource);
  const setDefaultCurrency = useAppStore((state) => state.setDefaultCurrency);
  const selectingSource = mode === 'source';
  const selectingDefault = mode === 'default';

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.cancel}
        >
          <AppText weight="semibold">Cancel</AppText>
        </Pressable>
        <AppText weight="extraBold" style={styles.title}>
          {selectingDefault ? 'Default currency' : selectingSource ? 'Source currency' : 'Add currency'}
        </AppText>
        <View style={styles.cancel} />
      </View>
      <CurrencyList
        currencies={currencies}
        excluded={selectingSource || selectingDefault ? [] : [source, ...targets]}
        onSelect={(currency) => {
          if (selectingDefault) {
            setDefaultCurrency(currency.code);
          } else if (selectingSource) {
            setExpressionSource(
              currency.code,
              [source, ...targets].filter((code) => code !== currency.code),
            );
          } else {
            addTarget(currency.code);
          }
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cancel: { width: 88, minHeight: 48, justifyContent: 'center' },
  title: { flex: 1, fontSize: typeScale.heading, textAlign: 'center' },
});
