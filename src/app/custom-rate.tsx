import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { fontFamilies, radii, spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  formatConvertedValue,
  getDecimalSeparator,
  getNumberFormatLocale,
} from '@/services/format';
import { resolveRate } from '@/services/rates';
import { useAppStore } from '@/store/use-app-store';

const previewAmount = 1000;

export default function CustomRateScreen() {
  const { colors, locale } = useAppTheme();
  const params = useLocalSearchParams<{ base?: string; quote?: string }>();
  const base = typeof params.base === 'string' && /^[A-Z]{3}$/.test(params.base) ? params.base : '';
  const quote = typeof params.quote === 'string' && /^[A-Z]{3}$/.test(params.quote) ? params.quote : '';
  const customRates = useAppStore((state) => state.customRates);
  const numberFormat = useAppStore((state) => state.numberFormat);
  const rateCache = useAppStore((state) => state.rateCache);
  const saveCustomRate = useAppStore((state) => state.saveCustomRate);
  const deleteCustomRate = useAppStore((state) => state.deleteCustomRate);
  const existing = useMemo(
    () => customRates.find((rate) =>
      (rate.base === base && rate.quote === quote) ||
      (rate.base === quote && rate.quote === base),
    ),
    [base, customRates, quote],
  );
  const currentRate = existing
    ? existing.base === base
      ? existing.rate
      : 1 / existing.rate
    : null;
  const formatLocale = getNumberFormatLocale(locale, numberFormat);
  const decimal = getDecimalSeparator(formatLocale);
  const [value, setValue] = useState(currentRate ? String(currentRate).replace('.', decimal) : '');
  const parsed = Number(value.replace(decimal, '.'));
  const valid = base !== '' && quote !== '' && base !== quote && Number.isFinite(parsed) && parsed > 0;
  const live = resolveRate(base, quote, rateCache, []);

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.cancel}>
            <AppText weight="semibold">Cancel</AppText>
          </Pressable>
          <AppText weight="extraBold" style={styles.headerTitle}>Custom rate</AppText>
          <View style={styles.cancel} />
        </View>

        {base && quote ? (
          <>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <AppText tone="muted" style={styles.label}>Currency</AppText>
              <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <AppText weight="bold" style={styles.fieldValue}>{quote}</AppText>
              </View>

              <AppText tone="muted" style={styles.label}>1 {base} equals</AppText>
              <TextInput
                accessibilityLabel={`Custom rate from ${base} to ${quote}`}
                autoFocus
                cursorColor={colors.accent}
                inputMode="decimal"
                onChangeText={setValue}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                selectionColor={colors.accent}
                style={[
                  styles.field,
                  styles.rateInput,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                ]}
                value={value}
              />

              <AppText tone="muted" style={styles.help}>
                {live
                  ? `Live rate is ${formatConvertedValue(live.rate, quote, formatLocale, true)}. Your rate replaces it on the Convert screen and applies in both directions.`
                  : 'Your rate replaces the unavailable live rate and applies in both directions.'}
              </AppText>

              {!valid && value.length > 0 ? (
                <AppText accessibilityLiveRegion="polite" tone="danger" weight="semibold">
                  Enter a positive, finite rate.
                </AppText>
              ) : null}

              <View style={[styles.preview, { backgroundColor: colors.surface }]}>
                <AppText tone="muted" style={styles.previewLabel}>
                  Preview · {formatConvertedValue(previewAmount, base, formatLocale)} {base}
                </AppText>
                <AppText
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  numberOfLines={1}
                  tone="accent"
                  weight="extraBold"
                  style={styles.previewValue}
                >
                  {valid
                    ? `${formatConvertedValue(previewAmount * parsed, quote, formatLocale, true)} ${quote}`
                    : `— ${quote}`}
                </AppText>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={!valid}
                onPress={() => {
                  saveCustomRate({ base, quote, rate: parsed, savedAt: new Date().toISOString(), enabled: true });
                  router.back();
                }}
                style={({ pressed }) => [
                  styles.save,
                  { backgroundColor: colors.accent },
                  !valid && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <AppText weight="extraBold" style={[styles.saveText, { color: colors.accentText }]}>
                  Save rate
                </AppText>
              </Pressable>
              {existing ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    deleteCustomRate(existing.base, existing.quote);
                    router.back();
                  }}
                  style={styles.liveButton}
                >
                  <AppText tone="muted" weight="bold">Use live rate instead</AppText>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : (
          <AppText tone="danger">This currency pair is invalid.</AppText>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancel: { width: 88, minHeight: 48, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: typeScale.heading, textAlign: 'center' },
  content: { paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  label: { fontSize: typeScale.body, marginBottom: spacing.sm, marginTop: spacing.xl },
  field: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  fieldValue: { fontSize: 20 },
  rateInput: { fontFamily: fontFamilies.bold, fontSize: 22 },
  help: { fontSize: 15, lineHeight: 22, marginTop: spacing.xl },
  preview: { borderRadius: radii.md, padding: spacing.xl, marginTop: spacing.xl },
  previewLabel: { fontSize: 14 },
  previewValue: { fontSize: 32, lineHeight: 42, marginTop: spacing.sm },
  footer: { paddingTop: spacing.md },
  save: { minHeight: 58, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 18 },
  liveButton: { minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.7 },
});
