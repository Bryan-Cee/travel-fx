import { StyleSheet, View } from 'react-native';

export function Chevron({
  color,
  direction,
  size = 7,
}: {
  color: string;
  direction: 'up' | 'down';
  size?: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.chevron,
        {
          borderColor: color,
          height: size,
          width: size,
          transform: [{ rotate: direction === 'down' ? '45deg' : '225deg' }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  chevron: {
    borderBottomWidth: 1.75,
    borderRightWidth: 1.75,
  },
});
