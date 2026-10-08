import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { radii, spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatConvertedValue, getNumberFormatLocale } from '@/services/format';
import { useAppStore } from '@/store/use-app-store';
import { NumberFormatPreference } from '@/types';

const options: { label: string; value: NumberFormatPreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Comma and period', value: 'comma-period' },
  { label: 'Period and comma', value: 'period-comma' },
  { label: 'Space and comma', value: 'space-comma' },
];

export default function NumberFormatScreen() {
  const { colors, locale } = useAppTheme();
  const numberFormat = useAppStore((state) => state.numberFormat);
  const setNumberFormat = useAppStore((state) => state.setNumberFormat);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.cancel}>
          <AppText weight="semibold">Cancel</AppText>
        </Pressable>
        <AppText weight="extraBold" style={styles.title}>Number format</AppText>
        <View style={styles.cancel} />
      </View>

      <AppText tone="muted" style={styles.intro}>
        Choose how amounts group thousands and separate decimals.
      </AppText>

      <View accessibilityRole="radiogroup" style={styles.options}>
        {options.map((option) => {
          const selected = numberFormat === option.value;
          const optionLocale = getNumberFormatLocale(locale, option.value);
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => {
                setNumberFormat(option.value);
                router.back();
              }}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected ? colors.surfaceRaised : colors.surface,
                  borderColor: selected ? colors.accent : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.optionCopy}>
                <AppText weight="bold">{option.label}</AppText>
                <AppText tone="muted" style={styles.example}>
                  {formatConvertedValue(1234.56, 'USD', optionLocale)}
                </AppText>
              </View>
              <View
                style={[
                  styles.radio,
                  { borderColor: selected ? colors.accent : colors.muted },
                  selected && { backgroundColor: colors.accent },
                ]}
              >
                {selected ? <View style={[styles.radioDot, { backgroundColor: colors.accentText }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancel: { width: 88, minHeight: 48, justifyContent: 'center' },
  title: { flex: 1, fontSize: typeScale.heading, textAlign: 'center' },
  intro: { fontSize: typeScale.body, lineHeight: 24, marginTop: spacing.xl },
  options: { gap: spacing.sm, marginTop: spacing.xl },
  option: {
    minHeight: 76,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionCopy: { flex: 1 },
  example: { fontSize: 14, marginTop: 3 },
  radio: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  pressed: { opacity: 0.65 },
});
