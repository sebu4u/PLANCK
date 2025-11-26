import type { User } from "@supabase/supabase-js"

/**
 * Verifică dacă un utilizator este admin
 * Adminii pot fi identificați prin:
 * 1. Email-uri specificate în ADMIN_EMAILS (variabilă de mediu)
 * 2. app_metadata.role = 'admin'
 * 3. user_metadata.role = 'admin'
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) {
    return false
  }

  // Verifică app_metadata pentru rol admin
  const appMetadata = (user.app_metadata as Record<string, unknown>) ?? {}
  if (appMetadata.role === "admin") {
    return true
  }

  // Verifică user_metadata pentru rol admin
  const userMetadata = (user.user_metadata as Record<string, unknown>) ?? {}
  if (userMetadata.role === "admin") {
    return true
  }

  // Verifică email-urile din variabila de mediu
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? []
  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    return true
  }

  return false
}

/**
 * Helper pentru a extrage token-ul din request header
 */
export function getAccessTokenFromRequest(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }
  const tokenMatch = authHeader.match(/^Bearer (.+)$/i)
  return tokenMatch ? tokenMatch[1] : null
}


















