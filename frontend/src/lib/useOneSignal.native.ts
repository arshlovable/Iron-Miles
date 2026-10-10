import { useEffect } from 'react';

/**
 * Initializes OneSignal once at app root on iOS and Android.
 * Web uses useOneSignal.web.ts so react-native-onesignal is never bundled.
 */
export function useOneSignal(): void {
  useEffect(() => {
    const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID?.trim();
    if (!appId) {
      if (__DEV__) {
        console.warn('[OneSignal] EXPO_PUBLIC_ONESIGNAL_APP_ID is not set; push notifications disabled.');
      }
      return;
    }

    let cancelled = false;
    let removeListener: (() => void) | undefined;

    void (async () => {
      try {
        const { OneSignal } = await import('react-native-onesignal');
        if (cancelled) return;

        OneSignal.initialize(appId);
        OneSignal.Notifications.requestPermission(false);

        const onNotificationClick = () => {
          if (__DEV__) {
            console.log('[OneSignal] notification clicked');
          }
        };

        OneSignal.Notifications.addEventListener('click', onNotificationClick);
        removeListener = () => {
          OneSignal.Notifications.removeEventListener('click', onNotificationClick);
        };
      } catch (error) {
        if (__DEV__) {
          console.warn('[OneSignal] initialization failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);
}
