import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
  glow?: boolean;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevated = false,
  glow = false,
  padding,
}) => {
  const { colors, isDark } = useTheme();

  const dynamicCardStyle: ViewStyle = {
    backgroundColor: elevated ? colors.bgTertiary : colors.card,
    borderColor: elevated ? colors.borderLight : colors.border,
    ...(glow
      ? {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.15,
          shadowRadius: 12,
          elevation: 6,
        }
      : {}),
    ...(padding !== undefined ? { padding } : {}),
  };

  const cardStyle = [styles.baseCard, dynamicCardStyle, style];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default Card;
