import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Button } from './Button';

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Something went wrong',
  onRetry,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.center, { backgroundColor: colors.bg }]}>
      <Text style={[styles.errorText, { color: colors.error }]}>{message}</Text>
      {onRetry && <Button title="Retry" onPress={onRetry} variant="outline" style={{ marginTop: spacing.md }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
});

export default ErrorState;
