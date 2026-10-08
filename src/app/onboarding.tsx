import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CurrencyList } from '@/components/currency-list';
import { Screen } from '@/components/screen';
import { radii, spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAppStore } from '@/store/use-app-store';

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const currencies = useAppStore((state) => state.currencies);
  const source = useAppStore((state) => state.sourceCurrency);
  const complete = useAppStore((state) => state.completeOnboarding);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={[styles.mark, { backgroundColor: colors.surface }]}>
          <Image
            accessibilityLabel="Travel FX"
            source={require('../../assets/images/icon.png')}
            style={styles.icon}
          />
        </View>
        <AppText tone="accent" weight="extraBold" style={styles.eyebrow}>TRAVEL FX</AppText>
        <AppText accessibilityRole="header" weight="extraBold" style={styles.title}>
          Where are you headed?
        </AppText>
        <AppText tone="muted" style={styles.body}>
          Your local currency is {source}. Choose a destination currency to start converting.
        </AppText>
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
  header: { paddingTop: spacing.xl, paddingBottom: spacing.xl },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  icon: { width: 56, height: 56 },
  eyebrow: { fontSize: 12, letterSpacing: 2, marginBottom: spacing.sm },
  title: { fontSize: typeScale.display, lineHeight: 42, letterSpacing: -0.8 },
  body: { fontSize: typeScale.body, lineHeight: 24, marginTop: spacing.sm },
});
