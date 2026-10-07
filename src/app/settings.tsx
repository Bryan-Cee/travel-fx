import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { minTouch, radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAppStore } from '@/store/use-app-store';
import { ThemePreference } from '@/types';

export default function SettingsScreen() {
  const { palette } = useAppTheme();
  const haptics = useAppStore((state) => state.hapticsEnabled);
  const theme = useAppStore((state) => state.themePreference);
  const customRates = useAppStore((state) => state.customRates);
  const setHaptics = useAppStore((state) => state.setHaptics);
  const setTheme = useAppStore((state) => state.setThemePreference);
  const toggleCustom = useAppStore((state) => state.toggleCustomRate);
  const deleteCustom = useAppStore((state) => state.deleteCustomRate);
  const resetApp = useAppStore((state) => state.resetApp);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="Appearance">
          <View style={styles.segment}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ checked: theme === option }}
                onPress={() => setTheme(option)}
                style={[
                  styles.segmentItem,
                  { backgroundColor: theme === option ? palette.primary : palette.surfaceAlt },
                ]}>
                <Text style={{ color: theme === option ? palette.onPrimary : palette.text, fontWeight: '700' }}>
                  {option[0].toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Feedback">
          <View style={[styles.row, { borderColor: palette.border }]}>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: palette.text }]}>Subtle haptics</Text>
              <Text style={[styles.description, { color: palette.muted }]}>Feedback for keypad and successful calculations</Text>
            </View>
            <Switch value={haptics} onValueChange={setHaptics} trackColor={{ true: palette.primary }} />
          </View>
        </Section>

        <Section title="Custom rates">
          {customRates.length === 0 ? (
            <Text style={[styles.description, { color: palette.muted }]}>
              Create pair-specific rates from any currency card on the converter.
            </Text>
          ) : (
            customRates.map((rate) => (
              <View key={`${rate.base}-${rate.quote}`} style={[styles.customCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={styles.rowText}>
                  <Text style={[styles.label, { color: palette.text }]}>1 {rate.base} = {rate.rate} {rate.quote}</Text>
                  <Text style={[styles.description, { color: palette.muted }]}>
                    Saved {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(rate.savedAt))}
                  </Text>
                </View>
                <Switch
                  accessibilityLabel={`${rate.enabled ? 'Disable' : 'Enable'} ${rate.base} to ${rate.quote} custom rate`}
                  value={rate.enabled}
                  onValueChange={(enabled) => toggleCustom(rate.base, rate.quote, enabled)}
                  trackColor={{ true: palette.primary }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${rate.base} to ${rate.quote} custom rate`}
                  onPress={() => deleteCustom(rate.base, rate.quote)}
                  style={styles.deleteButton}>
                  <Text style={[styles.deleteText, { color: palette.danger }]}>Delete</Text>
                </Pressable>
              </View>
            ))
          )}
        </Section>

        <Section title="Rates & privacy">
          <Text style={[styles.body, { color: palette.text }]}>
            Current fiat reference rates come from Frankfurter v2, which blends rates from central banks and official providers. Different pairs can carry different source dates.
          </Text>
          <Text style={[styles.body, { color: palette.text }]}>
            Travel FX refreshes at launch when saved rates are at least 12 hours old. The last successful snapshot remains available offline. “Fetched at” is stored separately from each rate’s source date.
          </Text>
          <Text style={[styles.body, { color: palette.text }]}>
            No accounts, ads, analytics, or purchase tracking. Rate requests are anonymous. Reference only — not for trading.
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              void Linking.openURL('https://frankfurter.dev/').catch((error: unknown) =>
                Alert.alert('Could not open link', error instanceof Error ? error.message : 'Try again later.'),
              );
            }}
            style={styles.link}>
            <Text style={[styles.linkText, { color: palette.primary }]}>Frankfurter documentation ↗</Text>
          </Pressable>
        </Section>

        <Section title="Local data">
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert('Reset Travel FX?', 'This removes saved currencies, rates, and settings from this device.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => void resetApp() },
              ])
            }
            style={[styles.reset, { borderColor: palette.danger }]}>
            <Text style={[styles.resetText, { color: palette.danger }]}>Reset all local data</Text>
          </Pressable>
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: palette.primary }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xxl },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  segment: { flexDirection: 'row', gap: spacing.sm },
  segmentItem: { flex: 1, minHeight: minTouch, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  customCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deleteButton: { minWidth: minTouch, minHeight: minTouch, justifyContent: 'center' },
  deleteText: { fontSize: 13, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  link: { minHeight: minTouch, justifyContent: 'center' },
  linkText: { fontSize: 15, fontWeight: '700' },
  reset: { minHeight: minTouch, borderWidth: 1, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: 15, fontWeight: '800' },
});
