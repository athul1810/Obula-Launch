import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { setTokenGetter } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdminState, setIsAdminState] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (userId) => {
    try {
      // Check admin status via security definer function (bypasses RLS safely)
      const { data: isAdminResult, error: adminErr } = await supabase
        .rpc('check_is_admin');
      if (import.meta.env.DEV) console.log('[AuthContext] check_is_admin:', isAdminResult, 'error:', adminErr);
      setIsAdminState(!!isAdminResult);

      // Fetch full profile
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (import.meta.env.DEV) console.log('[AuthContext] profiles result:', profileRow, 'error:', profileErr);
      setProfile(profileRow ?? null);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[AuthContext] loadUser error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadUser(s.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setLoading(true);
        loadUser(s.user.id);
      } else {
        setProfile(null);
        setIsAdminState(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const signUp = useCallback(async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone || null } },
    });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  // Keep the backend API client in sync with the Supabase session token
  useEffect(() => {
    setTokenGetter(() => session?.access_token ?? null);
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadUser(user.id);
  }, [user, loadUser]);

  const isAuthenticated = !!session;
  const isAdmin = isAdminState;
  // True when user is logged in but hasn't linked a phone yet (blocks access until added)
  const needsPhone = isAuthenticated && !loading && profile !== null && !profile?.phone;

  const value = {
    session,
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    needsPhone,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshProfile,
    login: signIn,
    logout: signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
