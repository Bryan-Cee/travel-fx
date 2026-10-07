import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { minTouch, radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Currency } from '@/types';

type Props = {
  currencies: Currency[];
  excluded?: string[];
  onSelect: (currency: Currency) => void;
};

export function CurrencyList({ currencies, excluded = [], onSelect }: Props) {
  const { palette } = useAppTheme();
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
        onChangeText={setQuery}
        placeholder="Search code or currency"
        placeholderTextColor={palette.muted}
        style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
        value={query}
      />
      <FlatList
        data={filtered}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.code}
        ListEmptyComponent={<Text style={[styles.empty, { color: palette.muted }]}>No matching currencies</Text>}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.name}, ${item.code}`}
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.item,
              { borderBottomColor: palette.border, opacity: pressed ? 0.6 : 1 },
            ]}>
            <View style={styles.codeBlock}>
              <Text style={[styles.code, { color: palette.text }]}>{item.code}</Text>
              <Text numberOfLines={1} style={[styles.name, { color: palette.muted }]}>{item.name}</Text>
            </View>
            <Text style={[styles.symbol, { color: palette.primary }]}>{item.symbol}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.md },
  search: {
    minHeight: minTouch,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
  item: {
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  codeBlock: { flex: 1 },
  code: { fontSize: 17, fontWeight: '700' },
  name: { fontSize: 14, marginTop: 2 },
  symbol: { fontSize: 20, fontWeight: '600' },
  empty: { padding: spacing.xl, textAlign: 'center' },
});
