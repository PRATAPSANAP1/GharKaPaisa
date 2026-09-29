import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textMid,
  },
});
export default LoadingState;
