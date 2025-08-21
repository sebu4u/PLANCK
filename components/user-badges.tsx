"use client"

import React, { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/auth-provider'

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
        // Obține numărul de probleme rezolvate
        const { count } = await supabase
          .from('solved_problems')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        const solvedNow = count || 0
        setSolvedCount(solvedNow)

        // Obține badge-urile câștigate de utilizator
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
        
        // Găsește următorul badge disponibil
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
      <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-purple-700 dark:text-pink-400">
            Badge-uri câștigate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border-0 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-purple-700 dark:text-pink-400 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          Badge-uri câștigate
          <Badge variant="secondary" className="ml-2 bg-gradient-to-tr from-purple-600 to-pink-600 text-white">
            {userBadges.length}
          </Badge>
        </CardTitle>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Ai rezolvat {solvedCount} probleme
          {nextBadge && (
            <span> din {nextBadge.required_problems} necesare pentru următorul badge</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {userBadges.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-lg font-medium mb-2">Nu ai câștigat încă niciun badge</p>
            <p className="text-sm">Rezolvă probleme pentru a câștiga badge-uri!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userBadges.map((userBadge) => (
              <TooltipProvider key={userBadge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group cursor-pointer">
                      <div className={`
                        relative p-4 rounded-xl border-2 transition-all duration-300
                        bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-zinc-800/80 dark:to-zinc-900/80
                        border-purple-200 dark:border-purple-700
                        hover:scale-105 hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-500
                        transform hover:rotate-1
                        ${userBadge.badge.color}
                      `}>
                        <div className="text-center">
                          <div className="text-3xl mb-2 animate-bounce-in">
                            {userBadge.badge.icon}
                          </div>
                          <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {userBadge.badge.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(userBadge.earned_at).toLocaleDateString('ro-RO')}
                          </div>
                        </div>
                        {/* Efect de strălucire */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-center">
                      <div className="text-lg mb-1">{userBadge.badge.icon}</div>
                      <div className="font-bold text-sm">{userBadge.badge.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {userBadge.badge.description}
                      </div>
                      <div className="text-xs text-purple-600 dark:text-pink-400 mt-2">
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
        
        {/* Progres către următorul badge */}
        {nextBadge && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
            <div className="text-sm font-medium text-purple-700 dark:text-pink-400 mb-2 flex items-center gap-2">
              <span>{nextBadge.icon}</span>
              Progres către "{nextBadge.name}"
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/60 dark:bg-zinc-800/60 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${Math.min((solvedCount / nextBadge.required_problems) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                {solvedCount}/{nextBadge.required_problems}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
