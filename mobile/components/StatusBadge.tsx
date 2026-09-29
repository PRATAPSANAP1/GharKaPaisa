import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColors = () => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved') || s.includes('active') || s.includes('success')) {
      return { bg: `${colors.success}20`, text: colors.success };
    }
    if (s.includes('pending') || s.includes('process') || s.includes('in_progress')) {
      return { bg: `${colors.warning}20`, text: colors.warning };
    }
    if (s.includes('declined') || s.includes('rejected') || s.includes('blocked')) {
      return { bg: `${colors.error}20`, text: colors.error };
    }
    return { bg: `${colors.info}20`, text: colors.info };
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: spacing.radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
});
