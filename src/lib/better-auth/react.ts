import { useState, useEffect } from 'react';
import { simpleAuth } from '../simple-auth';

// Type definitions
export interface AuthSession {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    fullName: string;
    isActive: boolean;
  };
  expiresAt: string;
}

export interface SignInResult {
  error?: string;
  user?: AuthSession['user'];
}

export interface SignUpResult {
  error?: string;
  user?: AuthSession['user'];
}

// Create auth client for React
export function createAuthClient() {
  // Session management
  const useSession = () => {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const storedSession = localStorage.getItem('session');
      if (storedSession) {
        try {
          setSession(JSON.parse(storedSession));
        } catch (e) {
          console.error('Failed to parse session:', e);
          localStorage.removeItem('session');
        }
      }
      setIsLoading(false);
    }, []);

    return {
      data: session,
      isLoading,
    };
  };

  // Sign in function
  const signIn = async (
    provider: 'emailAndPassword',
    credentials: { email: string; password: string }
  ): Promise<SignInResult> => {
    try {
      // For demo purposes, directly check against hardcoded credentials
      // instead of calling server-side functions that require Supabase
      if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
        // Create a mock user
        const user = {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          fullName: 'Admin User',
          isActive: true
        };
        
        // Create session
        const session: AuthSession = {
          user,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        };
        
        // Store session
        localStorage.setItem('session', JSON.stringify(session));
        
        return { user };
      }
      
      return { error: 'Invalid email or password' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Authentication failed' };
    }
  };

  // Sign up function
  const signUp = async (
    provider: 'emailAndPassword',
    data: { email: string; password: string; name: string }
  ): Promise<SignUpResult> => {
    try {
      // For demo purposes, simulate a successful signup
      // In a real implementation, this would call an API to create a user
      if (data.email && data.password) {
        // Create a mock user
        const user = {
          id: 'new-user-id',
          username: data.name || data.email.split('@')[0],
          email: data.email,
          role: 'user',
          fullName: data.name || data.email.split('@')[0],
          isActive: true
        };
        
        // Create session
        const session: AuthSession = {
          user,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        };
        
        // Store session
        localStorage.setItem('session', JSON.stringify(session));
        
        return { user };
      }
      
      return { error: 'Email and password are required' };
    } catch (error) {
      console.error('Sign up error:', error);
      // Make sure we return a string, not an object
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { error: errorMessage };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Clear session from localStorage
      localStorage.removeItem('session');
      // Redirect to home page
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: 'Failed to sign out' };
    }
  };

  return {
    useSession,
    signIn,
    signUp,
    signOut,
  };
}