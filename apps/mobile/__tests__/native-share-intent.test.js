import { getSharedPayloads } from 'expo-sharing';
import { redirectSystemPath } from '@/app/+native-intent';

jest.mock('expo-sharing', () => ({
  getSharedPayloads: jest.fn(),
}));

describe('native share intent routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores a stale initial share URL after its payload was consumed', async () => {
    getSharedPayloads.mockReturnValue([]);

    await expect(redirectSystemPath({
      path: 'hemoscd://expo-sharing',
      initial: true,
    })).resolves.toBe('/');
  });

  it('opens a fresh initial share when its payload exists', async () => {
    getSharedPayloads.mockReturnValue([{ value: 'https://maps.apple.com/?q=Clinic' }]);

    await expect(redirectSystemPath({
      path: 'hemoscd://expo-sharing',
      initial: true,
    })).resolves.toBe('/handle-share');
  });

  it('accepts warm share intents without racing the native payload', async () => {
    await expect(redirectSystemPath({
      path: 'hemoscd://expo-sharing',
      initial: false,
    })).resolves.toBe('/handle-share');
    expect(getSharedPayloads).not.toHaveBeenCalled();
  });

  it('leaves ordinary app paths unchanged', async () => {
    await expect(redirectSystemPath({ path: '/(tabs)/home', initial: true }))
      .resolves.toBe('/(tabs)/home');
  });
});
