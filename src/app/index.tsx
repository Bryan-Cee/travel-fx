import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { getLocales } from 'expo-localization';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CalculatorKeypad } from '@/components/calculator-keypad';
import { Screen } from '@/components/screen';
import { minTouch, radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { evaluateExpression } from '@/services/expression';
import { formatCurrencyValue, formatPlainNumber, formatRelativeUpdate, getDecimalSeparator } from '@/services/format';
import { isCacheFresh, resolveRate } from '@/services/rates';
import { useAppStore } from '@/store/use-app-store';

export default function ConverterScreen() {
  const { palette } = useAppTheme();
  const locale = getLocales()[0]?.languageTag ?? 'en-US';
  const decimalSeparator = getDecimalSeparator(locale);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const source = useAppStore((state) => state.sourceCurrency);
  const targets = useAppStore((state) => state.targetCurrencies);
  const cache = useAppStore((state) => state.rateCache);
  const customRates = useAppStore((state) => state.customRates);
  const error = useAppStore((state) => state.error);
  const notice = useAppStore((state) => state.storageNotice);
  const refreshing = useAppStore((state) => state.refreshing);
  const refreshRates = useAppStore((state) => state.refreshRates);
  const removeTarget = useAppStore((state) => state.removeTarget);
  const moveTarget = useAppStore((state) => state.moveTarget);
  const promote = useAppStore((state) => state.setExpressionSource);
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);
  const [expression, setExpression] = useState('1');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const result = evaluateExpression(expression, decimalSeparator);

  useEffect(() => {
    if (!onboardingComplete) router.replace('/onboarding');
  }, [onboardingComplete]);

  if (!onboardingComplete) return null;
  const numericValue = result.status === 'valid' ? result.value : null;

  const handleKey = (key: string) => {
    if (key === 'C') {
      setExpression('');
      return;
    }
    if (key === '⌫') {
      setExpression((current) => Array.from(current).slice(0, -1).join(''));
      return;
    }
    if (key === '=') {
      if (result.status === 'valid') {
        const formatted = formatPlainNumber(result.value, locale);
        setExpression(formatted);
        void AccessibilityInfo.announceForAccessibility(`Equals ${formatted}`);
        if (hapticsEnabled) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((hapticError: unknown) =>
            console.warn('Haptic feedback failed', hapticError),
          );
        }
      } else {
        void AccessibilityInfo.announceForAccessibility('Expression is not complete');
      }
      return;
    }
    setExpression((current) => current + key);
  };

  const promoteTarget = (target: string, converted: number) => {
    const newTargets = [source, ...targets.filter((code) => code !== target)];
    promote(target, newTargets);
    setExpression(formatPlainNumber(converted, locale));
    void AccessibilityInfo.announceForAccessibility(`${target} is now the source currency`);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refreshRates(true)} tintColor={palette.primary} />
        }>
        <View style={styles.topbar}>
          <View>
            <Text style={[styles.brand, { color: palette.primary }]}>TRAVEL FX</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>Fast reference rates, ready offline</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: palette.surfaceAlt, opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[styles.iconText, { color: palette.text }]}>⚙</Text>
          </Pressable>
        </View>

        {(error || notice) && (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.banner, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
            <Text style={[styles.bannerText, { color: error ? palette.warning : palette.muted }]}>{error ?? notice}</Text>
          </View>
        )}

        <View style={[styles.sourceCard, { backgroundColor: palette.primary }]}>
          <Text style={[styles.sourceLabel, { color: palette.onPrimary }]}>FROM · {source}</Text>
          <Text
            accessibilityLabel={`${source} expression ${expression || 'empty'}`}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            numberOfLines={1}
            style={[styles.expression, { color: palette.onPrimary }]}>
            {expression || '0'}
          </Text>
          <Text style={[styles.expressionStatus, { color: palette.onPrimary }]}>
            {result.status === 'valid'
              ? `= ${formatCurrencyValue(result.value, source, locale, true)}`
              : result.status === 'invalid'
                ? result.message
                : 'Keep typing…'}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: palette.text }]}>Your currencies</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/currency-picker')}
            style={({ pressed }) => [styles.addButton, { borderColor: palette.primary, opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[styles.addButtonText, { color: palette.primary }]}>＋ Add</Text>
          </Pressable>
        </View>

        {targets.length === 0 && (
          <Pressable
            onPress={() => router.push('/currency-picker')}
            style={[styles.emptyCard, { borderColor: palette.border }]}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Add a destination currency</Text>
            <Text style={[styles.emptyBody, { color: palette.muted }]}>Compare as many fiat currencies as you need.</Text>
          </Pressable>
        )}

        <View style={styles.targets}>
          {targets.map((target, index) => {
            const resolved = resolveRate(source, target, cache, customRates);
            const converted = numericValue !== null && resolved ? numericValue * resolved.rate : null;
            return (
              <Pressable
                key={target}
                accessibilityRole="button"
                accessibilityHint="Promotes this currency to the source"
                disabled={converted === null}
                onPress={() => converted !== null && promoteTarget(target, converted)}
                style={({ pressed }) => [
                  styles.targetCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <View style={styles.targetMain}>
                  <View style={styles.targetIdentity}>
                    <Text style={[styles.targetCode, { color: palette.text }]}>{target}</Text>
                    <Text style={[styles.targetMeta, { color: palette.muted }]}>
                      {resolved
                        ? `${resolved.isCustom ? 'Custom · ' : ''}1 ${source} = ${formatPlainNumber(resolved.rate, locale, 6)} ${target} · ${
                            new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(resolved.sourceDate))
                          }`
                        : 'Rate unavailable'}
                    </Text>
                  </View>
                  <Text
                    accessibilityLabel={converted === null ? `${target} unavailable` : `${target} ${converted}`}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[styles.targetValue, { color: palette.text }]}>
                    {converted === null ? '—' : formatCurrencyValue(converted, target, locale, expanded[target])}
                  </Text>
                </View>
                <View style={[styles.targetActions, { borderTopColor: palette.border }]}>
                  <MiniAction
                    label={expanded[target] ? 'Standard precision' : 'Show up to 6 decimals'}
                    text=".000"
                    onPress={() => setExpanded((current) => ({ ...current, [target]: !current[target] }))}
                  />
                  <MiniAction
                    label={`Edit custom rate for ${source} and ${target}`}
                    text="Rate"
                    onPress={() => router.push({ pathname: '/custom-rate', params: { base: source, quote: target } })}
                  />
                  <MiniAction label="Move up" text="↑" disabled={index === 0} onPress={() => moveTarget(target, -1)} />
                  <MiniAction label="Move down" text="↓" disabled={index === targets.length - 1} onPress={() => moveTarget(target, 1)} />
                  <MiniAction label={`Remove ${target}`} text="×" onPress={() => removeTarget(target)} />
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.update, { color: palette.muted }]}>
          {cache
            ? `${isCacheFresh(cache) ? 'Updated' : 'Saved rates · stale'} ${formatRelativeUpdate(cache.fetchedAt, locale)}`
            : 'No saved rates yet'}
        </Text>
        <CalculatorKeypad decimalSeparator={decimalSeparator} onKey={handleKey} />
        <Text style={[styles.disclaimer, { color: palette.muted }]}>Reference only — not for trading.</Text>
      </ScrollView>
    </Screen>
  );
}

function MiniAction({
  label,
  text,
  disabled = false,
  onPress,
}: {
  label: string;
  text: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={styles.miniAction}>
      <Text style={[styles.miniText, { color: disabled ? palette.border : palette.muted }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  iconButton: { width: minTouch, height: minTouch, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20 },
  banner: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.md, padding: spacing.md },
  bannerText: { fontSize: 14, lineHeight: 19 },
  sourceCard: { borderRadius: radii.lg, padding: spacing.xl, minHeight: 150, justifyContent: 'space-between' },
  sourceLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, opacity: 0.9 },
  expression: { fontSize: 38, lineHeight: 48, fontWeight: '700', textAlign: 'right', marginTop: spacing.md },
  expressionStatus: { fontSize: 14, textAlign: 'right', opacity: 0.82 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  addButton: { minHeight: minTouch, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  addButtonText: { fontSize: 15, fontWeight: '700' },
  emptyCard: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radii.lg, padding: spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 14, marginTop: spacing.xs },
  targets: { gap: spacing.md },
  targetCard: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  targetMain: { minHeight: 86, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  targetIdentity: { flex: 1 },
  targetCode: { fontSize: 18, fontWeight: '800' },
  targetMeta: { fontSize: 12, marginTop: spacing.xs },
  targetValue: { flex: 1.35, fontSize: 23, fontWeight: '700', textAlign: 'right' },
  targetActions: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'flex-end' },
  miniAction: { minWidth: minTouch, minHeight: minTouch, paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  miniText: { fontSize: 13, fontWeight: '700' },
  update: { fontSize: 12, textAlign: 'center', marginTop: -spacing.sm },
  disclaimer: { fontSize: 12, textAlign: 'center' },
});
