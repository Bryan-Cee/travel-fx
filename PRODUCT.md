# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

International travelers who need quick, trustworthy fiat currency conversions while planning or moving through places where connectivity may be unreliable.

## Product Purpose

Travel FX presents every saved currency as an editable amount. Tapping any row makes that currency the active calculation source and updates every other row immediately. It combines a safe calculator, current reference rates, persistent offline data, and pair-specific custom rates so travelers can compare provider rates with the rate they can actually obtain.

## Positioning

The product treats conversion as an active travel utility: users can calculate expressions from any currency row, compare any number of currencies simultaneously, choose a preferred default currency and number format, and override only the real-world currency pairs where their card or exchange desk differs from the reference rate.

## Operating Context

The app is used one-handed on iOS and Android, often while traveling, comparing prices, checking a card or street-exchange rate, or working without a reliable network connection.

## Capabilities and Constraints

- Expo SDK 57, Expo Router, React Native primitives, TypeScript, and Zustand.
- Multiple persisted editable currency inputs with one active calculation source and a safe calculator parser without `eval`.
- Frankfurter v2 blended fiat rates, local cross-rate derivation, 12-hour cache freshness, manual refresh, and offline fallback.
- Positive finite pair-specific custom rates with automatic reciprocal behavior and pair-only precedence.
- No accounts, backend, ads, analytics, purchases, historical charts, crypto, or precious metals.
- English interface with localization-ready structure and locale-aware number and currency formatting.

## Brand Commitments

- Product name: Travel FX.
- The attached `Currency Converter App.html` is the binding visual reference for the redesigned interface.
- The supplied Travel FX PNG remains the production app icon.
- Voice is direct, calm, and practical rather than financial or promotional.

## Evidence on Hand

- Working converter, calculator, persistence, rates, custom-rate, and settings implementation under `src/`.
- Binding multi-screen visual reference supplied as `Currency Converter App.html`.
- Production icon at `assets/images/icon.png`.
- Automated unit and component tests covering the primary workflows.

## Product Principles

- Keep the current amount and converted values readable at a glance.
- Keep useful cached data visible when networks or providers fail.
- Make custom rates explicit and reversible without contaminating unrelated pairs.
- Preserve fast one-handed operation and familiar platform navigation.
- Never present reference rates as trading or settlement prices.

## Accessibility & Inclusion

Support screen readers and announcements, Dynamic Type-friendly layouts, 44pt or larger controls, contrast-safe light and dark themes, reduced-motion behavior, and locale-aware formatting.
