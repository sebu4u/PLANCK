"use client"

import React, { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/auth-provider'
import { Trophy } from 'lucide-react'

interface GamificationBadge {
  id: string
  name: string
  description: string
  icon: string
  required_problems: number
  color: string
}

interface UserBadge {
  id: string
  badge_id: string
  earned_at: string
  badge: GamificationBadge
}

export function UserBadges() {
  const { user } = useAuth()
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [solvedCount, setSolvedCount] = useState(0)
  const [nextBadge, setNextBadge] = useState<GamificationBadge | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchBadges = async () => {
      try {
        // Get number of solved problems
        const { count } = await supabase
          .from('solved_problems')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        const solvedNow = count || 0
        setSolvedCount(solvedNow)

        // Get user's earned badges
        const { data: badges, error } = await supabase
          .from('user_badges')
          .select(`
            id,
            badge_id,
            earned_at,
            badge:badges (
              id,
              name,
              description,
              icon,
              required_problems,
              color
            )
          `)
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false })

        if (error) {
          console.error('Error fetching badges:', error)
          return
        }

        setUserBadges(badges || [])
        
        // Find next available badge
        const { data: allBadges } = await supabase
          .from('badges')
          .select('*')
          .order('required_problems', { ascending: true })
        
        if (allBadges) {
          const next = allBadges.find(badge => badge.required_problems > solvedNow)
          setNextBadge(next || null)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [user])

  if (loading) {
    return (
      <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white/90">Badges</h3>
          <Badge className="bg-white/10 text-white/90 hover:bg-white/20">
            {userBadges.length}
          </Badge>
        </div>
        <div className="text-sm text-white/60">
          {solvedCount} probleme rezolvate
        </div>
      </div>

      {/* Badges Grid */}
      {userBadges.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-lg font-medium text-white/70 mb-2">Nu ai câștigat încă niciun badge</p>
          <p className="text-sm text-white/50">Rezolvă probleme pentru a câștiga badge-uri!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {userBadges.map((userBadge) => (
            <TooltipProvider key={userBadge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="group cursor-pointer">
                    <div className="relative p-4 rounded-xl border-2 transition-all duration-300 bg-white/[0.03] border-white/10 hover:shadow-lg hover:border-white/30">
                      <div className="text-center">
                        <div className="text-4xl mb-2 animate-bounce-in">
                          {userBadge.badge.icon}
                        </div>
                        <div className="text-xs font-bold text-white/90 truncate">
                          {userBadge.badge.name}
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          {new Date(userBadge.earned_at).toLocaleDateString('ro-RO')}
                        </div>
                      </div>
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-[#1f1f23] border-white/20">
                  <div className="text-center">
                    <div className="text-2xl mb-2">{userBadge.badge.icon}</div>
                    <div className="font-bold text-sm text-white/90">{userBadge.badge.name}</div>
                    <div className="text-xs text-white/60 mt-1">
                      {userBadge.badge.description}
                    </div>
                    <div className="text-xs text-white/50 mt-2">
                      Câștigat pe {new Date(userBadge.earned_at).toLocaleDateString('ro-RO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
      
      {/* Progress to Next Badge */}
      {nextBadge && (
        <div className="mt-6 p-4 bg-white/[0.03] rounded-xl border border-white/10">
          <div className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <span className="text-xl">{nextBadge.icon}</span>
            <span>Progres către "{nextBadge.name}"</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min((solvedCount / nextBadge.required_problems) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <div className="text-xs font-mono text-white/60 min-w-[60px] text-right">
              {solvedCount}/{nextBadge.required_problems}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
