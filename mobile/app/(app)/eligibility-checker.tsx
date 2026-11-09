import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import CardEligibilityChecker from '../../components/CardEligibilityChecker';

export default function EligibilityCheckerScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <CardEligibilityChecker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
