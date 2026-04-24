import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';

const STEP_MAP = {
  'step-1':  { step: 1,        name: 'nickname' },
  'meet':    { step: 'meet',   name: 'intro_animation' },
  'step-2':  { step: 2,        name: 'date_of_birth' },
  'step-3':  { step: 3,        name: 'scd_type' },
  'step-4':  { step: 4,        name: 'emergency_contacts' },
  'step-5':  { step: 5,        name: 'check_in_time' },
  'step-6':  { step: 6,        name: 'biometrics' },
  'step-7':  { step: 7,        name: 'body_stats' },
  'step-8':  { step: 8,        name: 'hospital' },
  'step-9':  { step: 9,        name: 'medications' },
  'step-10': { step: 10,       name: 'health_data' },
  'step-11': { step: 11,       name: 'notifications' },
  'complete': { step: 'complete', name: 'complete' },
};

function OnboardingTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();

  useEffect(() => {
    const segment = pathname.split('/').pop();
    const info = STEP_MAP[segment];
    if (info) {
      posthog?.capture('onboarding_step_viewed', { step: info.step, screen_name: info.name });
    }
  }, [pathname]);

  return null;
}

export default function OnboardingLayout() {
  return (
    <>
    <OnboardingTracker />
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="step-1" />
      <Stack.Screen name="meet" options={{ animation: 'fade' }} />
      <Stack.Screen name="step-2" />
      <Stack.Screen name="step-3" />
      <Stack.Screen name="step-4" />
      <Stack.Screen name="step-5" />
      <Stack.Screen name="step-6" />
      <Stack.Screen name="step-7" />
      <Stack.Screen name="step-8" />
      <Stack.Screen name="step-9" />
      <Stack.Screen name="step-10" />
      <Stack.Screen name="step-11" />
      <Stack.Screen name="complete" options={{ animation: 'fade' }} />
    </Stack>
    </>
  );
}
