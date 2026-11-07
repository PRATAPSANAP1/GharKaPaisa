import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getColors = () => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved') || s.includes('active') || s.includes('success') || s.includes('completed') || s.includes('released')) {
      return { bg: colors.successSoft, text: colors.success, border: colors.success };
    }
    if (s.includes('pending') || s.includes('process') || s.includes('in_progress') || s.includes('review') || s.includes('hold')) {
      return { bg: colors.warningSoft, text: colors.warning, border: colors.warning };
    }
    if (s.includes('declined') || s.includes('rejected') || s.includes('blocked') || s.includes('failed') || s.includes('cancelled')) {
      return { bg: colors.errorSoft, text: colors.error, border: colors.error };
    }
    if (s.includes('draft') || s.includes('inactive')) {
      return { bg: colors.bgTertiary, text: colors.textMid, border: colors.borderLight };
    }
    return { bg: colors.infoSoft, text: colors.info, border: colors.info };
  };

  const c = getColors();
  const padV = size === 'md' ? 6 : 3;
  const fontSize = size === 'md' ? typography.sizes.sm : typography.sizes.xs;

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border, paddingVertical: padV }]}>
      <Text style={[styles.text, { color: c.text, fontSize }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    borderRadius: spacing.radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
