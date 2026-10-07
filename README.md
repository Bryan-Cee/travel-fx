# Travel FX

Travel FX is an offline-friendly iOS and Android currency converter built with Expo SDK 57, Expo Router, React Native, TypeScript, and Zustand. It supports one editable source, any number of simultaneous targets, a safe calculator expression parser, reciprocal pair-specific custom rates, system/manual themes, and locale-aware formatting.

## Run locally

Requirements: Node.js 20 or newer, npm, and Expo Go or a simulator.

```bash
npm ci
npm start
```

Scan the QR code with Expo Go, or press `i`, `a`, or `w` for iOS, Android, or web.

## Commands

```bash
npm start          # Expo development server
npm run ios        # Open the iOS target
npm run android    # Open the Android target
npm run web        # Open the web target
npm run typecheck  # Strict TypeScript check
npm run lint       # Expo ESLint rules
npm test           # Unit and component tests
npx expo-doctor    # Validate Expo dependencies and config
```

## Architecture

- `src/app`: Expo Router screens and modal flows.
- `src/components`: reusable React Native primitive components.
- `src/store`: Zustand orchestration and persisted user state.
- `src/services`: Frankfurter API client, cross-rate/custom-rate resolution, expression parser, locale formatting, and versioned persistence.
- `src/constants`: centralized forest-green and sand design tokens.
- `src/i18n`: English strings separated for future localization.

The calculator uses a purpose-built tokenizer and recursive-descent parser. It never uses `eval`; incomplete input remains editable and invalid input is surfaced. Provider rates are cached as a USD snapshot and cross-rates are derived locally without reducing internal precision.

## Rates, offline use, and custom rates

[Frankfurter v2](https://frankfurter.dev/) provides current fiat reference rates blended from central banks and official sources. Each provider rate retains its own source date, while the cache separately stores when Travel FX fetched it. The app refreshes on launch only when the cache is at least 12 hours old, supports pull-to-refresh, and keeps the last successful snapshot available offline. Fetch and storage errors remain visible without discarding usable cached data.

A custom rate is stored as `1 BASE = X QUOTE`. It must be positive and finite, takes precedence only for that currency pair, and automatically applies in reverse using its reciprocal. Custom rates remain saved until disabled or deleted in Settings.

Frankfurter rates are mid-market references and may blend multiple official providers. Travel FX is reference only - not for trading.

## Privacy and scope

Travel FX has no account, backend, ads, analytics, purchases, crypto, precious metals, or historical charts. Frankfurter requests require no API key and carry no user identity. All preferences, cached rates, and custom rates stay in local AsyncStorage under a runtime-validated, versioned schema.

## Tests and CI

Jest covers parser behavior, cross-rate math, reciprocal overrides, cache freshness, currency precision, persistence migration/reset behavior, and primary converter workflows. GitHub Actions runs type-checking, linting, tests, and Expo Doctor for every push and pull request.
