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
  | { status: 'signed_in'; userId: string }
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
      setProfile(null);
      return;
    }

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

    setProfile(data ?? null);
  }, []); // stable — reads session via ref

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn('[Auth] getSession error:', error);
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    ensureProfile(user)
      .catch((err) => console.warn('[Auth] ensureProfile error:', err))
      .finally(() => refreshProfile());
  }, [user, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (firstName: string, email: string, password: string): Promise<SignUpResult> => {
    const cleanedName = firstName.trim();

    // On web: use the current origin so email confirmation links work in any environment.
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

    if (error) throw error;

    if (data.user && data.session) {
      // Immediate session: email confirmation is disabled in Supabase.
      // ensureProfile will also be called by the user effect once onAuthStateChange
      // fires, but we do it here eagerly so the profile exists before navigation.
      await ensureProfile(data.user, cleanedName);
      return { status: 'signed_in', userId: data.user.id };
    }

    if (data.user && !data.session) {
      // Email confirmation required — session arrives later via onAuthStateChange.
      return { status: 'confirmation_required' };
    }

    throw new Error('Signup did not return a user. Please try again.');
  }, []);

  const signOut = useCallback(async () => {
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
