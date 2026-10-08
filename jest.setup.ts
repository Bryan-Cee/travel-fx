jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', currencyCode: 'USD' }],
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactModule: typeof import('react') = require('react');
  const { Text }: typeof import('react-native') = require('react-native');

  return {
    __esModule: true,
    default: ({
      name,
      ...props
    }: { name: string } & import('react-native').TextProps) =>
      ReactModule.createElement(Text, props, name),
  };
});

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const ReactModule: typeof import('react') = require('react');
  const { View }: typeof import('react-native') = require('react-native');
  const methods = {
    close: jest.fn(),
    openLeft: jest.fn(),
    openRight: jest.fn(),
    reset: jest.fn(),
  };

  return {
    __esModule: true,
    default: ({
      children,
      renderRightActions,
      testID,
    }: {
      children: React.ReactNode;
      renderRightActions?: (
        progress: { value: number },
        translation: { value: number },
        swipeableMethods: typeof methods,
      ) => React.ReactNode;
      testID?: string;
    }) => ReactModule.createElement(
      View,
      { testID },
      children,
      renderRightActions?.({ value: 1 }, { value: -1 }, methods),
    ),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
