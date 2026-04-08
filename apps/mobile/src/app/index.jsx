import { Redirect } from 'expo-router';
import { useAuthStore } from '@/utils/auth/store';
import { useProfileQuery } from '@/hooks/queries/useProfileQuery';

export default function Index() {
  const { isReady, auth } = useAuthStore();
  const { data: profile, isLoading } = useProfileQuery();

  // Wait for auth to initialise before redirecting
  if (!isReady) return null;
  if (!auth) return <Redirect href="/(auth)/welcome" />;
  // Wait for profile to load before deciding onboarding state
  if (isLoading) return null;
  if (!profile?.onboardingComplete) return <Redirect href="/(onboarding)/step-1" />;
  return <Redirect href="/(tabs)/home" />;
}
