import { useEffect } from 'react';
import { Platform } from 'react-native';
import { OneSignal, type NotificationClickEvent } from 'react-native-onesignal';

/**
 * Initializes OneSignal once at app root. Safe no-op when App ID is missing or on web.
 */
export function useOneSignal(): void {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID?.trim();
    if (!appId) {
      if (__DEV__) {
        console.warn('[OneSignal] EXPO_PUBLIC_ONESIGNAL_APP_ID is not set; push notifications disabled.');
      }
      return;
    }

    try {
      OneSignal.initialize(appId);
      OneSignal.Notifications.requestPermission(false);

      const onNotificationClick = (_event: NotificationClickEvent) => {
        if (__DEV__) {
          console.log('[OneSignal] notification clicked');
        }
      };

      OneSignal.Notifications.addEventListener('click', onNotificationClick);

      return () => {
        OneSignal.Notifications.removeEventListener('click', onNotificationClick);
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[OneSignal] initialization failed:', error);
      }
    }
  }, []);
}
