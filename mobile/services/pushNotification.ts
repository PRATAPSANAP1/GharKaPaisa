import { Platform } from 'react-native';
import notificationService from './notification.service';

/**
 * Initializes and registers device push notification token.
 * Gracefully handles Android/iOS native environments where Firebase may or may not be initialized.
 */
export const registerPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;

  try {
    // Dynamic import to prevent crash in non-native or unsupported runtimes
    const messagingModule = require('@react-native-firebase/messaging');
    const messaging = messagingModule.default || messagingModule;

    if (!messaging) return null;

    // 1. Request permission
    const authStatus = await messaging().requestPermission();
    const isAuthorized =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!isAuthorized) {
      console.log('[PushNotifications] User denied push notification permissions.');
      return null;
    }

    // 2. Fetch FCM token
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('[PushNotifications] Obtained FCM Token:', fcmToken.substring(0, 16) + '...');
      // 3. Register token with backend
      await notificationService.registerDevicePushToken(fcmToken, Platform.OS);
    }

    // 4. Listen for token refreshes
    messaging().onTokenRefresh(async (newToken: string) => {
      console.log('[PushNotifications] Token refreshed, re-registering with backend');
      await notificationService.registerDevicePushToken(newToken, Platform.OS);
    });

    // 5. Listen for foreground notifications
    messaging().onMessage(async (remoteMessage: any) => {
      console.log('[PushNotifications] Foreground push notification received:', remoteMessage?.notification?.title);
    });

    return fcmToken;
  } catch (error) {
    // Graceful degradation when running in Expo Go or environment without native Google Services
    console.warn('[PushNotifications] Firebase Messaging unavailable or not configured:', error);
    return null;
  }
};
