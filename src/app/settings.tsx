import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Screen } from '@/components/screen';
import { radii, spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatRelativeUpdate } from '@/services/format';
import { useAppStore } from '@/store/use-app-store';
import { ThemePreference } from '@/types';

const appearanceOptions: { label: string; value: ThemePreference }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

export default function SettingsScreen() {
  const {
    themePreference,
    hapticsEnabled,
    customRates,
    rateCache,
    refreshing,
    setThemePreference,
    setHaptics,
    toggleCustomRate,
    deleteCustomRate,
    refreshRates,
    resetApp,
  } = useAppStore();
  const { colors, locale } = useAppTheme();
  const switchColors = {
    false: colors.surfaceSelected,
    true: colors.accent,
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText weight="extraBold" style={styles.title}>Settings</AppText>

        <SectionLabel>Appearance</SectionLabel>
        <View
          accessibilityRole="radiogroup"
          style={[styles.segmented, { backgroundColor: colors.surface }]}
        >
          {appearanceOptions.map((option) => {
            const selected = themePreference === option.value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => setThemePreference(option.value)}
                style={({ pressed }) => [
                  styles.segment,
                  selected && { backgroundColor: colors.accent },
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  weight="bold"
                  style={selected ? { color: colors.accentText } : undefined}
                >
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Feedback</SectionLabel>
        <View style={[styles.group, { backgroundColor: colors.surface }]}>
          <SettingRow
            description="Subtle confirmation while using the keypad"
            title="Haptics"
          >
            <Switch
              accessibilityLabel="Haptics"
              onValueChange={setHaptics}
              thumbColor={hapticsEnabled ? colors.accentText : colors.muted}
              trackColor={switchColors}
              value={hapticsEnabled}
            />
          </SettingRow>
        </View>

        <SectionLabel>Rates</SectionLabel>
        <View style={[styles.group, { backgroundColor: colors.surface }]}>
          <View style={styles.refreshRow}>
            <View style={styles.rowCopy}>
              <AppText weight="bold">Last updated</AppText>
              <AppText tone="muted" style={styles.description}>
                {rateCache ? formatRelativeUpdate(rateCache.fetchedAt, locale) : 'No saved rates'}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={refreshing}
              onPress={() => void refreshRates(true)}
              style={styles.textAction}
            >
              <AppText tone="accent" weight="bold">
                {refreshing ? 'Refreshing…' : 'Refresh now'}
              </AppText>
            </Pressable>
          </View>
        </View>

        <SectionLabel>Custom rates</SectionLabel>
        <View style={[styles.group, { backgroundColor: colors.surface }]}>
          {customRates.length === 0 ? (
            <View style={styles.emptyCustom}>
              <AppText tone="muted">
                No custom rates. Set one from the Rates tab.
              </AppText>
            </View>
          ) : customRates.map((custom, index) => (
            <View
              key={`${custom.base}-${custom.quote}`}
              style={[
                styles.customRow,
                index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <View style={styles.rowCopy}>
                <AppText weight="bold">{custom.base} → {custom.quote}</AppText>
                <AppText tone="muted" style={styles.description}>
                  1 {custom.base} = {custom.rate} {custom.quote}
                </AppText>
              </View>
              <Switch
                accessibilityLabel={`Enable ${custom.base} to ${custom.quote} custom rate`}
                onValueChange={(enabled) => toggleCustomRate(custom.base, custom.quote, enabled)}
                thumbColor={custom.enabled ? colors.accentText : colors.muted}
                trackColor={switchColors}
                value={custom.enabled}
              />
              <Pressable
                accessibilityLabel={`Edit ${custom.base} to ${custom.quote} custom rate`}
                accessibilityRole="button"
                onPress={() => router.push({
                  pathname: '/custom-rate',
                  params: { base: custom.base, quote: custom.quote },
                })}
                style={styles.iconAction}
              >
                <AppText tone="accent" weight="bold">Edit</AppText>
              </Pressable>
              <Pressable
                accessibilityLabel={`Delete ${custom.base} to ${custom.quote} custom rate`}
                accessibilityRole="button"
                onPress={() => deleteCustomRate(custom.base, custom.quote)}
                style={styles.iconAction}
              >
                <AppText tone="danger" weight="bold">×</AppText>
              </Pressable>
            </View>
          ))}
        </View>

        <SectionLabel>About rates</SectionLabel>
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <AppText weight="bold">Frankfurter v2</AppText>
          <AppText tone="muted" style={styles.infoCopy}>
            Travel FX uses Frankfurter’s blended reference rates and derives cross-rates locally.
            Rates are cached for offline use, and fetched time is kept separate from each provider
            source date.
          </AppText>
          <AppText tone="muted" weight="semibold" style={styles.infoCopy}>
            Reference only—not for trading.
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Alert.alert(
              'Reset Travel FX?',
              'This removes saved currencies, custom rates, preferences, and cached data.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => void resetApp() },
              ],
            );
          }}
          style={({ pressed }) => [
            styles.reset,
            { borderColor: colors.danger },
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="danger" weight="bold">Reset local app data</AppText>
        </Pressable>
      </ScrollView>
      <BottomNavigation active="settings" />
    </Screen>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText tone="muted" weight="extraBold" style={styles.sectionLabel}>
      {children.toLocaleUpperCase()}
    </AppText>
  );
}

function SettingRow({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.rowCopy}>
        <AppText weight="bold" style={styles.settingTitle}>{title}</AppText>
        <AppText tone="muted" style={styles.description}>{description}</AppText>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typeScale.display, lineHeight: 43, letterSpacing: -1 },
  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.9,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  segmented: { minHeight: 56, borderRadius: radii.md, padding: 4, flexDirection: 'row' },
  segment: { flex: 1, minHeight: 48, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  group: { borderRadius: radii.md, overflow: 'hidden' },
  settingRow: { minHeight: 92, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  refreshRow: { minHeight: 88, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowCopy: { flex: 1 },
  settingTitle: { fontSize: 17 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  textAction: { minHeight: 48, justifyContent: 'center' },
  emptyCustom: { minHeight: 76, justifyContent: 'center', padding: spacing.lg },
  customRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.lg },
  iconAction: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  infoCard: { borderRadius: radii.md, padding: spacing.lg },
  infoCopy: { fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  reset: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  pressed: { opacity: 0.65 },
});
