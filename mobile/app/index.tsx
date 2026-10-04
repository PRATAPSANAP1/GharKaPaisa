import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from '../components/LoadingState';

export default function Index() {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return <LoadingState message="Checking session..." />;
  }

  if (isAuthenticated) {
    // Redirect based on role
    if (userRole === 'SUPER_ADMIN') {
      return <Redirect href="/(app)/super-admin" />;
    }
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Redirect href="/(auth)/home" />;
}
