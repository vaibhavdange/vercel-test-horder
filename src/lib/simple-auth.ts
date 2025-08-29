import { createServerSupabaseClient } from '@/lib/supabase/client';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  fullName: string;
  isActive: boolean;
}

export interface Session {
  user: User;
  expiresAt: string;
}

// Simple authentication functions that work with your existing users table
export const simpleAuth = {
  // Sign in with username/email and password
  signIn: async (email: string, password: string): Promise<{ user?: User; error?: string }> => {
    try {
      const supabase = createServerSupabaseClient();
      
      // Query the users table
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('isActive', true)
        .limit(1);

      if (error) {
        console.error('Database error:', error);
        return { error: 'Authentication failed' };
      }

      if (!users || users.length === 0) {
        return { error: 'Invalid email or password' };
      }

      const user = users[0];
      
      // For demo purposes, accept any password
      // In production, you should hash and compare passwords
      if (password === 'admin123' || password === 'cashier123') {
        return { user };
      }

      return { error: 'Invalid email or password' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Authentication failed' };
    }
  },

  // Get current session
  getSession: async (): Promise<Session | null> => {
    // This would check for a valid session token
    // For now, return null
    return null;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    // Clear session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session');
    }
  }
};
