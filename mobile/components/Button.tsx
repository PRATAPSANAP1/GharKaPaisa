import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Gradient } from './Gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'gold' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  size = 'md',
}) => {
  const { colors, isDark } = useTheme();
  const isGradient = variant === 'primary' || variant === 'gold';

  const getBackgroundColor = () => {
    if (disabled) return colors.inputBg;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.bgSecondary;
      case 'danger': return colors.error;
      case 'outline': return 'transparent';
      case 'gold': return colors.gold;
      case 'ghost': return 'transparent';
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textLight;
    if (variant === 'outline' || variant === 'ghost') return colors.primary;
    if (variant === 'secondary') return colors.text;
    if (variant === 'gold') return '#1A1207';
    return '#FFFFFF';
  };

  const getGradientColors = () => {
    return variant === 'gold' ? colors.gradientGold : colors.gradientPrimary;
  };

  const paddingY = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
  const fontSize = size === 'sm' ? typography.sizes.sm : size === 'lg' ? typography.sizes.lg : typography.sizes.md;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontSize }, textStyle]}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
      )}
    </>
  );

  if (isGradient && !disabled) {
    return (
      <Gradient
        colors={getGradientColors()}
        borderRadius={spacing.radius.md}
        style={[
          styles.button,
          {
            paddingVertical: paddingY,
            shadowColor: variant === 'gold' ? colors.gold : colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.35 : 0.2,
            shadowRadius: 8,
            elevation: 4,
          },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.85}
          style={styles.touchable}
        >
          {content}
        </TouchableOpacity>
      </Gradient>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: paddingY,
          borderWidth: variant === 'outline' ? 1.5 : variant === 'secondary' ? 1 : 0,
          borderColor: variant === 'outline' ? colors.primary : variant === 'secondary' ? colors.border : 'transparent',
        },
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    borderRadius: spacing.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  text: {
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
});

export default Button;
