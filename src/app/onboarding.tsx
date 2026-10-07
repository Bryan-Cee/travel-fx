import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CurrencyList } from '@/components/currency-list';
import { Screen } from '@/components/screen';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAppStore } from '@/store/use-app-store';

export default function OnboardingScreen() {
  const { palette } = useAppTheme();
  const currencies = useAppStore((state) => state.currencies);
  const source = useAppStore((state) => state.sourceCurrency);
  const complete = useAppStore((state) => state.completeOnboarding);
  return (
    <Screen>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.eyebrow, { color: palette.primary }]}>TRAVEL FX</Text>
        <Text style={[styles.title, { color: palette.text }]}>Where are you headed?</Text>
        <Text style={[styles.body, { color: palette.muted }]}>
          Your local currency is set to {source}. Choose a destination currency to start converting.
        </Text>
      </View>
      <CurrencyList
        currencies={currencies}
        excluded={[source]}
        onSelect={(currency) => {
          complete(currency.code);
          router.replace('/');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.sm },
  eyebrow: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  body: { fontSize: 17, lineHeight: 24 },
});
