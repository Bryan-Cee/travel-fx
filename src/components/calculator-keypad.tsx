import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type Key = {
  label: string;
  value: string;
  kind?: 'action' | 'operator' | 'equals';
  accessibilityLabel?: string;
};

const keys: Key[] = [
  { label: 'C', value: 'clear', kind: 'action', accessibilityLabel: 'Clear' },
  { label: '⌫', value: 'backspace', kind: 'action', accessibilityLabel: 'Backspace' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '÷', value: '÷', kind: 'operator', accessibilityLabel: 'Divide' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '×', value: '×', kind: 'operator', accessibilityLabel: 'Multiply' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '−', value: '-', kind: 'operator', accessibilityLabel: 'Subtract' },
  { label: '0', value: '0' },
  { label: '.', value: 'decimal', accessibilityLabel: 'Decimal separator' },
  { label: '=', value: 'equals', kind: 'equals', accessibilityLabel: 'Equals' },
  { label: '+', value: '+', kind: 'operator', accessibilityLabel: 'Add' },
];

export function CalculatorKeypad({
  decimalSeparator,
  hapticsEnabled,
  onKey,
}: {
  decimalSeparator: string;
  hapticsEnabled: boolean;
  onKey: (value: string) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View accessibilityLabel="Calculator keypad" style={styles.grid}>
      {keys.map((key) => {
        const display = key.value === 'decimal' ? decimalSeparator : key.label;
        const backgroundColor = key.kind === 'equals'
          ? colors.accent
          : key.kind === 'operator'
            ? colors.surfaceRaised
            : colors.surface;
        const tone = key.kind === 'equals' ? 'primary' : key.kind ? 'accent' : 'primary';
        return (
          <Pressable
            accessibilityLabel={key.accessibilityLabel ?? display}
            accessibilityRole="button"
            key={`${key.value}-${key.label}`}
            onPress={() => {
              if (hapticsEnabled) void Haptics.selectionAsync();
              onKey(key.value === 'decimal' ? decimalSeparator : key.value);
            }}
            style={({ pressed }) => [
              styles.key,
              { backgroundColor },
              pressed && styles.pressed,
            ]}
          >
            <AppText
              weight="bold"
              tone={key.kind === 'equals' ? 'primary' : tone}
              style={[styles.keyLabel, key.kind === 'equals' && { color: colors.accentText }]}
            >
              {display}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  key: {
    minHeight: 58,
    width: '23%',
    flexGrow: 1,
    flexBasis: '21%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  keyLabel: { fontSize: 23, lineHeight: 29 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
