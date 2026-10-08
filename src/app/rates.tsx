import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Screen } from '@/components/screen';
import { radii, spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatConvertedValue, getNumberFormatLocale } from '@/services/format';
import { resolveRate } from '@/services/rates';
import { useAppStore } from '@/store/use-app-store';

export default function RatesScreen() {
  const {
    sourceCurrency,
    targetCurrencies,
    rateCache,
    customRates,
    numberFormat,
    moveTarget,
    removeTarget,
    deleteCustomRate,
  } = useAppStore();
  const { colors, locale } = useAppTheme();
  const formatLocale = getNumberFormatLocale(locale, numberFormat);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText weight="extraBold" style={styles.title}>Rates</AppText>
        <AppText tone="muted" style={styles.intro}>
          Set your own rate when you’ve got a better one, like a street exchange or a card.
        </AppText>

        <View style={styles.list}>
          {targetCurrencies.map((quote, index) => {
            const resolved = resolveRate(sourceCurrency, quote, rateCache, customRates);
            const live = resolveRate(sourceCurrency, quote, rateCache, []);
            const custom = customRates.find(
              (item) => item.enabled && (
                (item.base === sourceCurrency && item.quote === quote) ||
                (item.base === quote && item.quote === sourceCurrency)
              ),
            );
            const rateText = resolved
              ? formatConvertedValue(resolved.rate, quote, formatLocale, true)
              : '—';
            return (
              <View key={quote} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardMain}>
                  <View style={styles.rateCopy}>
                    <AppText tone="muted" style={styles.rateLine}>
                      1 {sourceCurrency} ={' '}
                      <AppText
                        tone={resolved?.isCustom ? 'accent' : 'primary'}
                        weight="extraBold"
                        style={styles.rateValue}
                      >
                        {rateText}
                      </AppText>{' '}
                      {quote}
                    </AppText>
                    <AppText tone="muted" style={styles.rateStatus}>
                      {resolved?.isCustom && live
                        ? `Live ${formatConvertedValue(live.rate, quote, formatLocale, true)}`
                        : live
                          ? 'Using live rate'
                          : 'Live rate unavailable'}
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityLabel={custom ? `Reset ${sourceCurrency} to ${quote} to live rate` : `Set custom ${sourceCurrency} to ${quote} rate`}
                    accessibilityRole="button"
                    onPress={() => {
                      if (custom) {
                        deleteCustomRate(custom.base, custom.quote);
                      } else {
                        router.push({ pathname: '/custom-rate', params: { base: sourceCurrency, quote } });
                      }
                    }}
                    style={({ pressed }) => [
                      styles.customAction,
                      { backgroundColor: colors.surfaceRaised },
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText
                      tone={custom ? 'accent' : 'primary'}
                      weight="bold"
                      style={styles.customActionText}
                    >
                      {custom ? 'Reset to live' : 'Set custom'}
                    </AppText>
                  </Pressable>
                </View>
                <View style={[styles.management, { borderTopColor: colors.border }]}>
                  <Pressable
                    accessibilityLabel={`Move ${quote} up`}
                    accessibilityRole="button"
                    disabled={index === 0}
                    onPress={() => moveTarget(quote, -1)}
                    style={({ pressed }) => [styles.managementButton, index === 0 && styles.disabled, pressed && styles.pressed]}
                  >
                    <AppText tone="muted" weight="bold">↑</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Move ${quote} down`}
                    accessibilityRole="button"
                    disabled={index === targetCurrencies.length - 1}
                    onPress={() => moveTarget(quote, 1)}
                    style={({ pressed }) => [
                      styles.managementButton,
                      index === targetCurrencies.length - 1 && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText tone="muted" weight="bold">↓</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Remove ${quote}`}
                    accessibilityRole="button"
                    onPress={() => removeTarget(quote)}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                  >
                    <AppText tone="danger" weight="semibold">Remove</AppText>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/currency-picker')}
          style={({ pressed }) => [
            styles.addButton,
            { borderColor: colors.surfaceSelected },
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="muted" weight="bold">Add currency</AppText>
        </Pressable>
      </ScrollView>
      <BottomNavigation active="rates" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typeScale.display, lineHeight: 43, letterSpacing: -1 },
  intro: { fontSize: typeScale.body, lineHeight: 24, marginTop: spacing.xs, marginBottom: spacing.xl },
  list: { gap: spacing.md },
  card: { borderRadius: radii.md, overflow: 'hidden' },
  cardMain: { minHeight: 126, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rateCopy: { flex: 1 },
  rateLine: { fontSize: 15, lineHeight: 28 },
  rateValue: { fontSize: 23 },
  rateStatus: { fontSize: 14, marginTop: spacing.xs },
  customAction: { minWidth: 116, minHeight: 58, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  customActionText: { fontSize: 15, textAlign: 'center' },
  management: { minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  managementButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  removeButton: { minHeight: 48, flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingRight: spacing.lg },
  disabled: { opacity: 0.25 },
  addButton: {
    minHeight: 64,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  pressed: { opacity: 0.65 },
});
