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
  key: string;
  kind: 'provider' | 'custom';
  value: number | null;
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
    deleteCustomRate,
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

  const targets = useMemo<TargetResult[]>(() => targetCurrencies.flatMap((code) => {
    const providerRate = resolveRate(sourceCurrency, code, rateCache, []);
    const providerTarget: TargetResult = {
      code,
      key: `${code}-provider`,
      kind: 'provider',
      value: providerRate && sourceValue !== null ? sourceValue * providerRate.rate : null,
    };
    const customRate = resolveRate(sourceCurrency, code, rateCache, customRates);
    if (!customRate?.isCustom) return [providerTarget];
    return [
      providerTarget,
      {
        code,
        key: `${code}-custom`,
        kind: 'custom',
        value: sourceValue !== null ? sourceValue * customRate.rate : null,
      },
    ];
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
              onPressIn={() => setShowKeypad(true)}
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
              : formatConvertedValue(target.value, target.code, locale, expanded[target.key]);
            return (
              <Swipeable
                childrenContainerStyle={{ backgroundColor: colors.background }}
                containerStyle={styles.swipeable}
                dragOffsetFromRightEdge={20}
                friction={2}
                key={target.key}
                onSwipeableClose={() => {
                  const current = swipeableRefs.current[target.key];
                  if (openSwipeable.current === current) openSwipeable.current = null;
                }}
                onSwipeableWillOpen={() => {
                  const current = swipeableRefs.current[target.key];
                  if (openSwipeable.current && openSwipeable.current !== current) {
                    openSwipeable.current.close();
                  }
                  openSwipeable.current = current;
                }}
                overshootRight={false}
                ref={(instance) => {
                  swipeableRefs.current[target.key] = instance;
                }}
                renderRightActions={(_progress, _translation, methods) => (
                  <View style={styles.swipeActions}>
                    <Pressable
                      accessibilityLabel={`Edit ${target.kind === 'custom' ? 'custom ' : ''}${target.code} conversion rate`}
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
                      accessibilityLabel={target.kind === 'custom'
                        ? `Delete custom ${target.code} rate`
                        : `Delete ${target.code} conversion`}
                      accessibilityRole="button"
                      onPress={() => {
                        methods.close();
                        if (target.kind === 'custom') {
                          const custom = customRates.find((item) => item.enabled && (
                            (item.base === sourceCurrency && item.quote === target.code) ||
                            (item.base === target.code && item.quote === sourceCurrency)
                          ));
                          if (custom) deleteCustomRate(custom.base, custom.quote);
                        } else {
                          removeTarget(target.code);
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
                        {target.kind === 'custom' ? 'Delete rate' : 'Delete'}
                      </AppText>
                    </Pressable>
                  </View>
                )}
                rightThreshold={54}
                testID={`swipeable-${target.key}`}
              >
                <View style={[styles.targetCard, { backgroundColor: colors.surface }]}>
                  <Pressable
                    accessibilityLabel={`${target.kind === 'custom' ? 'Custom ' : ''}${target.code} ${target.value ?? 'unavailable'}`}
                    accessibilityHint="Tap to promote. Swipe left to edit its rate or remove it."
                    accessibilityRole="button"
                    disabled={target.value === null}
                    onPress={() => promote(target)}
                    style={({ pressed }) => [styles.targetIdentity, pressed && styles.pressed]}
                  >
                    <View style={styles.targetTitleLine}>
                      <AppText weight="extraBold" style={styles.targetCode}>{target.code}</AppText>
                      {target.kind === 'custom' ? (
                        <View style={[styles.customBadge, { borderColor: colors.accent }]}>
                          <AppText tone="accent" weight="bold" style={styles.customBadgeText}>CUSTOM</AppText>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`${expanded[target.key] ? 'Use native precision for' : 'Show up to six decimals for'} ${target.kind === 'custom' ? 'custom ' : ''}${target.code}`}
                    accessibilityRole="button"
                    disabled={target.value === null}
                    onPress={() => setExpanded((current) => ({ ...current, [target.key]: !current[target.key] }))}
                    style={({ pressed }) => [styles.targetValueArea, pressed && styles.pressed]}
                  >
                    <AppText
                      adjustsFontSizeToFit
                      minimumFontScale={0.62}
                      numberOfLines={1}
                      tone={target.kind === 'custom' ? 'accent' : 'primary'}
                      weight="extraBold"
                      style={styles.targetValue}
                    >
                      {converted}
                    </AppText>
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
    minHeight: 92,
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.md,
  },
  sourceCurrency: {
    width: 88,
    minHeight: 76,
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
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  swipeActionText: { fontSize: 12, textAlign: 'center' },
  targetCard: {
    minHeight: 64,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIdentity: { flex: 1, minHeight: 48, justifyContent: 'center', paddingRight: spacing.sm },
  targetTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  targetCode: { fontSize: 20, lineHeight: 27 },
  customBadge: { borderWidth: 1.5, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 3 },
  customBadgeText: { fontSize: 11 },
  targetValueArea: { width: '45%', minHeight: 48, alignItems: 'flex-end', justifyContent: 'center' },
  targetValue: { width: '100%', fontSize: 27, lineHeight: 35, textAlign: 'right', letterSpacing: -0.4 },
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
