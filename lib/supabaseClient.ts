import { createClient } from '@supabase/supabase-js';

// For client-side, NEXT_PUBLIC_* variables are replaced at build time by Next.js
// We can safely access them directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseHost = new URL(supabaseUrl).host;
const supabaseProjectRef = supabaseHost?.split('.')[0] ?? '';
const SUPABASE_AUTH_STORAGE_KEY = supabaseProjectRef ? `sb-${supabaseProjectRef}-auth-token` : null;

const clearSupabaseAuthStorage = () => {
	if (!SUPABASE_AUTH_STORAGE_KEY) return;
	try {
		localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
	} catch {
		// Ignore storage errors
	}
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
	},
	realtime: {
		params: {
			eventsPerSecond: 10,
		},
	},
});

// Global error handler for auth errors (handles background token refresh errors)
if (typeof window !== 'undefined') {
	// Listen to auth state changes and handle errors
	supabase.auth.onAuthStateChange((event, session) => {
		// If we get a SIGNED_OUT event with no session, it might be due to an invalid refresh token
		if (event === 'SIGNED_OUT' && !session) {
			// This could be a token refresh error - clear any stale session data
			clearSupabaseAuthStorage();
		}
	});

	// Global error handler for unhandled promise rejections related to auth
	window.addEventListener('unhandledrejection', (event) => {
		const error = event.reason;
		// Check if this is an auth error related to refresh tokens
		if (error?.message?.includes('Refresh Token') || 
		    error?.message?.includes('refresh_token') ||
		    error?.name === 'AuthApiError' && error?.message?.includes('refresh')) {
			console.warn('Unhandled auth error - Invalid refresh token:', error.message);
			// Prevent the error from being logged to console as unhandled
			event.preventDefault();
			// Clear the invalid session
			supabase.auth.signOut().catch(() => {
				// Ignore sign out errors
			});
			clearSupabaseAuthStorage();
		}
	});
}