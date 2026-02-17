"use client"

import { useAuth } from "@/components/auth-provider"

/**
 * Hook pentru a verifica rapid dacă userul curent este admin.
 * 
 * Folosire:
 * ```tsx
 * const { isAdmin, loading } = useAdmin()
 * 
 * if (loading) return <Spinner />
 * if (!isAdmin) return <AccessDenied />
 * 
 * return <AdminPanel />
 * ```
 */
export function useAdmin() {
  const { isAdmin, loading, user } = useAuth()

  return {
    /** true dacă userul curent are is_admin = true în profiles */
    isAdmin,
    /** true cât timp se încarcă sesiunea */
    loading,
    /** true dacă userul este autentificat */
    isAuthenticated: !!user,
    /** userul curent */
    user,
  }
}
