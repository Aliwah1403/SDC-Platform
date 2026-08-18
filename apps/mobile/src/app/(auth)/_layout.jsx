import { Stack } from 'expo-router';
import { ObserveInteractive } from '@/components/ObserveInteractive';

export default function AuthLayout() {
  return (
    <>
      <ObserveInteractive />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-code" />
      <Stack.Screen name="reset-password" />
      </Stack>
    </>
  );
}
