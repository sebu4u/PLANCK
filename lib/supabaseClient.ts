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
		// Clear localStorage
		localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
		// Also clear sessionStorage in case it's used
		sessionStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
		// Clear all Supabase-related keys (in case format changed)
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach(key => {
			try {
				localStorage.removeItem(key);
				sessionStorage.removeItem(key);
			} catch {
				// Ignore individual removal errors
			}
		});
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

// Helper to check if error is related to refresh token
const isRefreshTokenError = (error: any): boolean => {
	if (!error) return false;
	const message = error?.message || '';
	const name = error?.name || '';
	const normalizedMessage = message.toLowerCase();
	
	return (
		name === 'AuthApiError' &&
		(normalizedMessage.includes('refresh token') ||
		 normalizedMessage.includes('refresh_token') ||
		 normalizedMessage.includes('refresh token not found') ||
		 normalizedMessage.includes('invalid refresh token'))
	);
};

// Global error handler for auth errors (handles background token refresh errors)
if (typeof window !== 'undefined') {
	// Listen to auth state changes and handle errors
	supabase.auth.onAuthStateChange(async (event, session) => {
		// If we get a SIGNED_OUT event with no session, it might be due to an invalid refresh token
		if (event === 'SIGNED_OUT' && !session) {
			// This could be a token refresh error - clear any stale session data
			clearSupabaseAuthStorage();
		}
		
		// Handle token refresh errors that might be caught here
		if (event === 'TOKEN_REFRESHED' && !session) {
			// Token refresh failed - clear stale data
			clearSupabaseAuthStorage();
		}
	});

	// Global error handler for unhandled promise rejections related to auth
	window.addEventListener('unhandledrejection', (event) => {
		const error = event.reason;
		
		// Check if this is an auth error related to refresh tokens
		if (isRefreshTokenError(error)) {
			console.warn('Unhandled auth error - Invalid refresh token:', error.message);
			// Prevent the error from being logged to console as unhandled
			event.preventDefault();
			// Clear the invalid session silently
			supabase.auth.signOut().catch(() => {
				// Ignore sign out errors
			});
			clearSupabaseAuthStorage();
		}
	});

	// Set up error handling before any auth operations
	// This ensures we catch refresh token errors early
	const handleAuthError = (error: any) => {
		if (isRefreshTokenError(error)) {
			console.warn('Auth error detected - Invalid refresh token:', error.message);
			// Clear the invalid session silently
			supabase.auth.signOut().catch(() => {
				// Ignore sign out errors
			});
			clearSupabaseAuthStorage();
			return true; // Error was handled
		}
		return false; // Error was not handled
	};

	// Intercept errors from getSession calls (which happens on init and auto-refresh)
	// This catches errors that occur during initialization and background refresh
	const originalGetSession = supabase.auth.getSession;
	supabase.auth.getSession = async function() {
		try {
			const result = await originalGetSession.call(this);
			// Also check if the result has an error (Supabase returns errors in result.error, not thrown)
			if (result.error && isRefreshTokenError(result.error)) {
				handleAuthError(result.error);
				return { data: { session: null, user: null }, error: null };
			}
			return result;
		} catch (error: any) {
			if (handleAuthError(error)) {
				// Return empty session if refresh token error
				return { data: { session: null, user: null }, error: null };
			}
			throw error;
		}
	};
}