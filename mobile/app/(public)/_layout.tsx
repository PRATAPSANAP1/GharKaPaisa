import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="apply" />
      <Stack.Screen name="bank-cards" />
      <Stack.Screen name="card-benefits" />
      <Stack.Screen name="careers" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="customer-upload" />
      <Stack.Screen name="policy" />
      <Stack.Screen name="track-application" />
    </Stack>
  );
}
