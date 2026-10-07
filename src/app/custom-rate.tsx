import { getLocales } from 'expo-localization';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { minTouch, radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getDecimalSeparator } from '@/services/format';
import { useAppStore } from '@/store/use-app-store';

export default function CustomRateScreen() {
  const { palette } = useAppTheme();
  const params = useLocalSearchParams<{ base?: string; quote?: string }>();
  const base = typeof params.base === 'string' && /^[A-Z]{3}$/.test(params.base) ? params.base : '';
  const quote = typeof params.quote === 'string' && /^[A-Z]{3}$/.test(params.quote) ? params.quote : '';
  const customRates = useAppStore((state) => state.customRates);
  const saveCustomRate = useAppStore((state) => state.saveCustomRate);
  const existing = useMemo(
    () => customRates.find((rate) => rate.base === base && rate.quote === quote),
    [base, customRates, quote],
  );
  const [value, setValue] = useState(existing ? String(existing.rate) : '');
  const locale = getLocales()[0]?.languageTag ?? 'en-US';
  const decimal = getDecimalSeparator(locale);
  const parsed = Number(value.replace(decimal, '.'));
  const valid = base !== '' && quote !== '' && base !== quote && Number.isFinite(parsed) && parsed > 0;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        {base && quote ? (
          <>
            <Text style={[styles.title, { color: palette.text }]}>1 {base} equals</Text>
            <View style={styles.inputRow}>
              <TextInput
                accessibilityLabel={`Custom rate from ${base} to ${quote}`}
                autoFocus
                inputMode="decimal"
                onChangeText={setValue}
                placeholder="0.00"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                value={value}
              />
              <Text style={[styles.quote, { color: palette.text }]}>{quote}</Text>
            </View>
            <Text style={[styles.help, { color: palette.muted }]}>
              This rate automatically applies to {base} → {quote} and the reciprocal {quote} → {base}. It takes precedence over provider rates until disabled or deleted.
            </Text>
            {!valid && value.length > 0 && (
              <Text accessibilityLiveRegion="polite" style={[styles.error, { color: palette.danger }]}>
                Enter a positive, finite rate.
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={!valid}
              onPress={() => {
                saveCustomRate({ base, quote, rate: parsed, savedAt: new Date().toISOString(), enabled: true });
                router.back();
              }}
              style={({ pressed }) => [
                styles.save,
                { backgroundColor: palette.primary, opacity: !valid ? 0.4 : pressed ? 0.75 : 1 },
              ]}>
              <Text style={[styles.saveText, { color: palette.onPrimary }]}>Save custom rate</Text>
            </Pressable>
          </>
        ) : (
          <Text style={[styles.error, { color: palette.danger }]}>This currency pair is invalid.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: '800' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    flex: 1,
    minHeight: 64,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    fontSize: 26,
    fontWeight: '700',
  },
  quote: { fontSize: 22, fontWeight: '800' },
  help: { fontSize: 15, lineHeight: 22 },
  error: { fontSize: 14, fontWeight: '600' },
  save: { minHeight: minTouch, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  saveText: { fontSize: 16, fontWeight: '800' },
});
