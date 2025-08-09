"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"

interface AuthContextType {
  user: any
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  profile: any // nou: profilul din tabelul profiles
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null) // nou: profilul

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
      return
    }
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, nickname, user_icon, grade")
        .eq("user_id", user.id)
        .single()
      if (data) {
        if (data.user_icon) {
          setProfile({ ...data, user_icon: `${data.user_icon}?t=${Date.now()}` })
        } else {
          setProfile(data)
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
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, profile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
} 