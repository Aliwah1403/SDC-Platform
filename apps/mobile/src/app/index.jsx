import { Redirect } from 'expo-router';
import { useAuthStore } from '@/utils/auth/store';
import { useProfileQuery } from '@/hooks/queries/useProfileQuery';
import { useAppStore } from '@/store/appStore';

export default function Index() {
  const { isReady, auth } = useAuthStore();
  const { data: profile, isLoading } = useProfileQuery();
  const onboardingCurrentStep = useAppStore((s) => s.onboardingCurrentStep);

  if (!isReady) return null;
  if (!auth) return <Redirect href="/(auth)/welcome" />;
  if (isLoading) return null;
  if (!profile?.onboardingComplete) {
    const nextStep = onboardingCurrentStep > 0 ? onboardingCurrentStep + 1 : 1;
    return <Redirect href={`/(onboarding)/step-${nextStep}`} />;
  }
  return <Redirect href="/(tabs)/home" />;
}
