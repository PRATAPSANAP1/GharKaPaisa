import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import {
  parseDeepLinkUrl,
  isDuplicateLinkEvent,
  savePendingDestination,
} from '../services/deeplink.service';

export const useDeepLinking = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Handle incoming URL event (warm start / app running in background)
    const handleUrlEvent = async (event: { url: string }) => {
      if (!event.url) return;
      if (isDuplicateLinkEvent(event.url)) return;

      const parsed = parseDeepLinkUrl(event.url);
      if (!parsed) return;

      if (isAuthenticated) {
        console.log(`[DeepLinkHook] Navigating to authenticated target: ${parsed.fullTarget}`);
        router.push(parsed.fullTarget as any);
      } else {
        console.log(`[DeepLinkHook] User not authenticated. Saving pending target: ${parsed.fullTarget}`);
        await savePendingDestination(parsed.fullTarget);
        router.replace('/(auth)/login');
      }
    };

    // Handle initial URL (cold start / app completely closed)
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleUrlEvent({ url: initialUrl });
      }
    });

    const subscription = Linking.addEventListener('url', handleUrlEvent);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isLoading]);
};
