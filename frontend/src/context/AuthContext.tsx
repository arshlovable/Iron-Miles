import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  full_name: string | null;
  lifetime_iron_miles: number | null;
};

/** Returned by signUp when Supabase requires email confirmation before issuing a session. */
export type SignUpResult =
  | { status: 'signed_in' }
  | { status: 'confirmation_required' };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstName: string, email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureProfile(user: User, fullName?: string) {
  const name = fullName || (user.user_metadata?.full_name as string | undefined) || null;
  console.log('[Auth] ensureProfile uid:', user.id, 'name:', name);
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: name,
      lifetime_iron_miles: 0,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error && error.code !== '23505') {
    console.warn('[Auth] ensureProfile error:', error);
    throw error;
  }
  console.log('[Auth] ensureProfile done uid:', user.id);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  // Use a ref so refreshProfile can always see the latest session without
  // being recreated on every session change (avoids stale-closure bugs).
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  const refreshProfile = useCallback(async () => {
    const activeUser = sessionRef.current?.user;
    if (!activeUser) {
      console.log('[Auth] refreshProfile: no active user, clearing profile');
      setProfile(null);
      return;
    }
    console.log('[Auth] refreshProfile fetching for uid:', activeUser.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, lifetime_iron_miles')
      .eq('id', activeUser.id)
      .maybeSingle();

    if (error) {
      console.warn('[Auth] refreshProfile fetch error:', error);
      setProfile(null);
      return;
    }

    console.log('[Auth] refreshProfile result:', data);
    setProfile(data ?? null);
  }, []); // stable — reads session via ref

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] initializing auth listener');

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn('[Auth] getSession error:', error);
      console.log('[Auth] getSession result session:', data.session ? 'present' : 'null');
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('[Auth] onAuthStateChange event:', event, 'session:', nextSession ? 'present' : 'null');
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    console.log('[Auth] user effect uid:', user.id, '— ensuring profile');
    ensureProfile(user)
      .catch((err) => console.warn('[Auth] user effect ensureProfile error:', err))
      .finally(() => refreshProfile());
  }, [user, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] signIn attempt:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      console.warn('[Auth] signIn error:', error);
      throw error;
    }
    console.log('[Auth] signIn success');
  }, []);

  const signUp = useCallback(async (firstName: string, email: string, password: string): Promise<SignUpResult> => {
    const cleanedName = firstName.trim();
    console.log('[Auth] signUp attempt email:', email, 'name:', cleanedName);

    // Build the redirect URL for email confirmation links.
    // On web: use the current origin so the link works on any environment (localhost, staging, prod).
    // On native: omit it (deep-link handling is separate).
    const emailRedirectTo =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: cleanedName },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    console.log('[Auth] signUp response — user:', data.user ? data.user.id : 'null', 'session:', data.session ? 'present' : 'null', 'error:', error);

    if (error) throw error;

    if (data.user && data.session) {
      // Immediate session: email confirmation is disabled in Supabase.
      // ensureProfile will also be called by the user effect once onAuthStateChange
      // fires, but we do it here eagerly so the profile exists before navigation.
      console.log('[Auth] signUp: immediate session, ensuring profile');
      await ensureProfile(data.user, cleanedName);
      return { status: 'signed_in' };
    }

    if (data.user && !data.session) {
      // Email confirmation required — Supabase sent a confirmation email.
      // The session will arrive later via onAuthStateChange when the user
      // clicks the link, at which point AuthGate navigates automatically.
      console.log('[Auth] signUp: confirmation email sent to', email);
      return { status: 'confirmation_required' };
    }

    // Unexpected: no user and no error.  Treat as an error.
    console.warn('[Auth] signUp: unexpected — no user and no error');
    throw new Error('Signup did not return a user. Please try again.');
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] signOut');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, session, signIn, signOut, signUp, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
