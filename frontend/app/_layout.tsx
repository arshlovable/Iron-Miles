import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import { useOneSignal } from '../src/lib/useOneSignal';

function AuthGate() {
  const { session, loading } = useAuth();
  const { onboardingComplete, onboardingLoading } = useOnboarding();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading || onboardingLoading) return;

    const isOnboardingRoute = segments[0] === '(onboarding)';
    const isAuthRoute = segments[0] === 'auth';

    // Already signed in — clear auth/onboarding routes
    if (session && (isAuthRoute || isOnboardingRoute)) {
      router.replace('/(tabs)');
      return;
    }

    // No session, onboarding not complete — send to onboarding
    if (!session && !onboardingComplete && !isOnboardingRoute) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    // No session, onboarding done — send to auth
    if (!session && onboardingComplete && !isAuthRoute) {
      router.replace('/auth');
      return;
    }
  }, [loading, onboardingLoading, router, segments, session, onboardingComplete]);

  if (loading || onboardingLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4A843" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#080808' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="generate-workout"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="driver-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="achievements" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="workout-log" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="route-metrics" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="reminders" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="help-support" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="equipment-setup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings-workout-reminders" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings-hydration-reminders" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="milestone-alerts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="units-measurement" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="workout-defaults" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="theme-settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms-of-service" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="exercise-detail"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="workout-category"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="workout-in-progress"
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="workout-ready"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="workout-complete"
          options={{
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useOneSignal();

  return (
    <AuthProvider>
      <OnboardingProvider>
        <AuthGate />
      </OnboardingProvider>
    </AuthProvider>
  );
}
