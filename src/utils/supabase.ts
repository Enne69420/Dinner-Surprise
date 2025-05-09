import { createClient } from '@supabase/supabase-js';

// Node.js process type (for TypeScript)
declare const process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV: 'development' | 'production' | 'test';
  };
};

// Initialize the Supabase client
let supabase;

try {
  console.log('Initializing Supabase client for client-side use...');
  
  // Get environment variables - in Amplify Gen 2, these should be directly available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Supabase environment variables missing:',
      !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
      !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''
    );
    throw new Error('Supabase environment variables must be configured in Amplify Console');
  }
  
  // Create a single supabase client for interacting with your database
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Will be handled when the client is used
}

export default supabase;

/**
 * Creates a server-side Supabase client with admin privileges.
 * For use in API routes and server-side code only.
 * 
 * @returns Supabase client with service role permissions
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Server-side Supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
      'Make sure these are configured in Amplify Secret Management.'
    );
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    }
  });
} 