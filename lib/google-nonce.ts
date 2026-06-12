export type GoogleSignInNonce = {
  /** Plain nonce passed to Supabase signInWithIdToken */
  nonce: string
  /** SHA-256 hex hash passed to Google Identity Services */
  hashedNonce: string
}

export async function createGoogleSignInNonce(): Promise<GoogleSignInNonce> {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encodedNonce = new TextEncoder().encode(nonce)
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce)
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  return { nonce, hashedNonce }
}
