import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { fontFamilies, radii, spacing, typeScale } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Currency } from '@/types';

type Props = {
  currencies: Currency[];
  excluded?: string[];
  onSelect: (currency: Currency) => void;
};

export function CurrencyList({ currencies, excluded = [], onSelect }: Props) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return currencies.filter(
      (currency) =>
        !excluded.includes(currency.code) &&
        (!needle ||
          currency.code.toLocaleLowerCase().includes(needle) ||
          currency.name.toLocaleLowerCase().includes(needle)),
    );
  }, [currencies, excluded, query]);

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Search currencies"
        autoCapitalize="characters"
        clearButtonMode="while-editing"
        cursorColor={colors.accent}
        onChangeText={setQuery}
        placeholder="Search code or currency"
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        style={[
          styles.search,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
        ]}
        value={query}
      />
      <FlatList
        data={filtered}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.code}
        ListEmptyComponent={(
          <AppText tone="muted" style={styles.empty}>No matching currencies</AppText>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.name}, ${item.code}`}
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.item,
              { borderBottomColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.codeBlock}>
              <AppText weight="bold" style={styles.code}>{item.code}</AppText>
              <AppText tone="muted" numberOfLines={1} style={styles.name}>{item.name}</AppText>
            </View>
            <AppText tone="accent" weight="semibold" style={styles.symbol}>{item.symbol}</AppText>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.md },
  search: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamilies.medium,
    fontSize: typeScale.body,
  },
  item: {
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  codeBlock: { flex: 1 },
  code: { fontSize: 17 },
  name: { fontSize: 14, marginTop: 2 },
  symbol: { fontSize: 20 },
  empty: { padding: spacing.xl, textAlign: 'center' },
  pressed: { opacity: 0.62 },
});
