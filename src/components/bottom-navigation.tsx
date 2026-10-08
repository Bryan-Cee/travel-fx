import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type Destination = 'convert' | 'rates' | 'settings';

const destinations: { key: Destination; label: string; route: '/' | '/rates' | '/settings' }[] = [
  { key: 'convert', label: 'Convert', route: '/' },
  { key: 'rates', label: 'Rates', route: '/rates' },
  { key: 'settings', label: 'Settings', route: '/settings' },
];

export function BottomNavigation({ active }: { active: Destination }) {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { backgroundColor: colors.backgroundDeep, borderTopColor: colors.border }]}
    >
      {destinations.map((destination) => {
        const selected = destination.key === active;
        return (
          <Pressable
            key={destination.key}
            accessibilityLabel={`Open ${destination.label.toLowerCase()}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            hitSlop={4}
            onPress={() => {
              if (!selected) router.replace(destination.route);
            }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <AppText
              tone={selected ? 'accent' : 'muted'}
              weight={selected ? 'bold' : 'semibold'}
              style={styles.label}
            >
              {destination.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: spacing.xs,
  },
  item: {
    minHeight: 56,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: typeScale.label },
  pressed: { opacity: 0.65 },
});
