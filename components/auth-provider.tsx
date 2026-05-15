"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import type { AuthError, User } from "@supabase/supabase-js"
import { clearSupabaseAuthStorage, supabase } from "@/lib/supabaseClient"
import {
  AUTH_MESSAGE_ERROR,
  AUTH_MESSAGE_SUCCESS,
  isAuthPopupMessage,
  signInWithOAuthPopup,
} from "@/lib/oauth-popup"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{
    data: { user: User | null }
    error: AuthError | null
  }>
  loginWithGoogle: () => Promise<{ error: Error | null; popupBlocked?: boolean }>
  loginWithGitHub: () => Promise<{ error: Error | null; popupBlocked?: boolean }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshProfile: () => Promise<void>
  profile: any // nou: profilul din tabelul profiles
  subscriptionPlan: string
  userElo: number | null
  isAdmin: boolean
  /** true dacă profiles.is_dev = true (setat în DB / de admin) */
  isDev: boolean
  /**
   * După login, `user.id` există înainte să avem profil din DB.
   * Cât timp `profileSyncedUserId !== user.id`, nu te baza pe `isDev` pentru redirect (ex. către /dashboard/dev).
   */
  profileSyncedUserId: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const FREE_PLAN_IDENTIFIER = "free"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null) // nou: profilul
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>(FREE_PLAN_IDENTIFIER)
  const [userElo, setUserElo] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isDev, setIsDev] = useState<boolean>(false)
  const [profileSyncedUserId, setProfileSyncedUserId] = useState<string | null>(null)

  const isInvalidRefreshTokenError = (message?: string) => {
    if (!message) return false
    const normalized = message.toLowerCase()
    return normalized.includes("refresh token") || normalized.includes("refresh_token")
  }

  const handleInvalidAuthSession = useCallback(async (message?: string) => {
    console.warn("Invalid auth session detected:", message)
    clearSupabaseAuthStorage()
    setUser(null)
    setProfile(null)
    setSubscriptionPlan(FREE_PLAN_IDENTIFIER)
    setUserElo(null)
    setIsAdmin(false)
    setIsDev(false)
    setProfileSyncedUserId(null)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          if (isInvalidRefreshTokenError(error.message)) {
            await handleInvalidAuthSession(error.message)
            setLoading(false)
            return
          }
          console.error("Error getting session:", error)
        }

        setUser(data?.session?.user ?? null)
      } catch (err: any) {
        if (isInvalidRefreshTokenError(err?.message)) {
          await handleInvalidAuthSession(err?.message)
        } else {
          console.error("Unexpected error getting session:", err)
        }
      } finally {
        setLoading(false)
      }
    }
    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh failed - clear local auth state without global sign-out
        await handleInvalidAuthSession('Token refresh failed')
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed successfully, update user
        setUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT') {
        // User signed out, clear state
        setUser(null)
        setProfile(null)
        setSubscriptionPlan(FREE_PLAN_IDENTIFIER)
        setUserElo(null)
        setIsAdmin(false)
        setIsDev(false)
        setProfileSyncedUserId(null)
      } else {
        // Other events (SIGNED_IN, USER_UPDATED, etc.)
        setUser(session?.user ?? null)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [handleInvalidAuthSession])

  const hydrateUserFromSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        if (isInvalidRefreshTokenError(error.message)) {
          await handleInvalidAuthSession(error.message)
          return
        }
        console.error("Error syncing session:", error)
      }

      setUser(data?.session?.user ?? null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (isInvalidRefreshTokenError(msg)) {
        await handleInvalidAuthSession(msg)
      } else {
        console.error("Unexpected error syncing session:", err)
      }
    }
  }, [handleInvalidAuthSession])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!isAuthPopupMessage(event.data)) return

      if (event.data.type === AUTH_MESSAGE_SUCCESS) {
        void hydrateUserFromSession()
        return
      }

      if (event.data.type === AUTH_MESSAGE_ERROR) {
        const detail = event.data.message ?? "Autentificarea a eșuat."
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("planck:oauth-error", { detail: { message: detail } }))
        }
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [hydrateUserFromSession])

  // Fetch profile din tabelul profiles când userul se schimbă
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setSubscriptionPlan(FREE_PLAN_IDENTIFIER)
      setUserElo(null)
      setIsAdmin(false)
      setIsDev(false)
      setProfileSyncedUserId(null)
      return
    }

    setProfileSyncedUserId(null)
    const { data } = await supabase
      .from("profiles")
      .select("name, nickname, user_icon, grade, plan, plus_months_remaining, is_admin, is_dev")
      .eq("user_id", user.id)
      .single()

    if (data) {
      // Only add timestamp if icon URL doesn't already have one (to prevent constant reloading)
      if (data.user_icon) {
        const iconUrl = data.user_icon.includes('?t=')
          ? data.user_icon
          : `${data.user_icon}?t=${Date.now()}`
        setProfile({ ...data, user_icon: iconUrl })
      } else {
        setProfile(data)
      }
      if (data.plan && typeof data.plan === "string") {
        setSubscriptionPlan(data.plan)
      } else {
        setSubscriptionPlan(FREE_PLAN_IDENTIFIER)
      }

      // Override to plus if user has referral rewards (same logic as use-subscription-plan.ts)
      if ((!data.plan || data.plan === FREE_PLAN_IDENTIFIER) && data.plus_months_remaining > 0) {
        setSubscriptionPlan("plus")
      }

      // Setează starea de admin / dev din baza de date
      setIsAdmin(data.is_admin === true)
      setIsDev(data.is_dev === true)
      setProfileSyncedUserId(user.id)
      return
    }

    // Dacă nu există profil, îl creăm pe loc folosind user_metadata din Supabase
    const userMeta: any = user?.user_metadata || {}
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: user.id,
      name: (userMeta.name as string) || "",
      nickname: (userMeta.nickname as string) || "",
      grade: (userMeta.grade as string) || null,
      plan: FREE_PLAN_IDENTIFIER,
      created_at: new Date().toISOString(),
    })
    if (!insertError) {
      const { data: created } = await supabase
        .from("profiles")
        .select("name, nickname, user_icon, grade, plan, plus_months_remaining, is_admin, is_dev")
        .eq("user_id", user.id)
        .single()
      if (created) {
        // Only add timestamp if icon URL doesn't already have one (to prevent constant reloading)
        if (created.user_icon) {
          const iconUrl = created.user_icon.includes('?t=')
            ? created.user_icon
            : `${created.user_icon}?t=${Date.now()}`
          setProfile({ ...created, user_icon: iconUrl })
        } else {
          setProfile(created)
        }
        setSubscriptionPlan(
          typeof created.plan === "string" && created.plan.trim().length > 0
            ? created.plan
            : FREE_PLAN_IDENTIFIER
        )
        setIsAdmin(created.is_admin === true)
        setIsDev(created.is_dev === true)
      } else {
        setIsAdmin(false)
        setIsDev(false)
      }
    } else {
      setIsAdmin(false)
      setIsDev(false)
    }
    setProfileSyncedUserId(user.id)
  }, [user])

  const fetchUserStats = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_stats')
      .select('elo')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setUserElo(data.elo)
    } else {
      setUserElo(500) // Default ELO for new users
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
    fetchUserStats()
  }, [fetchProfile, fetchUserStats])

  const login = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setUser(data.user ?? null)
    setLoading(false)
    return {
      data: { user: data.user ?? null },
      error,
    }
  }

  const loginWithGoogle = async () => {
    if (typeof window === "undefined") return { error: new Error("Client-only") }
    return signInWithOAuthPopup(supabase, "google")
  }

  const loginWithGitHub = async () => {
    if (typeof window === "undefined") return { error: new Error("Client-only") }
    return signInWithOAuthPopup(supabase, "github")
  }

  const logout = async () => {
    setLoading(true)
    await supabase.auth.signOut({ scope: "local" })
    clearSupabaseAuthStorage()
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("planck_register_onboarding")
      localStorage.removeItem("planck_onboarding_after_oauth")
    }
    setLoading(false)
  }

  const refreshUser = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        if (isInvalidRefreshTokenError(error.message)) {
          await handleInvalidAuthSession(error.message)
          setLoading(false)
          return
        }
        console.error("Error refreshing session:", error)
      }

      setUser(data?.session?.user ?? null)
    } catch (err: any) {
      if (isInvalidRefreshTokenError(err?.message)) {
        await handleInvalidAuthSession(err?.message)
      } else {
        console.error("Unexpected error refreshing session:", err)
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        loginWithGitHub,
        logout,
        refreshUser,
        refreshProfile,
        profile,
        subscriptionPlan,
        userElo,
        isAdmin,
        isDev,
        profileSyncedUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

/**
 * Blochează conținutul paginii până când sesiunea inițială e cunoscută (fără flash de „logged out”).
 */
export function AuthSessionGate({ children }: { children: ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div
        className="min-h-[100dvh] bg-[#121212]"
        aria-busy="true"
        aria-label="Se încarcă sesiunea"
      />
    )
  }

  return <>{children}</>
} 