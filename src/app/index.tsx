import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Swipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { AppText } from '@/components/app-text';
import { BOTTOM_NAVIGATION_HEIGHT, BottomNavigation } from '@/components/bottom-navigation';
import { CalculatorKeypad } from '@/components/calculator-keypad';
import { Chevron } from '@/components/chevron';
import { Screen } from '@/components/screen';
import { fontFamilies, palette, radii, spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { evaluateExpression } from '@/services/expression';
import {
  formatConvertedValue,
  formatEditableValue,
  formatRelativeUpdate,
  getDecimalSeparator,
  getNumberFormatLocale,
} from '@/services/format';
import { resolveRate } from '@/services/rates';
import { useAppStore } from '@/store/use-app-store';
import { CustomRate } from '@/types';

type CurrencyInputRow = {
  active: boolean;
  code: string;
  customRate: CustomRate | null;
  factor: number | null;
  key: string;
  kind: 'provider' | 'custom';
  value: number | null;
};

function amountFontSize(value: string): number {
  if (value.length > 14) return 17;
  if (value.length > 10) return 21;
  return 27;
}

export default function ConverterScreen() {
  const {
    initialized,
    onboardingComplete,
    sourceCurrency,
    targetCurrencies,
    hapticsEnabled,
    numberFormat,
    customRates,
    rateCache,
    refreshing,
    error,
    storageNotice,
    removeTarget,
    deleteCustomRate,
    refreshRates,
  } = useAppStore();
  const { colors, locale } = useAppTheme();
  const formatLocale = getNumberFormatLocale(locale, numberFormat);
  const decimal = getDecimalSeparator(formatLocale);
  const [expressionState, setExpressionState] = useState(() => ({
    decimal,
    text: formatEditableValue(1, formatLocale),
  }));
  let expression = expressionState.text;
  if (expressionState.decimal !== decimal) {
    expression = expressionState.text.split(expressionState.decimal).join(decimal);
    setExpressionState({ decimal, text: expression });
  }
  const [exactActiveValue, setExactActiveValue] = useState<number | null>(null);
  const [activeInputKey, setActiveInputKey] = useState(`${sourceCurrency}-provider`);
  const [showKeypad, setShowKeypad] = useState(true);
  const [keypadOverlayHeight, setKeypadOverlayHeight] = useState(0);
  const currencyOrder = [...new Set([sourceCurrency, ...targetCurrencies])];
  const swipeableRefs = useRef<Record<string, SwipeableMethods | null>>({});
  const openSwipeable = useRef<SwipeableMethods | null>(null);
  const result = evaluateExpression(expression, decimal);

  const descriptors = currencyOrder.flatMap<Omit<CurrencyInputRow, 'active' | 'value'>>((code) => {
    const providerRate = resolveRate('USD', code, rateCache, []);
    const provider = {
      code,
      customRate: null,
      factor: providerRate?.rate ?? null,
      key: `${code}-provider`,
      kind: 'provider' as const,
    };
    const custom = customRates
      .filter((rate) => rate.enabled && rate.quote === code)
      .map((rate) => {
        const baseRate = resolveRate('USD', rate.base, rateCache, []);
        return {
          code,
          customRate: rate,
          factor: baseRate ? baseRate.rate * rate.rate : null,
          key: `${code}-custom-${rate.base}`,
          kind: 'custom' as const,
        };
      });
    return [provider, ...custom];
  });
  const activeDescriptor = descriptors.find((row) => row.key === activeInputKey)
    ?? descriptors.find((row) => row.key === `${sourceCurrency}-provider`)
    ?? descriptors[0];
  const activeValue = exactActiveValue ?? (result.status === 'valid' ? result.value : null);
  const valueInUsd = activeValue !== null && activeDescriptor?.factor
    ? activeValue / activeDescriptor.factor
    : null;
  const rows: CurrencyInputRow[] = descriptors.map((row) => ({
    ...row,
    active: row.key === activeDescriptor?.key,
    value: valueInUsd !== null && row.factor !== null ? valueInUsd * row.factor : null,
  }));

  if (rows.length === 0) {
    rows.push({
      active: true,
      code: sourceCurrency,
      customRate: null,
      factor: null,
      key: `${sourceCurrency}-provider`,
      kind: 'provider',
      value: null,
    });
  }

  if (!initialized) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText tone="muted">Preparing your currencies…</AppText>
        </View>
      </Screen>
    );
  }
  if (!onboardingComplete) return <Redirect href="/onboarding" />;

  function updateExpression(next: string) {
    setExactActiveValue(null);
    setExpressionState({ decimal, text: next.slice(0, 80) });
  }

  function handleKey(key: string) {
    if (key === 'clear') return updateExpression('');
    if (key === 'backspace') return updateExpression(expression.slice(0, -1));
    if (key === 'equals') {
      if (result.status === 'valid') {
        setExactActiveValue(result.value);
        setExpressionState({
          decimal,
          text: formatEditableValue(result.value, formatLocale),
        });
        if (hapticsEnabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (hapticsEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    updateExpression(expression + key);
  }

  function activateInput(row: CurrencyInputRow) {
    setShowKeypad(true);
    if (row.active || row.factor === null) return;
    setExactActiveValue(row.value);
    setExpressionState({
      decimal,
      text: row.value === null ? '' : formatEditableValue(row.value, formatLocale),
    });
    setActiveInputKey(row.key);
    if (hapticsEnabled) void Haptics.selectionAsync();
  }

  const lastUpdate = rateCache
    ? formatRelativeUpdate(rateCache.fetchedAt, locale)
    : 'not available';

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keypadOverlayHeight + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => openSwipeable.current?.close()}
        scrollIndicatorInsets={{ bottom: keypadOverlayHeight }}
        testID="conversion-scroll"
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshRates(true)}
            tintColor={colors.accent}
          />
        )}
      >
        <View style={styles.pageHeader}>
          <AppText weight="extraBold" style={styles.displayTitle}>Convert</AppText>
          <AppText tone="muted" style={styles.status}>
            {rateCache ? `Live rates · ${lastUpdate}` : 'Rates unavailable'}
          </AppText>
        </View>

        {(storageNotice || error) ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.notice, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]}
          >
            <AppText tone={error ? 'danger' : 'muted'} style={styles.noticeText}>
              {error ?? storageNotice}
            </AppText>
          </View>
        ) : null}

        <View style={styles.currencyList}>
          {rows.map((row) => {
            const displayedValue = row.active
              ? expression
              : row.value === null
              ? '—'
              : formatConvertedValue(row.value, row.code, formatLocale);
            const canManage = !row.active && (row.kind === 'custom' || row.code !== sourceCurrency);
            return (
              <Swipeable
                childrenContainerStyle={{ backgroundColor: colors.background }}
                containerStyle={styles.swipeable}
                dragOffsetFromRightEdge={20}
                enabled={canManage}
                friction={2}
                key={row.key}
                onSwipeableClose={() => {
                  const current = swipeableRefs.current[row.key];
                  if (openSwipeable.current === current) openSwipeable.current = null;
                }}
                onSwipeableWillOpen={() => {
                  const current = swipeableRefs.current[row.key];
                  if (openSwipeable.current && openSwipeable.current !== current) {
                    openSwipeable.current.close();
                  }
                  openSwipeable.current = current;
                }}
                overshootRight={false}
                ref={(instance) => {
                  swipeableRefs.current[row.key] = instance;
                }}
                renderRightActions={canManage ? (_progress, _translation, methods) => (
                  <View style={styles.swipeActions}>
                    <Pressable
                      accessibilityLabel={`Edit ${row.kind === 'custom' ? 'custom ' : ''}${row.code} conversion rate`}
                      accessibilityRole="button"
                      onPress={() => {
                        methods.close();
                        router.push({
                          pathname: '/custom-rate',
                          params: row.customRate
                            ? { base: row.customRate.base, quote: row.customRate.quote }
                            : { base: sourceCurrency, quote: row.code },
                        });
                      }}
                      style={({ pressed }) => [
                        styles.swipeAction,
                        { backgroundColor: colors.surfaceRaised },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons color={colors.text} name="pencil" size={20} />
                      <AppText weight="bold" style={styles.swipeActionText}>Edit rate</AppText>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={row.kind === 'custom'
                        ? `Delete custom ${row.code} rate`
                        : `Delete ${row.code} conversion`}
                      accessibilityRole="button"
                      onPress={() => {
                        methods.close();
                        openSwipeable.current = null;
                        swipeableRefs.current[row.key] = null;
                        if (row.customRate) {
                          deleteCustomRate(row.customRate.base, row.customRate.quote);
                        } else {
                          removeTarget(row.code);
                        }
                        if (hapticsEnabled) void Haptics.selectionAsync();
                      }}
                      style={({ pressed }) => [
                        styles.swipeAction,
                        { backgroundColor: colors.danger },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons color={palette.white} name="trash" size={20} />
                      <AppText
                        weight="bold"
                        style={[styles.swipeActionText, { color: palette.white }]}
                      >
                        {row.kind === 'custom' ? 'Delete rate' : 'Delete'}
                      </AppText>
                    </Pressable>
                  </View>
                ) : undefined}
                rightThreshold={54}
                testID={`swipeable-${row.key}`}
              >
                <View
                  style={[
                    styles.currencyCard,
                    {
                      backgroundColor: row.active ? colors.surfaceRaised : colors.surface,
                      borderColor: row.active ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.currencyIdentity}>
                    <View style={styles.currencyTitleLine}>
                      <AppText weight="extraBold" style={styles.currencyCode}>{row.code}</AppText>
                      {row.kind === 'custom' ? (
                        <View style={[styles.customBadge, { borderColor: colors.accent }]}>
                          <AppText tone="accent" weight="bold" style={styles.customBadgeText}>CUSTOM</AppText>
                        </View>
                      ) : null}
                    </View>
                    {row.active ? (
                      <AppText tone="accent" weight="bold" style={styles.editingLabel}>EDITING</AppText>
                    ) : null}
                  </View>
                  <TextInput
                    accessibilityLabel={`${row.kind === 'custom' ? 'Custom ' : ''}${row.code} amount input`}
                    accessibilityHint={row.active
                      ? 'Enter a calculator expression'
                      : row.factor === null
                        ? 'A conversion rate is unavailable'
                        : 'Tap to edit this currency amount'}
                    allowFontScaling
                    autoCorrect={false}
                    cursorColor={colors.accent}
                    editable={row.active || row.factor !== null}
                    onChangeText={row.active ? updateExpression : undefined}
                    onFocus={() => activateInput(row)}
                    onPressIn={() => setShowKeypad(true)}
                    placeholder="—"
                    placeholderTextColor={colors.muted}
                    selectionColor={colors.accent}
                    showSoftInputOnFocus={false}
                    style={[
                      styles.amountInput,
                      {
                        color: row.kind === 'custom' ? colors.accent : colors.text,
                        fontSize: amountFontSize(displayedValue),
                      },
                    ]}
                    value={displayedValue}
                  />
                </View>
              </Swipeable>
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
          <AppText tone="muted" weight="bold">＋ Add currency</AppText>
        </Pressable>

      </ScrollView>
      <View
        onLayout={({ nativeEvent }) => {
          const nextHeight = nativeEvent.layout.height;
          setKeypadOverlayHeight((currentHeight) =>
            currentHeight === nextHeight ? currentHeight : nextHeight,
          );
        }}
        style={[
          styles.keypadOverlay,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          showKeypad && styles.keypadOverlayOpen,
        ]}
        testID="keypad-overlay"
      >
        <Pressable
          accessibilityLabel={showKeypad ? 'Hide keypad' : 'Show keypad'}
          accessibilityRole="button"
          onPress={() => setShowKeypad((visible) => !visible)}
          style={styles.keypadToggle}
        >
          <View style={styles.keypadToggleContent}>
            <Chevron
              color={colors.muted}
              direction={showKeypad ? 'down' : 'up'}
            />
            <AppText tone="muted" weight="semibold">
              {showKeypad ? 'Hide keypad' : 'Show keypad'}
            </AppText>
          </View>
        </Pressable>

        {showKeypad ? (
          <CalculatorKeypad
            decimalSeparator={decimal}
            hapticsEnabled={hapticsEnabled}
            onKey={handleKey}
          />
        ) : null}
      </View>
      <BottomNavigation active="convert" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: spacing.xl },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  displayTitle: { fontSize: typeScale.display, lineHeight: 43, letterSpacing: -1 },
  status: { flexShrink: 1, fontSize: typeScale.label, textAlign: 'right' },
  notice: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md },
  noticeText: { fontSize: typeScale.caption, lineHeight: 18 },
  currencyList: { gap: spacing.sm },
  swipeable: { borderRadius: radii.md, overflow: 'hidden' },
  swipeActions: { width: 176, flexDirection: 'row' },
  swipeAction: {
    width: 88,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  swipeActionText: { fontSize: 12, textAlign: 'center' },
  currencyCard: {
    minHeight: 64,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyIdentity: { flex: 1, minHeight: 48, justifyContent: 'center', paddingRight: spacing.sm },
  currencyTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currencyCode: { fontSize: 20, lineHeight: 27 },
  editingLabel: { fontSize: 10, letterSpacing: 0.8, marginTop: 1 },
  customBadge: { borderWidth: 1.5, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 3 },
  customBadgeText: { fontSize: 11 },
  amountInput: {
    width: '52%',
    minHeight: 48,
    padding: 0,
    fontFamily: fontFamilies.extraBold,
    fontSize: 27,
    lineHeight: 35,
    textAlign: 'right',
    letterSpacing: -0.4,
  },
  addButton: {
    minHeight: 52,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  keypadOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BOTTOM_NAVIGATION_HEIGHT,
    zIndex: 2,
    elevation: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  keypadOverlayOpen: { paddingBottom: spacing.md },
  keypadToggle: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadToggleContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.65 },
});
