import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const isWeb = Platform.OS === 'web';
const isBrowserRuntime = typeof window !== 'undefined';

let nativeStorage: any;
if (!isWeb) {
  try {
    nativeStorage = require('@react-native-async-storage/async-storage').default;
  } catch {
    nativeStorage = undefined;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(nativeStorage ? { storage: nativeStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    // On web, Supabase email confirmation/magic-link callbacks embed the token
    // in the URL hash or query string — must be true so the client picks it up.
    detectSessionInUrl: isWeb || isBrowserRuntime,
  },
});
