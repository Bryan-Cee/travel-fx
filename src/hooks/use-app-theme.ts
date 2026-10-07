import { useColorScheme } from 'react-native';

import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((state) => state.themePreference);
  const scheme = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  return { scheme, palette: colors[scheme] };
}
