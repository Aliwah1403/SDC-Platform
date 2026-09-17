jest.mock('@/utils/auth/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
  signOut: jest.fn(),
}));

jest.mock('@/utils/auth/profileBootstrap', () => ({
  clearCachedOnboardingStatus: jest.fn(),
  readCachedOnboardingMetadata: jest.fn(),
}));

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { supabase } from '@/utils/auth/supabase';
import { readCachedOnboardingMetadata } from '@/utils/auth/profileBootstrap';
import { useAuth } from '@/utils/auth/useAuth';
import { useAuthReconnect } from '@/hooks/useAuthReconnect';
import { useAuthStore } from '@/utils/auth/store';

function Probe({ onReady }) {
  onReady(useAuth());
  return null;
}

function ReconnectProbe({ isOnline, onReady }) {
  const authApi = useAuth();
  const isOfflineBootstrap = useAuthStore((state) => state.auth?.isOfflineBootstrap === true);
  const isRetrying = useAuthStore((state) => state.authBootstrapRetrying);
  useAuthReconnect({ isOnline, isOfflineBootstrap, isRetrying, retry: authApi.retry });
  onReady(authApi);
  return null;
}

describe('offline auth bootstrap', () => {
  let authApi;
  let tree;

  beforeEach(() => {
    jest.clearAllMocks();
    authApi = null;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    act(() => useAuthStore.setState({
      isReady: false,
      auth: null,
      authBootstrapError: null,
      authBootstrapRetrying: false,
    }));
  });

  afterEach(() => {
    act(() => tree?.unmount());
    console.warn.mockRestore();
    tree = null;
  });

  test('uses prior encrypted account metadata when getSession rejects', async () => {
    supabase.auth.getSession.mockRejectedValue(new Error('network unavailable'));
    readCachedOnboardingMetadata.mockResolvedValue({
      userId: 'prior-user',
      onboardingComplete: true,
      cachedAt: 123,
    });

    act(() => {
      tree = renderer.create(<Probe onReady={(value) => { authApi = value; }} />);
    });
    await act(async () => {
      await authApi.retry();
    });

    const state = useAuthStore.getState();
    expect(state.isReady).toBe(true);
    expect(state.auth?.user?.id).toBe('prior-user');
    expect(state.auth?.isOfflineBootstrap).toBe(true);
    expect(state.authBootstrapError).toBeInstanceOf(Error);
  });

  test('does not invent an account when no metadata exists', async () => {
    supabase.auth.getSession.mockRejectedValue(new Error('network unavailable'));
    readCachedOnboardingMetadata.mockResolvedValue(null);

    act(() => {
      tree = renderer.create(<Probe onReady={(value) => { authApi = value; }} />);
    });
    await act(async () => {
      await authApi.retry();
    });

    const state = useAuthStore.getState();
    expect(state.isReady).toBe(true);
    expect(state.auth).toBeNull();
    expect(state.authBootstrapError).toBeInstanceOf(Error);
  });

  test('rehydrates a pseudo-auth account once when connectivity returns', async () => {
    const session = { access_token: 'access', user: { id: 'prior-user' } };
    supabase.auth.getSession
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ data: { session }, error: null });
    readCachedOnboardingMetadata.mockResolvedValue({ userId: 'prior-user', onboardingComplete: true });

    act(() => {
      tree = renderer.create(<ReconnectProbe isOnline={false} onReady={(value) => { authApi = value; }} />);
    });
    await act(async () => { await authApi.retry(); });
    expect(useAuthStore.getState().auth?.isOfflineBootstrap).toBe(true);

    await act(async () => {
      tree.update(<ReconnectProbe isOnline onReady={(value) => { authApi = value; }} />);
    });

    expect(supabase.auth.getSession).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().auth).toEqual({ session, user: session.user, isOfflineBootstrap: false });
  });

  test('does not loop automatic reconnect after a failed attempt', async () => {
    supabase.auth.getSession
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockRejectedValueOnce(new Error('still unavailable'));
    readCachedOnboardingMetadata.mockResolvedValue({ userId: 'prior-user', onboardingComplete: true });

    act(() => {
      tree = renderer.create(<ReconnectProbe isOnline={false} onReady={(value) => { authApi = value; }} />);
    });
    await act(async () => { await authApi.retry(); });
    await act(async () => {
      tree.update(<ReconnectProbe isOnline onReady={(value) => { authApi = value; }} />);
    });
    await act(async () => {
      tree.update(<ReconnectProbe isOnline onReady={(value) => { authApi = value; }} />);
    });

    expect(supabase.auth.getSession).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().auth?.isOfflineBootstrap).toBe(true);
    expect(useAuthStore.getState().authBootstrapError).toBeInstanceOf(Error);
  });

  test('classifies known invalid refresh errors as confirmed invalidation', async () => {
    supabase.auth.getSession.mockRejectedValue({ code: 'invalid_refresh_token', status: 400 });
    readCachedOnboardingMetadata.mockResolvedValue({ userId: 'prior-user', onboardingComplete: true });

    act(() => {
      tree = renderer.create(<Probe onReady={(value) => { authApi = value; }} />);
    });
    await act(async () => { await authApi.retry(); });

    expect(useAuthStore.getState().auth).toBeNull();
    expect(useAuthStore.getState().authBootstrapError).toBeNull();
    expect(readCachedOnboardingMetadata).not.toHaveBeenCalled();
  });
});
