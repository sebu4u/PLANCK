"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"

interface AuthContextType {
  user: any
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  loginWithGoogle: () => Promise<any>
  loginWithGitHub: () => Promise<any>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  profile: any // nou: profilul din tabelul profiles
  subscriptionPlan: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const FREE_PLAN_IDENTIFIER = "free"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null) // nou: profilul
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>(FREE_PLAN_IDENTIFIER)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    getUser()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Fetch profile din tabelul profiles când userul se schimbă
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setSubscriptionPlan(FREE_PLAN_IDENTIFIER)
      return
    }
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, nickname, user_icon, grade, plan")
        .eq("user_id", user.id)
        .single()
      if (data) {
        if (data.user_icon) {
          setProfile({ ...data, user_icon: `${data.user_icon}?t=${Date.now()}` })
        } else {
          setProfile(data)
        }
        if (data.plan && typeof data.plan === "string") {
          setSubscriptionPlan(data.plan)
        } else {
          setSubscriptionPlan(FREE_PLAN_IDENTIFIER)
        }
        return
      }

      // Dacă nu există profil, îl creăm pe loc folosind user_metadata din Supabase
      if (!data) {
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
            .select("name, nickname, user_icon, grade, plan")
            .eq("user_id", user.id)
            .single()
          if (created) {
            setProfile(created.user_icon ? { ...created, user_icon: `${created.user_icon}?t=${Date.now()}` } : created)
            setSubscriptionPlan(
              typeof created.plan === "string" && created.plan.trim().length > 0
                ? created.plan
                : FREE_PLAN_IDENTIFIER
            )
          }
        }
      }
    }
    fetchProfile()
  }, [user])

  const login = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setUser(data.user ?? null)
    setLoading(false)
    return { data, error }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      }
    })
    setLoading(false)
    return { data, error }
  }

  const loginWithGitHub = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      }
    })
    setLoading(false)
    return { data, error }
  }

  const logout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setLoading(false)
  }

  const refreshUser = async () => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
    setLoading(false)
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
        profile,
        subscriptionPlan,
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