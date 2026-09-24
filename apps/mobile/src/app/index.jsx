import { Redirect } from 'expo-router';
import { useAuthStore } from '@/utils/auth/store';
import { useProfileQuery } from '@/hooks/queries/useProfileQuery';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/utils/auth/useAuth';
import { useCachedOnboardingStatus } from '@/hooks/useCachedOnboardingStatus';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import BootstrapRecoveryState from '@/components/BootstrapRecoveryState';

export default function Index() {
  const { isReady, auth, authBootstrapError, authBootstrapRetrying } = useAuthStore();
  const { retry: retryAuth } = useAuth();
  const profileQuery = useProfileQuery();
  const { data: profile, isLoading, fetchStatus, isError, refetch } = profileQuery;
  const { status: cachedStatus, isLoading: isCachedStatusLoading } = useCachedOnboardingStatus(auth?.user?.id);
  const { isOffline } = useNetworkStatus();
  const onboardingCurrentStep = useAppStore((s) => s.onboardingCurrentStep);

  if (!isReady) return null;
  if (!auth) {
    if (authBootstrapError || authBootstrapRetrying) {
      return (
        <BootstrapRecoveryState
          title="You’re offline"
          message="We couldn't verify your session. Reconnect and try again; you have not been signed out."
          onRetry={retryAuth}
          isRetrying={authBootstrapRetrying}
        />
      );
    }
    return <Redirect href="/(auth)/welcome" />;
  }

  // A cached routing hint lets returning users enter the app without waiting
  // for the profile request. It is user-scoped and contains no profile/health
  // fields. Never infer onboarding from a failed request with no cached hint.
  const onboardingComplete = profile?.onboardingComplete ?? cachedStatus?.onboardingComplete;
  if (typeof onboardingComplete === 'boolean') {
    if (onboardingComplete) return <Redirect href="/(tabs)/home" />;
    const nextStep = onboardingCurrentStep > 0 ? onboardingCurrentStep + 1 : 1;
    return <Redirect href={`/(onboarding)/step-${nextStep}`} />;
  }

  if (!isCachedStatusLoading && (isOffline || fetchStatus === 'paused' || isError)) {
    return (
      <BootstrapRecoveryState
        title="Your profile is unavailable offline"
        message="Reconnect to load your profile. We won’t send you back through onboarding while your account is unverified."
        onRetry={refetch}
        isRetrying={isLoading && fetchStatus === 'fetching'}
      />
    );
  }

  // Keep the small online first-load transition quiet; unlike the old route,
  // this branch is never reached for a known offline user.
  if (isLoading || isCachedStatusLoading) return null;
  return (
    <BootstrapRecoveryState
      title="We couldn’t load your profile"
      message="Try again to continue."
      onRetry={refetch}
      isRetrying={isLoading}
    />
  );
}
