import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Sentry } from '@/utils/sentry';

const appExtra = Constants.expoConfig?.extra ?? {};

export const appEnvironment = appExtra.appEnv ?? (__DEV__ ? 'development' : 'production');

// Development must never fall back to a hosted (staging/production)
// project: in dev, process.env wins over the config-derived extra.* value.
// Every other env keeps the original precedence (extra.* first).
const supabaseUrl =
  appEnvironment === 'development'
    ? process.env.EXPO_PUBLIC_SUPABASE_URL ?? appExtra.supabaseUrl
    : appExtra.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  appEnvironment === 'development'
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? appExtra.supabaseAnonKey
    : appExtra.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const oauthRedirectUrl = appExtra.oauthRedirectUrl ?? 'hemoscd://auth/callback';

if (!supabaseUrl || !supabaseAnonKey) {
  if (appEnvironment === 'development') {
    throw new Error(
      'Development Supabase configuration is missing. Set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env.local (see supabase/README.local.md) — ' +
        'development does not fall back to staging or production.'
    );
  }
  throw new Error('Supabase configuration is missing.');
}

const HOSTED_SUPABASE_HOSTS = new Set([
  'uphhntnjzfsckeuxjhco.supabase.co', // production
  'pqwrxhqcgwrjazsurujm.supabase.co', // staging
]);

if (appEnvironment === 'development') {
  const resolvedHost = (() => {
    try {
      return new URL(supabaseUrl).host;
    } catch {
      return undefined;
    }
  })();

  if (resolvedHost && HOSTED_SUPABASE_HOSTS.has(resolvedHost)) {
    throw new Error(
      `A development build must not point at a hosted Supabase project (resolved host: ${resolvedHost}). ` +
        'Point EXPO_PUBLIC_SUPABASE_URL in apps/mobile/.env.local at your local Supabase instance instead.'
    );
  }
}

try {
  const host = new URL(supabaseUrl).host;
  console.info(`[Auth] Supabase host: ${host}; appEnv: ${appEnvironment}; oauthRedirect: ${oauthRedirectUrl}`);
} catch {
  console.info(`[Auth] Supabase URL configured; appEnv: ${appEnvironment}; oauthRedirect: ${oauthRedirectUrl}`);
}

export const getOAuthRedirectUrl = () => {
  if (__DEV__) return Linking.createURL('auth/callback');
  return oauthRedirectUrl;
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);

function getParamsFromUrl(url) {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.search);
  const hash = parsed.hash?.startsWith('#') ? parsed.hash.slice(1) : '';
  const hashParams = new URLSearchParams(hash);

  for (const [key, value] of hashParams.entries()) {
    if (!params.has(key)) params.set(key, value);
  }

  return params;
}

function getSafeOAuthShape(url) {
  try {
    const params = getParamsFromUrl(url);
    const keys = Array.from(params.keys()).filter(
      (key) => !/token|code/i.test(key)
    );
    return {
      hasCode: params.has('code'),
      hasAccessToken: params.has('access_token'),
      hasRefreshToken: params.has('refresh_token'),
      hasError: params.has('error'),
      hasErrorCode: params.has('error_code'),
      keys,
    };
  } catch {
    return { parseable: false };
  }
}

function captureOAuthException(error, context = {}) {
  if (error?.code === 'ERR_REQUEST_CANCELED') return;
  Sentry.addBreadcrumb({
    category: 'auth.oauth',
    level: 'error',
    data: context,
  });
  Sentry.captureException(error);
}

async function createOAuthSessionFromUrl(url) {
  const params = getParamsFromUrl(url);
  const errorCode = params.get('error_code') || params.get('error');
  const errorDescription = params.get('error_description');

  if (errorCode) {
    const error = new Error(errorDescription || errorCode);
    error.url = url;
    throw error;
  }

  const code = params.get('code');
  if (code) {
    return supabase.auth.exchangeCodeForSession(code);
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    return supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  const error = new Error('No auth session returned');
  error.url = url;
  throw error;
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, fullName) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email) {
  return supabase.auth.resetPasswordForEmail(email);
}

export async function verifyOtp(email, token) {
  return supabase.auth.verifyOtp({ email, token, type: 'recovery' });
}

export async function changePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function signOutAll() {
  return supabase.auth.signOut({ scope: 'global' });
}

export async function linkProvider(provider, redirectTo) {
  return supabase.auth.linkIdentity({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
}

export async function unlinkProvider(identity) {
  return supabase.auth.unlinkIdentity(identity);
}

export async function signInWithGoogle() {
  const redirectUrl = getOAuthRedirectUrl();
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type !== 'success') throw Object.assign(new Error('OAuth cancelled'), { code: 'ERR_REQUEST_CANCELED' });

    const sessionResult = await createOAuthSessionFromUrl(result.url);
    if (sessionResult?.error) {
      captureOAuthException(sessionResult.error, {
        provider: 'google',
        appEnvironment,
        redirectUrl,
        callbackShape: getSafeOAuthShape(result.url),
      });
    }
    return sessionResult;
  } catch (error) {
    captureOAuthException(error, {
      provider: 'google',
      appEnvironment,
      redirectUrl,
      callbackShape: error?.url ? getSafeOAuthShape(error.url) : undefined,
    });
    throw error;
  }
}

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    return { data: null, error: new Error('Apple sign-in did not return an identity token.') };
  }
  return supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
}

export async function linkGoogle() {
  const redirectUrl = getOAuthRedirectUrl();
  try {
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type !== 'success') throw Object.assign(new Error('OAuth cancelled'), { code: 'ERR_REQUEST_CANCELED' });

    const sessionResult = await createOAuthSessionFromUrl(result.url);
    if (sessionResult?.error) {
      captureOAuthException(sessionResult.error, {
        provider: 'google',
        action: 'link',
        appEnvironment,
        redirectUrl,
        callbackShape: getSafeOAuthShape(result.url),
      });
    }
    return sessionResult;
  } catch (error) {
    captureOAuthException(error, {
      provider: 'google',
      action: 'link',
      appEnvironment,
      redirectUrl,
      callbackShape: error?.url ? getSafeOAuthShape(error.url) : undefined,
    });
    throw error;
  }
}

export async function linkApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    return { data: null, error: new Error('Apple sign-in did not return an identity token.') };
  }
  return supabase.auth.linkIdentity({
    provider: 'apple',
    token: credential.identityToken,
  });
}
