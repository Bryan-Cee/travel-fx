import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
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
  formatPlainNumber,
  formatRelativeUpdate,
  getDecimalSeparator,
} from '@/services/format';
import { resolveRate } from '@/services/rates';
import { useAppStore } from '@/store/use-app-store';

type TargetResult = {
  code: string;
  value: number | null;
  liveValue: number | null;
  liveRate: ReturnType<typeof resolveRate>;
  rate: ReturnType<typeof resolveRate>;
};

export default function ConverterScreen() {
  const {
    initialized,
    onboardingComplete,
    sourceCurrency,
    targetCurrencies,
    hapticsEnabled,
    customRates,
    rateCache,
    refreshing,
    error,
    storageNotice,
    setExpressionSource,
    removeTarget,
    refreshRates,
  } = useAppStore();
  const { colors, locale } = useAppTheme();
  const decimal = getDecimalSeparator(locale);
  const [expression, setExpression] = useState('1');
  const [showKeypad, setShowKeypad] = useState(true);
  const [keypadOverlayHeight, setKeypadOverlayHeight] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const swipeableRefs = useRef<Record<string, SwipeableMethods | null>>({});
  const openSwipeable = useRef<SwipeableMethods | null>(null);
  const result = useMemo(() => evaluateExpression(expression, decimal), [expression, decimal]);
  const sourceValue = result.status === 'valid' ? result.value : null;

  const targets = useMemo<TargetResult[]>(() => targetCurrencies.map((code) => {
    const rate = resolveRate(sourceCurrency, code, rateCache, customRates);
    const liveRate = resolveRate(sourceCurrency, code, rateCache, []);
    return {
      code,
      value: rate && sourceValue !== null ? sourceValue * rate.rate : null,
      liveValue: liveRate && sourceValue !== null ? sourceValue * liveRate.rate : null,
      liveRate,
      rate,
    };
  }), [customRates, rateCache, sourceCurrency, sourceValue, targetCurrencies]);

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
    setExpression(next.slice(0, 80));
  }

  function handleKey(key: string) {
    if (key === 'clear') return updateExpression('');
    if (key === 'backspace') return updateExpression(expression.slice(0, -1));
    if (key === 'equals') {
      if (result.status === 'valid') {
        updateExpression(formatPlainNumber(result.value, locale, 12));
        if (hapticsEnabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (hapticsEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    updateExpression(expression + key);
  }

  function promote(target: TargetResult) {
    if (target.value === null) return;
    const nextTargets = [sourceCurrency, ...targetCurrencies.filter((code) => code !== target.code)];
    setExpressionSource(target.code, nextTargets);
    updateExpression(formatPlainNumber(target.value, locale, 12));
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

        <View style={[styles.sourceCard, { backgroundColor: colors.surface }]}>
          <Pressable
            accessibilityLabel={`Change source currency, currently ${sourceCurrency}`}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/currency-picker', params: { mode: 'source' } })}
            style={({ pressed }) => [
              styles.sourceCurrency,
              { backgroundColor: colors.backgroundDeep },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.sourceCurrencyContent}>
              <AppText weight="bold" style={styles.sourceCurrencyText}>{sourceCurrency}</AppText>
              <Chevron color={colors.text} direction="down" />
            </View>
          </Pressable>
          <View style={styles.expressionColumn}>
            <TextInput
              accessibilityLabel={`${sourceCurrency} expression ${expression}`}
              accessibilityHint="Enter a calculator expression"
              allowFontScaling
              autoCorrect={false}
              cursorColor={colors.accent}
              onChangeText={updateExpression}
              onFocus={() => setShowKeypad(true)}
              placeholder="0"
              placeholderTextColor={colors.muted}
              selectionColor={colors.accent}
              showSoftInputOnFocus={false}
              style={[styles.expressionInput, { color: colors.muted }]}
              value={expression}
            />
            <AppText
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              numberOfLines={1}
              weight="extraBold"
              style={styles.sourceResult}
            >
              {sourceValue === null ? '—' : formatConvertedValue(sourceValue, sourceCurrency, locale, true)}
            </AppText>
          </View>
        </View>

        <View style={styles.targetList}>
          {targets.map((target) => {
            const converted = target.value === null
              ? '—'
              : formatConvertedValue(target.value, target.code, locale, expanded[target.code]);
            const meta = target.rate
              ? `1 ${sourceCurrency} = ${formatConvertedValue(target.rate.rate, target.code, locale, true)}`
              : 'Rate unavailable';
            return (
              <Swipeable
                childrenContainerStyle={{ backgroundColor: colors.background }}
                containerStyle={styles.swipeable}
                dragOffsetFromRightEdge={20}
                friction={2}
                key={target.code}
                onSwipeableClose={() => {
                  const current = swipeableRefs.current[target.code];
                  if (openSwipeable.current === current) openSwipeable.current = null;
                }}
                onSwipeableWillOpen={() => {
                  const current = swipeableRefs.current[target.code];
                  if (openSwipeable.current && openSwipeable.current !== current) {
                    openSwipeable.current.close();
                  }
                  openSwipeable.current = current;
                }}
                overshootRight={false}
                ref={(instance) => {
                  swipeableRefs.current[target.code] = instance;
                }}
                renderRightActions={(_progress, _translation, methods) => (
                  <View style={styles.swipeActions}>
                    <Pressable
                      accessibilityLabel={`Edit ${target.code} conversion rate`}
                      accessibilityRole="button"
                      onPress={() => {
                        methods.close();
                        router.push({
                          pathname: '/custom-rate',
                          params: { base: sourceCurrency, quote: target.code },
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
                      accessibilityLabel={`Delete ${target.code} conversion`}
                      accessibilityRole="button"
                      onPress={() => {
                        methods.close();
                        removeTarget(target.code);
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
                        Delete
                      </AppText>
                    </Pressable>
                  </View>
                )}
                rightThreshold={54}
                testID={`swipeable-${target.code}`}
              >
                <View style={[styles.targetCard, { backgroundColor: colors.surface }]}>
                  <Pressable
                    accessibilityLabel={`${target.code} ${target.value ?? 'unavailable'}`}
                    accessibilityHint="Tap to promote. Swipe left to edit its rate or remove it."
                    accessibilityRole="button"
                    disabled={target.value === null}
                    onPress={() => promote(target)}
                    style={({ pressed }) => [styles.targetIdentity, pressed && styles.pressed]}
                  >
                    <View style={styles.targetTitleLine}>
                      <AppText weight="extraBold" style={styles.targetCode}>{target.code}</AppText>
                      {target.rate?.isCustom ? (
                        <View style={[styles.customBadge, { borderColor: colors.accent }]}>
                          <AppText tone="accent" weight="bold" style={styles.customBadgeText}>CUSTOM</AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText tone="muted" numberOfLines={1} style={styles.rateMeta}>
                      {meta}
                      {target.rate?.isCustom && target.liveRate
                        ? ` · live ${formatConvertedValue(target.liveRate.rate, target.code, locale, true)}`
                        : ''}
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`${expanded[target.code] ? 'Use native precision for' : 'Show up to six decimals for'} ${target.code}`}
                    accessibilityRole="button"
                    disabled={target.value === null}
                    onPress={() => setExpanded((current) => ({ ...current, [target.code]: !current[target.code] }))}
                    style={({ pressed }) => [styles.targetValueArea, pressed && styles.pressed]}
                  >
                    <AppText
                      adjustsFontSizeToFit
                      minimumFontScale={0.62}
                      numberOfLines={1}
                      tone={target.rate?.isCustom ? 'accent' : 'primary'}
                      weight="extraBold"
                      style={styles.targetValue}
                    >
                      {converted}
                    </AppText>
                    {target.rate?.isCustom && target.liveValue !== null ? (
                      <AppText tone="muted" numberOfLines={1} style={styles.liveValue}>
                        Live {formatConvertedValue(target.liveValue, target.code, locale)}
                      </AppText>
                    ) : null}
                  </Pressable>
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
  sourceCard: {
    minHeight: 104,
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.md,
  },
  sourceCurrency: {
    width: 88,
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  sourceCurrencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceCurrencyText: { fontSize: 16 },
  expressionColumn: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: spacing.md },
  expressionInput: {
    width: '100%',
    padding: 0,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  sourceResult: { width: '100%', fontSize: 31, lineHeight: 40, textAlign: 'right', letterSpacing: -0.7 },
  targetList: { gap: spacing.sm },
  swipeable: { borderRadius: radii.md, overflow: 'hidden' },
  swipeActions: { width: 176, flexDirection: 'row' },
  swipeAction: {
    width: 88,
    minHeight: 106,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  swipeActionText: { fontSize: 12, textAlign: 'center' },
  targetCard: {
    minHeight: 106,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIdentity: { flex: 1, minHeight: 64, justifyContent: 'center', paddingRight: spacing.sm },
  targetTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  targetCode: { fontSize: 20, lineHeight: 27 },
  customBadge: { borderWidth: 1.5, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 3 },
  customBadgeText: { fontSize: 11 },
  rateMeta: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  targetValueArea: { width: '45%', minHeight: 60, alignItems: 'flex-end', justifyContent: 'center' },
  targetValue: { width: '100%', fontSize: 27, lineHeight: 35, textAlign: 'right', letterSpacing: -0.4 },
  liveValue: { fontSize: 12, lineHeight: 17, textAlign: 'right' },
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
