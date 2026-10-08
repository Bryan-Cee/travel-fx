import { Text, TextProps } from 'react-native';

import { fontFamilies } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type AppTextProps = TextProps & {
  weight?: keyof typeof fontFamilies;
  tone?: 'primary' | 'muted' | 'accent' | 'danger';
};

export function AppText({
  style,
  weight = 'regular',
  tone = 'primary',
  allowFontScaling = true,
  ...props
}: AppTextProps) {
  const { colors } = useAppTheme();
  const color = tone === 'muted'
    ? colors.muted
    : tone === 'accent'
      ? colors.accent
      : tone === 'danger'
        ? colors.danger
        : colors.text;

  return (
    <Text
      {...props}
      allowFontScaling={allowFontScaling}
      style={[{ color, fontFamily: fontFamilies[weight] }, style]}
    />
  );
}
