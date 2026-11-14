import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Always launch directly into the Home page
  return <Redirect href="/(auth)/home" />;
}