import type { SupabaseClient } from "@supabase/supabase-js"
import type { OAuthPopupResult } from "@/lib/oauth-popup"

export async function signInWithGoogleIdToken(
  supabase: SupabaseClient,
  credential: string,
  nonce?: string
): Promise<OAuthPopupResult> {
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
    ...(nonce ? { nonce } : {}),
  })

  if (error) {
    return { error }
  }

  return { error: null }
}
