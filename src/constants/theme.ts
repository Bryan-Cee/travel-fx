export const fontFamilies = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;

export const palette = {
  ink: '#101820',
  inkDeep: '#0B141C',
  slate: '#1A2530',
  slateRaised: '#223341',
  slateSelected: '#35495B',
  mist: '#9AA8B5',
  cloud: '#F2F5F7',
  mint: '#7CF0B5',
  mintInk: '#08231A',
  line: '#2B3C4B',
  danger: '#FF8B8B',
  sand: '#F3E8D2',
  white: '#FFFFFF',
} as const;

export type ThemeColors = {
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceRaised: string;
  surfaceSelected: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  border: string;
  danger: string;
  shadow: string;
  overlay: string;
};

export const lightColors: ThemeColors = {
  background: '#F3F6F5',
  backgroundDeep: '#E8EEEB',
  surface: '#FFFFFF',
  surfaceRaised: '#E5EEEA',
  surfaceSelected: '#D5E5DE',
  text: '#13211B',
  muted: '#5F7169',
  accent: '#137A4C',
  accentText: '#FFFFFF',
  border: '#CFDCD6',
  danger: '#A33A3A',
  shadow: '#14251D',
  overlay: 'rgba(16, 24, 32, 0.56)',
};

export const darkColors: ThemeColors = {
  background: palette.ink,
  backgroundDeep: palette.inkDeep,
  surface: palette.slate,
  surfaceRaised: palette.slateRaised,
  surfaceSelected: palette.slateSelected,
  text: palette.cloud,
  muted: palette.mist,
  accent: palette.mint,
  accentText: palette.mintInk,
  border: palette.line,
  danger: palette.danger,
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.62)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 14,
  pill: 999,
} as const;

export const typeScale = {
  display: 34,
  title: 24,
  heading: 19,
  body: 16,
  label: 14,
  caption: 13,
} as const;
