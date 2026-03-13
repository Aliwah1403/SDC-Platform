import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
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
      <Stack.Screen name="complete" options={{ animation: 'fade' }} />
    </Stack>
  );
}
