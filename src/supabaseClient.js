import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', SUPABASE_URL);
console.log('Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');

// Get the current public URL
const getDynamicUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.endsWith('.loca.lt')) {
      return window.location.origin;
    }
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return window.location.origin;
    }
  }
  return 'http://localhost:3000';
};

// Simplified cookie domain logic
const getCookieDomain = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // For loca.lt tunnels
    if (hostname.endsWith('.loca.lt')) {
      return '.loca.lt';
    }
    
    // For localhost - don't set domain at all
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return undefined;
    }
  }
  return undefined;
};

const isHttps = () => {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }
  return false;
};

console.log('Dynamic URL:', getDynamicUrl());
console.log('Cookie domain:', getCookieDomain());
console.log('Is HTTPS:', isHttps());

export const supabase = createClient(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY, 
  {
    auth: {
      // CRITICAL: Set to false to avoid automatic token refresh issues
      autoRefreshToken: true,
      
      // Keep session persistent
      persistSession: true,
      
      // Detect session from URL (for OAuth flows)
      detectSessionInUrl: true,
      
      // Use current URL for redirects
      redirectTo: getDynamicUrl(),
      
      // Storage key
      storageKey: 'supabase.auth.token',
      
      // Cookie options
      cookieOptions: {
        name: 'sb-auth-token',
        // Lax is better for development - allows cookies on redirects
        sameSite: 'Lax',
        // Only secure on HTTPS
        secure: isHttps(),
        // Cookie domain
        domain: getCookieDomain(),
        // Path
        path: '/',
        // Lifetime - 1 year
        maxAge: 31536000,
      }
    }
  }
);

// Add a helper to check current session on load
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error('Error getting session:', error);
  } else if (session) {
    console.log('Active session found for:', session.user.email);
  } else {
    console.log('No active session');
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
  } else if (event === 'USER_UPDATED') {
    console.log('User updated');
  }
});