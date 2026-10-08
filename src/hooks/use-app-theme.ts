import { getLocales } from 'expo-localization';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((state) => state.themePreference);
  const scheme = preference === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : preference;

  return {
    scheme,
    isDark: scheme === 'dark',
    colors: scheme === 'dark' ? darkColors : lightColors,
    locale: getLocales()[0]?.languageTag ?? 'en-US',
  };
}
