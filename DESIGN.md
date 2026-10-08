# Design System

<!-- impeccable:design-schema 1 -->

## Direction

Travel FX is a compact travel instrument: dense enough to compare several currencies quickly, calm enough to trust in a queue or at a checkout, and unmistakably interactive without decorative noise. The supplied `Currency Converter App.html` defines the replacement visual world.

The interface uses deep ink and layered slate in dark mode, paper-like pale surfaces in light mode, and mint as the single interaction and custom-rate signal. Layouts are squared, deliberate, and space-efficient with restrained 6–14 point radii.

## Mode

Operate.

## Color Roles

| Role | Dark | Light | Use |
|---|---|---|---|
| Background | `#101820` | `#F3F6F5` | Primary screen canvas |
| Background deep | `#0B141C` | `#E8EEEB` | Navigation and recessed surfaces |
| Surface | `#1A2530` | `#FFFFFF` | Cards, grouped settings, keys |
| Raised surface | `#223341` | `#E5EEEA` | Operators and secondary actions |
| Selected surface | `#35495B` | `#D5E5DE` | Borders, disabled tracks, selection support |
| Primary text | `#F2F5F7` | `#13211B` | Values, headings, controls |
| Muted text | `#9AA8B5` | `#5F7169` | Rates, timestamps, explanation |
| Accent | `#7CF0B5` | `#137A4C` | Active navigation, custom rates, primary actions |
| Accent text | `#08231A` | `#FFFFFF` | Text on filled accent controls |
| Danger | `#FF8B8B` | `#A33A3A` | Destructive actions and errors |

Use accent once per decision. It signals action, active navigation, and user-supplied custom values; it is not decoration.

## Typography

Manrope is bundled through Expo Font with named static weights:

- ExtraBold: screen titles, amounts, currency codes, and primary results.
- Bold: controls, row titles, selected navigation, and custom-rate badges.
- SemiBold: secondary controls and compact labels.
- Medium: text inputs.
- Regular: body copy, timestamps, and explanations.

The type scale is centralized in `src/constants/theme.ts`. Top-level titles use 34/43. Body copy uses 16/24. Compact metadata uses 13–14. All text continues to allow font scaling; values use one-line fitting rather than truncation where possible.

## Layout

- Respect platform safe areas on every screen.
- Use 20-point horizontal page insets on compact phones.
- Top-level screens use a persistent three-destination navigation bar: Convert, Rates, Settings.
- Cards are stacked with 8–12 point gaps and avoid shadows; tonal surface contrast carries hierarchy.
- Minimum touch targets are 48 points on Android and therefore also clear the iOS 44-point requirement.
- On wider devices, content remains readable and stable rather than stretching values into decorative whitespace.

## Components

### Currency inputs

Every saved currency is a compact single-line amount input. Tapping a row activates it in place, clears its existing amount, opens the calculator, and leaves a blank field ready for a new expression; the row does not jump or change list position. The active row uses an accent border and explicit Editing label. Currency identity and an optional Custom badge occupy the left, while the editable or converted amount occupies the right. An active custom override adds a second, badged row directly after the original provider conversion so both values remain visible. Detailed rate context lives in the Rates screen rather than increasing converter-row height. Swiping any removable row—including the active input—left reveals pair-specific Edit rate and Delete actions; deleting a custom row removes only its override, while deleting the provider row removes the currency and safely transfers the working amount to the default row. Starting a vertical list scroll closes an open action tray.

### Calculator keypad

A compact four-column grid uses surface keys, raised operator keys, and one filled mint equals key. It remains fixed above the bottom navigation while conversion cards scroll behind it, with a permanently available aligned chevron control to hide or reveal it. Parentheses remain available despite the reference artifact omitting them because precedence and grouped expressions are product requirements.

### Rates management

Each pair card shows resolved and live rate context, a prominent Set custom or Reset to live action, and accessible controls for target reordering and removal.

### Settings

Use grouped tonal lists and native switches. Only real product settings are shown. Default currency and number-format rows open focused modal pickers; appearance remains a three-option segmented control; custom rates remain manageable here through enable, edit, and delete actions.

### Bottom navigation

Each destination pairs a page-specific icon above its text label: exchange arrows for Convert, a trend line for Rates, and a gear for Settings. Selected destinations use filled mint icons and labels; inactive destinations use muted outlined icons.

### Modals

Currency selection and custom-rate editing use self-contained modal routes with visible Cancel actions and system dismissal/back behavior. Custom-rate editing keeps the preview close to the rate input and places Save as the fixed primary action.

## Interaction & Motion

- Preserve native navigation transitions and platform back gestures.
- Press feedback uses opacity and a restrained 0.98 scale only on keypad keys.
- Haptics are subtle and user-controlled.
- No decorative continuous animation is used; reduced-motion users therefore receive equivalent behavior without a special alternate sequence.

## Accessibility

- Use semantic button, tab, radio-group, and switch roles.
- Announce recoverable storage and rate errors.
- Never encode Custom status or errors by color alone.
- Keep labels explicit for editable currency amounts, active-source changes, rate management, and keypad operations.
- Preserve readable contrast in both color schemes and retain locale-aware numeric formatting.
