import { createClient } from '@supabase/supabase-js';

// Server-side: access environment variables directly
// These are validated at build time in next.config.mjs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars for server client: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Creates a Supabase client configured with an access token for server-side requests
 * @param accessToken - JWT access token from the client session
 * @returns Supabase client with authenticated headers
 */
export function createServerClientWithToken(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

