import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Button } from './Button';

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Something went wrong',
  onRetry,
}) => (
  <View style={styles.center}>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && <Button title="Retry" onPress={onRetry} variant="outline" style={{ marginTop: spacing.md }} />}
  </View>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    textAlign: 'center',
  },
});

export default ErrorState;
