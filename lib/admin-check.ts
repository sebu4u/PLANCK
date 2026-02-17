import type { User, SupabaseClient } from "@supabase/supabase-js"

/**
 * Verifică dacă un utilizator este admin (verificare sincronă - fără DB)
 * Folosește metadata și variabile de mediu.
 * Pentru verificare completă (inclusiv DB), folosește isAdminFromDB().
 *
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
 * Verifică dacă un utilizator este admin prin interogarea bazei de date (profiles.is_admin)
 * Aceasta este metoda principală și recomandată pentru verificarea adminului.
 * Combină verificarea din DB cu verificările din metadata/env ca fallback.
 *
 * @param supabase - Clientul Supabase autentificat
 * @param user - Userul Supabase (opțional, pentru fallback pe metadata/env)
 * @returns true dacă userul este admin
 */
export async function isAdminFromDB(
  supabase: SupabaseClient,
  user?: User | null
): Promise<boolean> {
  // Mai întâi verifică din baza de date (sursa principală)
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const userId = authUser?.id

    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", userId)
        .single()

      if (profile?.is_admin === true) {
        return true
      }
    }
  } catch {
    // Dacă interogarea DB eșuează, continuă cu fallback-urile
  }

  // Fallback: verifică metadata și env vars
  const userToCheck = user ?? null
  return isAdmin(userToCheck)
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


















