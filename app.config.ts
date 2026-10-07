import { ConfigContext, ExpoConfig } from 'expo/config';

const defaultVersion = '1.0.0';
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?$/;

function appVersion(): string {
  const version = process.env.APP_VERSION ?? defaultVersion;
  if (!semverPattern.test(version)) {
    throw new Error(`APP_VERSION must be semantic version text without a leading v; received "${version}".`);
  }
  return version;
}

function androidVersionCode(): number {
  const value = process.env.ANDROID_VERSION_CODE ?? '1';
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`ANDROID_VERSION_CODE must be a positive integer; received "${value}".`);
  }
  const versionCode = Number(value);
  if (!Number.isSafeInteger(versionCode) || versionCode > 2_100_000_000) {
    throw new Error('ANDROID_VERSION_CODE must be at most 2100000000.');
  }
  return versionCode;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const owner = process.env.EXPO_OWNER;
  const projectId = process.env.EAS_PROJECT_ID ?? process.env.EAS_BUILD_PROJECT_ID;

  return {
    ...config,
    name: 'Travel FX',
    slug: 'travel-fx',
    owner,
    version: appVersion(),
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'travelfx',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.bryancee.travelfx',
      supportsTablet: true,
    },
    android: {
      package: 'com.bryancee.travelfx',
      versionCode: androidVersionCode(),
      predictiveBackGestureEnabled: true,
    },
    web: {
      output: 'static',
      favicon: './assets/images/icon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#07172D',
          image: './assets/images/icon.png',
          imageWidth: 180,
          dark: {
            backgroundColor: '#07172D',
            image: './assets/images/icon.png',
          },
        },
      ],
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { projectId } } : {}),
    },
  };
};
