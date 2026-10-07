import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { minTouch, radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAppStore } from '@/store/use-app-store';

type Props = {
  decimalSeparator: string;
  onKey: (key: string) => void;
};

const rows = [
  ['C', '(', ')', '⌫'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
];

export function CalculatorKeypad({ decimalSeparator, onKey }: Props) {
  const { palette } = useAppTheme();
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);
  const press = (key: string) => {
    if (hapticsEnabled) {
      void Haptics.selectionAsync().catch((error: unknown) => console.warn('Haptic feedback failed', error));
    }
    onKey(key === '.' ? decimalSeparator : key);
  };
  return (
    <View style={styles.keypad} accessibilityLabel="Calculator keypad">
      {rows.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => {
            const emphasized = ['÷', '×', '-', '+', '='].includes(key);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === '⌫' ? 'Backspace' : key === 'C' ? 'Clear' : key}
                onPress={() => press(key)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: emphasized ? palette.primary : palette.surfaceAlt,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Text
                  maxFontSizeMultiplier={1.4}
                  style={[styles.keyText, { color: emphasized ? palette.onPrimary : palette.text }]}>
                  {key === '.' ? decimalSeparator : key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  key: {
    flex: 1,
    minHeight: minTouch,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 22, fontWeight: '600' },
});
