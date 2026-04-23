import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

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
  const redirectUrl = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (result.type !== 'success') throw Object.assign(new Error('OAuth cancelled'), { code: 'ERR_REQUEST_CANCELED' });

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('No auth code returned');
  return supabase.auth.exchangeCodeForSession(code);
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
  const redirectUrl = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (result.type !== 'success') throw Object.assign(new Error('OAuth cancelled'), { code: 'ERR_REQUEST_CANCELED' });

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('No auth code returned');
  return supabase.auth.exchangeCodeForSession(code);
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
