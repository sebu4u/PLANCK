import type { User, SupabaseClient } from "@supabase/supabase-js"
import {
  canDevEditChapter,
  type ChapterDevAccessRow,
} from "@/lib/dev-chapter-access"
import {
  canAccessApiSubject,
  canAccessCatalog,
  canAccessSubject,
  isSuperDev,
  normalizeDevSubjects,
  type ApiDevSubject,
  type DevCatalog,
  type DevSubjectKey,
} from "@/lib/dev-subjects"

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
  let authUser: User | null = null
  try {
    const {
      data: { user: resolved },
    } = await supabase.auth.getUser()
    authUser = resolved ?? null
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

  // Fallback: metadata, env (folosește userul din sesiune dacă nu e pasat explicit)
  const userToCheck = user ?? authUser
  return isAdmin(userToCheck)
}

/**
 * Dev conținut (profiles.is_dev): poate adăuga în catalog / learning paths prin rute dedicate,
 * fără drepturi de admin general.
 */
export async function isDevFromDB(supabase: SupabaseClient, userId?: string | null): Promise<boolean> {
  const uid =
    userId ??
    (await supabase.auth.getUser()).data.user?.id ??
    null
  if (!uid) return false

  const { data: profile } = await supabase.from("profiles").select("is_dev").eq("user_id", uid).maybeSingle()

  return profile?.is_dev === true
}

export type DevPermissions = {
  isDev: boolean
  isAdmin: boolean
  devSubjects: DevSubjectKey[] | null
  isSuperDev: boolean
}

export async function getDevPermissionsFromDB(
  supabase: SupabaseClient,
  userId?: string | null,
  user?: User | null
): Promise<DevPermissions> {
  let authUser: User | null = user ?? null
  if (!authUser) {
    try {
      authUser = (await supabase.auth.getUser()).data.user ?? null
    } catch {
      authUser = null
    }
  }

  const uid = userId ?? authUser?.id ?? null
  if (!uid) {
    return { isDev: false, isAdmin: false, devSubjects: null, isSuperDev: false }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_dev, is_admin, dev_subjects")
    .eq("user_id", uid)
    .maybeSingle()

  const resolvedIsDev = profile?.is_dev === true
  const resolvedIsAdmin = profile?.is_admin === true || isAdmin(authUser)
  const devSubjects = normalizeDevSubjects(profile?.dev_subjects)

  return {
    isDev: resolvedIsDev,
    isAdmin: resolvedIsAdmin,
    devSubjects,
    isSuperDev: isSuperDev(resolvedIsDev, devSubjects),
  }
}

export function assertDevCanAccessSubject(permissions: DevPermissions, subject: DevSubjectKey): boolean {
  return canAccessSubject(permissions.isDev, permissions.devSubjects, subject, permissions.isAdmin)
}

export function assertDevCanAccessApiSubject(permissions: DevPermissions, subject: ApiDevSubject): boolean {
  return canAccessApiSubject(permissions.isDev, permissions.devSubjects, subject, permissions.isAdmin)
}

export function assertDevCanAccessCatalog(permissions: DevPermissions, catalog: DevCatalog): boolean {
  return canAccessCatalog(permissions.isDev, permissions.devSubjects, catalog, permissions.isAdmin)
}

export function assertDevCanEditChapter(
  permissions: DevPermissions,
  userId: string,
  chapter: ChapterDevAccessRow
): boolean {
  return canDevEditChapter(permissions, userId, chapter)
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


















