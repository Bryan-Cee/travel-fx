import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useAppStore } from '@/store/use-app-store';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { scheme, palette } = useAppTheme();
  const initialize = useAppStore((state) => state.initialize);
  const initialized = useAppStore((state) => state.initialized);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized) void SplashScreen.hideAsync();
  }, [initialized]);

  if (!initialized) return null;
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen
          name="currency-picker"
          options={{ title: 'Add currency', presentation: 'modal' }}
        />
        <Stack.Screen
          name="custom-rate"
          options={{ title: 'Custom rate', presentation: 'modal' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
