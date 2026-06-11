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
      <div className="rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)] transition-colors hover:border-[#d4d4d4]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-[#191919]">Badges</h3>
          <Badge className="bg-[#f1f1f1] text-[#444444] hover:bg-[#e9e9e9]">
            {userBadges.length}
          </Badge>
        </div>
        <div className="text-sm text-[#666666]">
          {solvedCount} probleme rezolvate
        </div>
      </div>

      {/* Badges Grid */}
      {userBadges.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎯</div>
          <p className="mb-2 text-lg font-medium text-[#444444]">Nu ai câștigat încă niciun badge</p>
          <p className="text-sm text-[#7f7f7f]">Rezolvă probleme pentru a câștiga badge-uri!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {userBadges.map((userBadge) => (
            <TooltipProvider key={userBadge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="group cursor-pointer">
                    <div className="relative rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-4 transition-all duration-300 hover:border-[#d4d4d4] hover:shadow-lg hover:shadow-black/5">
                      <div className="text-center">
                        <div className="text-4xl mb-2 animate-bounce-in">
                          {userBadge.badge.icon}
                        </div>
                        <div className="truncate text-xs font-bold text-[#191919]">
                          {userBadge.badge.name}
                        </div>
                        <div className="mt-1 text-xs text-[#7f7f7f]">
                          {new Date(userBadge.earned_at).toLocaleDateString('ro-RO')}
                        </div>
                      </div>
                      {/* Shimmer effect */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs border-[#e5e5e5] bg-white text-[#191919] shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl mb-2">{userBadge.badge.icon}</div>
                    <div className="text-sm font-bold text-[#191919]">{userBadge.badge.name}</div>
                    <div className="mt-1 text-xs text-[#666666]">
                      {userBadge.badge.description}
                    </div>
                    <div className="mt-2 text-xs text-[#7f7f7f]">
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
        <div className="mt-6 rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#444444]">
            <span className="text-xl">{nextBadge.icon}</span>
            <span>Progres către "{nextBadge.name}"</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#eeeeee]">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min((solvedCount / nextBadge.required_problems) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <div className="min-w-[60px] text-right font-mono text-xs text-[#666666]">
              {solvedCount}/{nextBadge.required_problems}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
