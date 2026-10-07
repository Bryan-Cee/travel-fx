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

Jest covers parser behavior, cross-rate math, reciprocal overrides, cache freshness, currency precision, persistence migration/reset behavior, and primary converter workflows. GitHub Actions runs type-checking, linting, tests, and Expo Doctor for pull requests and pushes to `main`.

## Android APK releases

Pushing to `main` runs validation only; it never publishes a release. A pushed strict semantic-version tag such as `v1.2.3` or `v1.2.3-beta.1` runs the same checks, waits for an EAS cloud build using the `release-apk` profile, downloads the signed installable APK, and attaches it to the GitHub Release for that tag. The tag (minus `v`), Expo app version, APK version name, and GitHub Release version therefore match. The Android `versionCode` uses the monotonically increasing GitHub Actions run number.

One-time release setup:

1. Create or select the Expo project under the Expo account that will own Travel FX. From a trusted local checkout, sign in with `npx eas-cli@latest login`, then run `npx eas-cli@latest init` to link the app.
2. In the GitHub repository's **Settings → Secrets and variables → Actions → Variables**, add `EXPO_OWNER` with the Expo account name and `EAS_PROJECT_ID` with the UUID printed by `eas init` (also visible as `extra.eas.projectId` in the generated Expo configuration).
3. Create an [Expo personal access token](https://docs.expo.dev/accounts/programmatic-access/) for that account. Add it as the repository Actions secret `EXPO_TOKEN`. Never commit the token.
4. Before relying on CI, initialize EAS-managed Android signing credentials interactively once:

   ```bash
   EXPO_OWNER=your-expo-account \
   EAS_PROJECT_ID=your-project-uuid \
   npx eas-cli@latest build --platform android --profile release-apk
   ```

   The first Android build may prompt to generate a keystore. Later non-interactive CI builds reuse those remote credentials. `EXPO_OWNER` and `EAS_PROJECT_ID` are public linkage values; the workflow writes them and the derived version values into its temporary EAS profile so the cloud worker resolves the same dynamic app config. The temporary profile is never committed.

Create and push a release tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

After the workflow completes, download the APK from the matching entry on the repository's **Releases** page. The workflow can also be started manually from **Actions → Android APK release** with an explicit semantic version. Manual runs retain the APK under that workflow run's **Artifacts** section but deliberately do not create or modify a public GitHub Release.
