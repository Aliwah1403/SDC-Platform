jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import {
  cacheOnboardingStatus,
  readCachedOnboardingStatus,
} from '@/utils/auth/profileBootstrap';

describe('profile bootstrap metadata', () => {
  beforeEach(() => jest.clearAllMocks());

  test('accepts only the cached status for the current user', async () => {
    SecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify({ userId: 'user-a', onboardingComplete: true, cachedAt: 123 }),
    );

    await expect(readCachedOnboardingStatus('user-a')).resolves.toEqual({
      userId: 'user-a',
      onboardingComplete: true,
      cachedAt: 123,
    });
    await expect(readCachedOnboardingStatus('user-b')).resolves.toBeNull();
  });

  test('writes routing metadata without profile fields', async () => {
    await cacheOnboardingStatus('user-a', false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'hemo.profile-bootstrap.v1',
      expect.stringMatching(/^\{"userId":"user-a","onboardingComplete":false,"cachedAt":\d+\}$/),
    );
  });
});
