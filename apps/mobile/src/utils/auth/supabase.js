/**
 * Supabase auth stubs — UI is wired, real calls added when Supabase is configured.
 *
 * To activate:
 * 1. npx expo install @supabase/supabase-js
 * 2. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env
 * 3. Uncomment the client below and replace stub functions with real calls
 */

// TODO: Uncomment when Supabase is configured
// import { createClient } from '@supabase/supabase-js';
// import AsyncStorage from '@react-native-async-storage/async-storage';
//
// export const supabase = createClient(
//   process.env.EXPO_PUBLIC_SUPABASE_URL,
//   process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
//   {
//     auth: {
//       storage: AsyncStorage,
//       autoRefreshToken: true,
//       persistSession: true,
//       detectSessionInUrl: false,
//     },
//   }
// );

export async function signIn(email, _password) {
  // TODO: return supabase.auth.signInWithPassword({ email, password });
  console.log('[AUTH STUB] signIn', email);
  return {
    data: {
      user: { id: 'stub-id', email, user_metadata: { full_name: 'Test User' } },
      session: { access_token: 'stub-token' },
    },
    error: null,
  };
}

export async function signUp(email, _password, fullName) {
  // TODO: return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  console.log('[AUTH STUB] signUp', email, fullName);
  return {
    data: {
      user: { id: 'stub-id', email, user_metadata: { full_name: fullName } },
      session: { access_token: 'stub-token' },
    },
    error: null,
  };
}

export async function signOut() {
  // TODO: return supabase.auth.signOut();
  console.log('[AUTH STUB] signOut');
  return { error: null };
}

export async function resetPassword(email) {
  // TODO: return supabase.auth.resetPasswordForEmail(email);
  console.log('[AUTH STUB] resetPassword', email);
  return { data: {}, error: null };
}

export async function verifyOtp(email, token) {
  // TODO: return supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  console.log('[AUTH STUB] verifyOtp', email, token);
  return { data: {}, error: null };
}
