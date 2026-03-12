import { Redirect } from 'expo-router';
import { useAuthStore } from '@/utils/auth/store';
import { useAppStore } from '@/store/appStore';

export default function Index() {
  const { auth } = useAuthStore();
  const { onboardingComplete } = useAppStore();

  if (!auth) return <Redirect href="/(auth)/welcome" />;
  if (!onboardingComplete) return <Redirect href="/(onboarding)/step-1" />;
  return <Redirect href="/(tabs)/home" />;
}
