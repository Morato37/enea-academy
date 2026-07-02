import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { PasswordChangeModal } from '../components/Auth/PasswordChangeModal';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  mustChangePassword: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithAzure: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const checkUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('must_change_password, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setMustChangePassword(data?.must_change_password ?? false);
      setIsAdmin(data?.role === 'admin');
    } catch (err) {
      console.error('Error checking user profile:', err);
      setMustChangePassword(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserProfile(session.user.id);
      } else {
        setIsAdmin(false);
        setMustChangePassword(false);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserProfile(session.user.id);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const loginTime = session.user.last_sign_in_at ?? new Date().toISOString();
          (async () => {
            await supabase
              .from('user_profiles')
              .update({ last_login: loginTime })
              .eq('id', session.user.id);
          })();
        }
      } else {
        setIsAdmin(false);
        setMustChangePassword(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithAzure = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email',
        redirectTo: `${window.location.origin}`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await checkUserProfile(session.user.id);
    }
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  const value = {
    user,
    loading,
    isAdmin,
    mustChangePassword,
    signUp,
    signIn,
    signInWithAzure,
    signOut,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {mustChangePassword && user && (
        <PasswordChangeModal
          userId={user.id}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
};
