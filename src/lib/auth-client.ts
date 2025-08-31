import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';

// Authentication functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Hook for managing session state
export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useSession: Initializing...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('useSession: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('useSession: Initial session result:', { session, error });
        
        if (error) {
          console.error('useSession: Error getting session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('useSession: Initial loading complete');
      } catch (error) {
        console.error('useSession: Exception getting session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useSession: Auth state change:', { event, session });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user,
    loading,
    isAuthenticated: !!session
  };
};

// Legacy export for backward compatibility
export const authClient = {
  login: signIn,
  logout: signOut,
  getSession: () => supabase.auth.getSession()
};
