import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

  // Id of the user currently in state. Supabase reports the session again when the tab comes back
  // to the foreground (SIGNED_IN / TOKEN_REFRESHED) with a new user object for the same person.
  // Replacing `user` then would make every page that depends on it reload its data.
  const currentUserId = useRef<string | null>(null);

  /** Applies a session; returns true if the signed-in person changed. */
  const applySessionUser = (sessionUser: User | null, forceUpdate = false): boolean => {
    const nextId = sessionUser?.id ?? null;
    if (nextId === currentUserId.current) {
      if (forceUpdate) setUser(sessionUser); // e.g. USER_UPDATED: same person, new metadata
      return false;
    }
    currentUserId.current = nextId;
    setUser(sessionUser);
    if (sessionUser) {
      syncUserProfileName(sessionUser);
      checkUserProfile(sessionUser.id);
    } else {
      setIsAdmin(false);
      setMustChangePassword(false);
    }
    return true;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySessionUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const changed = applySessionUser(session?.user ?? null, event === 'USER_UPDATED');
      // Only a real sign-in counts as login, not the session check when the tab is focused again.
      if (changed && session?.user && event === 'SIGNED_IN') {
        const loginTime = session.user.last_sign_in_at ?? new Date().toISOString();
        (async () => {
          await supabase
            .from('user_profiles')
            .update({ last_login: loginTime })
            .eq('id', session.user.id);
        })();
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
