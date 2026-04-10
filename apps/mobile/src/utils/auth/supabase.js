import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

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
