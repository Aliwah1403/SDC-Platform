import * as SecureStore from 'expo-secure-store';

// This is intentionally metadata-only. Health/profile fields belong in the
// encrypted local repository planned for the next milestone, not in this
// bootstrap hint.
export const PROFILE_BOOTSTRAP_KEY = 'hemo.profile-bootstrap.v1';

async function readCachedMetadata() {
  try {
    const raw = await SecureStore.getItemAsync(PROFILE_BOOTSTRAP_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (typeof cached?.userId !== 'string' || typeof cached.onboardingComplete !== 'boolean') {
      return null;
    }
    return {
      userId: cached.userId,
      onboardingComplete: cached.onboardingComplete,
      cachedAt: typeof cached.cachedAt === 'number' ? cached.cachedAt : null,
    };
  } catch {
    return null;
  }
}

export async function readCachedOnboardingMetadata() {
  return readCachedMetadata();
}

export async function readCachedOnboardingStatus(userId) {
  if (!userId) return null;
  const cached = await readCachedMetadata();
  return cached?.userId === userId ? cached : null;
}

export async function clearCachedOnboardingStatus() {
  try {
    await SecureStore.deleteItemAsync(PROFILE_BOOTSTRAP_KEY);
  } catch {
    // Best-effort cleanup; a storage failure must not block sign-out.
  }
}

export async function cacheOnboardingStatus(userId, onboardingComplete) {
  if (!userId || typeof onboardingComplete !== 'boolean') return;
  try {
    await SecureStore.setItemAsync(
      PROFILE_BOOTSTRAP_KEY,
      JSON.stringify({ userId, onboardingComplete, cachedAt: Date.now() }),
    );
  } catch (error) {
    // SecureStore can be unavailable in a restricted device configuration.
    // Caching is an optimization and must never break profile rendering.
    console.warn('[ProfileBootstrap] Failed to cache onboarding status:', error?.message ?? error);
  }
}
