import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { PasswordChangeModal } from '../components/Auth/PasswordChangeModal';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  mustChangePassword: boolean;
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

  const syncUserProfileName = async (currentUser: User) => {
    const metadata = currentUser.user_metadata ?? {};
    const fullName = [metadata.full_name, metadata.name, metadata.display_name]
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
      ?.trim();

    if (!fullName) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName })
      .eq('id', currentUser.id)
      .or('full_name.is.null,full_name.eq.');

    if (error) console.error('Error syncing user profile name:', error);
  };

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
        syncUserProfileName(session.user);
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
        syncUserProfileName(session.user);
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
