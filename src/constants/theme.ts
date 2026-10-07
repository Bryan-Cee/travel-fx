export const colors = {
  light: {
    background: '#F7F3E8',
    surface: '#FFFDF7',
    surfaceAlt: '#E9E4D6',
    text: '#17372A',
    muted: '#5F6F66',
    primary: '#1F6B4F',
    primaryPressed: '#17503C',
    onPrimary: '#FFFFFF',
    border: '#CBD4CC',
    danger: '#A33D35',
    warning: '#8A5A00',
    shadow: '#0B261A',
  },
  dark: {
    background: '#102219',
    surface: '#193027',
    surfaceAlt: '#263E34',
    text: '#F6F1E5',
    muted: '#BCC8C0',
    primary: '#6FC49A',
    primaryPressed: '#8FD6B1',
    onPrimary: '#102219',
    border: '#40584C',
    danger: '#FFAAA3',
    warning: '#FFD17A',
    shadow: '#000000',
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radii = { sm: 10, md: 16, lg: 24, pill: 999 };
export const minTouch = 44;
