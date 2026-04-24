import { supabase } from '@/utils/auth/supabase';

export async function registerPushToken(expoPushToken, platform) {
  const { error } = await supabase.functions.invoke('register-push-token', {
    body: { expoPushToken, platform },
  });
  if (error) console.warn('[Novu] push token registration failed:', error.message);
}
