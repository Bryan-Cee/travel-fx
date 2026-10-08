import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type Destination = 'convert' | 'rates' | 'settings';
type IconName = ComponentProps<typeof Ionicons>['name'];

export const BOTTOM_NAVIGATION_HEIGHT = 72;

const destinations: {
  key: Destination;
  label: string;
  route: '/' | '/rates' | '/settings';
  icon: IconName;
  selectedIcon: IconName;
}[] = [
  {
    key: 'convert',
    label: 'Convert',
    route: '/',
    icon: 'swap-vertical-outline',
    selectedIcon: 'swap-vertical',
  },
  {
    key: 'rates',
    label: 'Rates',
    route: '/rates',
    icon: 'trending-up-outline',
    selectedIcon: 'trending-up',
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    icon: 'settings-outline',
    selectedIcon: 'settings',
  },
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
            <Ionicons
              accessibilityElementsHidden
              color={selected ? colors.accent : colors.muted}
              importantForAccessibility="no-hide-descendants"
              name={selected ? destination.selectedIcon : destination.icon}
              size={21}
              testID={`navigation-icon-${destination.key}`}
            />
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
    height: BOTTOM_NAVIGATION_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: spacing.xs,
  },
  item: {
    minHeight: 64,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: { fontSize: typeScale.caption, lineHeight: 18 },
  pressed: { opacity: 0.65 },
});
