import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    // Create the auth user first
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // After signUp, the user may or may not be immediately authenticated depending on
    // whether email confirmations are required. We must ensure the client is authenticated
    // (so auth.uid() is available for RLS) before inserting into `user_profiles`.
    if (!data || !data.user) {
      throw new Error('Sign up did not return a user');
    }

    // Try to get the current session
    let sessionResp = await supabase.auth.getSession();
    let session = sessionResp.data.session;

    // If there's no session, try signing in (useful when confirm email is disabled)
    if (!session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        // Likely requires email confirmation. Inform caller so they can confirm.
        throw new Error(
          'Sign up succeeded but the account is not authenticated yet. Please check your email to confirm your account before signing in.'
        );
      }

      sessionResp = await supabase.auth.getSession();
      session = sessionResp.data.session;
    }

    // If still no session, abort to avoid RLS violations
    if (!session || !session.user) {
      throw new Error('Unable to obtain authenticated session after sign up');
    }

    // Now insert the profile as the authenticated user
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        name,
      });

    if (profileError) throw profileError;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
