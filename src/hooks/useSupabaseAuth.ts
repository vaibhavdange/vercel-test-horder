import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { supabase } from '@/lib/supabase';
import type { AuthError } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: sessionData } = await authClient.getSession();
    const session = sessionData.session;
    if (!session) return;
        if (error) {
          setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
          return;
        }

        if (session) {
          setAuthState({
            user: session.user,
            session,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          setAuthState({
            user: session.user,
            session,
            isLoading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await authClient.login({ email, password });
      
      if (error) {
  setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
  return { error: error.message };
}

      // The auth state change listener will update the state
      return { user: data?.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: name } }
});
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return { error: result.error };
      }

      // The auth state change listener will update the state
      return { user: result.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { error: errorMessage };
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      try {
  const { error } = await authClient.logout();
  return { success: true };
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
  setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
  return { error: errorMessage };
}

      // The auth state change listener will update the state
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { error: errorMessage };
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    ...authState,
    signIn,
    signUp,
    logout,
    clearError,
  };
}
