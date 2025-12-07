"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { X, CheckCircle2, Circle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

interface GettingStartedProgress {
  id: string
  user_id: string
  problems_solved_count: number
  board_created: boolean
  code_generated: boolean
  completed: boolean
  elo_awarded: boolean
  dismissed: boolean
  created_at: string
  updated_at: string
}

export function GettingStartedCard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [progress, setProgress] = useState<GettingStartedProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const pathnameRef = useRef(pathname)

  // Detect page navigation and hide card during loading
  useEffect(() => {
    // If pathname changed, we're navigating
    if (pathnameRef.current !== pathname) {
      setIsPageLoading(true)
      setLoading(true) // Reset loading state
      setProgress(null) // Clear progress to force reload
      pathnameRef.current = pathname
      
      // Wait for page to load using requestAnimationFrame for better timing
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => {
          // Use a small delay to ensure page is fully rendered
          setTimeout(() => {
            setIsPageLoading(false)
            // Force reload by resetting loading state
            setLoading(true)
          }, 100)
        })
        return () => cancelAnimationFrame(frame2)
      })
      
      return () => {
        cancelAnimationFrame(frame1)
      }
    }
  }, [pathname])

  // Load progress from database - reload when page loading completes
  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setLoading(false)
      }
      return
    }

    // If page is still loading, wait
    if (isPageLoading) {
      return
    }

    const loadProgress = async () => {
      try {
        // Fetch progress from database
        const { data, error } = await supabase
          .from("getting_started_progress")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        // Handle errors - ignore if table doesn't exist or if it's a "not found" error
        if (error) {
          // PGRST116 = no rows returned (expected when record doesn't exist)
          // PGRST106 = relation does not exist (table not created yet)
          // Other codes might indicate actual errors
          const ignorableErrorCodes = ["PGRST116", "PGRST106", "42P01"]
          const isIgnorableError = ignorableErrorCodes.includes(error.code || "")
          
          // Only log if it's not an ignorable error and error object has meaningful info
          if (!isIgnorableError && (error.message || error.code || Object.keys(error).length > 0)) {
            console.error("Error loading getting started progress:", error)
          }
          
          // If table doesn't exist, just return and don't show the card
          if (error.code === "PGRST106" || error.code === "42P01") {
            setLoading(false)
            return
          }
        }

        if (data) {
          setProgress(data)
          // Don't show if completed or dismissed (but dismissed will reset on next visit)
          // We'll reset dismissed on each page load so card reappears
          if (data.completed) {
            setIsDismissed(true)
          }
        } else if (!error || error.code === "PGRST116") {
          // Only try to initialize if no error or if it's just a "not found" error
          // Use upsert to handle race conditions where record might be created between check and insert
          const { data: newProgress, error: insertError } = await supabase
            .from("getting_started_progress")
            .upsert(
              {
                user_id: user.id,
                problems_solved_count: 0,
                board_created: false,
                code_generated: false,
                completed: false,
                elo_awarded: false,
                dismissed: false,
              },
              {
                onConflict: "user_id",
                ignoreDuplicates: false, // Update if exists
              }
            )
            .select()
            .single()

          if (insertError) {
            // Ignore insert errors if table doesn't exist or if it's a conflict (already exists)
            const ignorableInsertErrors = ["PGRST106", "42P01", "23505"] // 23505 = unique_violation
            const isConflictError = insertError.code === "23505" || 
                                   insertError.message?.includes("duplicate key") ||
                                   insertError.message?.includes("unique constraint")
            
            // Check if error has meaningful information
            const hasMeaningfulError = insertError.message || 
                                      insertError.code || 
                                      (insertError.details && Object.keys(insertError.details).length > 0) ||
                                      (Object.keys(insertError).length > 1)
            
            if (!ignorableInsertErrors.includes(insertError.code || "") && 
                !isConflictError && 
                hasMeaningfulError) {
              console.error("Error initializing getting started progress:", insertError)
            }
            
            // If it's a conflict, try to fetch the existing record
            if (isConflictError || insertError.code === "23505") {
              const { data: existingData } = await supabase
                .from("getting_started_progress")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle()
              
              if (existingData) {
                setProgress(existingData)
              }
            }
          } else if (newProgress) {
            setProgress(newProgress)
          }
        }
      } catch (err) {
        // Only log if it's a meaningful error
        if (err instanceof Error && err.message) {
          console.error("Error in loadProgress:", err)
        }
      } finally {
        setLoading(false)
      }
    }

    loadProgress()

    // Subscribe to changes with realtime
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`getting_started_progress_${user.id}`, {
          config: {
            broadcast: { self: true },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "getting_started_progress",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("🔄 Getting started progress realtime update:", payload)
            if (payload.new) {
              setProgress((prev) => {
                const newData = payload.new as GettingStartedProgress
                // Only update if data actually changed
                if (!prev || JSON.stringify(prev) !== JSON.stringify(newData)) {
                  console.log("✅ Updating progress from realtime:", newData)
                  return newData
                }
                return prev
              })
            }
          }
        )
        .subscribe((status) => {
          console.log("Getting started subscription status:", status)
          if (status === "SUBSCRIBED") {
            console.log("✅ Subscribed to getting started progress updates")
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("⚠️ Getting started subscription error:", status)
          }
        })
    } catch (err) {
      console.error("Error setting up realtime subscription:", err)
    }

    // Also poll periodically as fallback (every 1.5 seconds for faster updates)
    const pollInterval = setInterval(() => {
      if (!loading && user) {
        supabase
          .from("getting_started_progress")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (!error && data) {
              setProgress((prev) => {
                // Only update if data actually changed
                if (!prev || JSON.stringify(prev) !== JSON.stringify(data)) {
                  console.log("📊 Polling update:", data)
                  return data
                }
                return prev
              })
            }
          })
      }
    }, 1500) // Poll every 1.5 seconds for faster updates

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      clearInterval(pollInterval)
    }
  }, [user?.id, authLoading, isPageLoading]) // Reload when page loading completes

  // Check if all tasks are completed
  useEffect(() => {
    if (!progress || progress.completed) return

    const allCompleted =
      progress.problems_solved_count >= 3 &&
      progress.board_created &&
      progress.code_generated

    if (allCompleted) {
      handleAllTasksCompleted()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  const handleAllTasksCompleted = async () => {
    if (!user || !progress) return

    try {
      // Mark as completed
      const { error: updateError } = await supabase
        .from("getting_started_progress")
        .update({
          completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Error updating completion status:", updateError)
        return
      }

      // Award ELO if not already awarded
      if (!progress.elo_awarded) {
        // Update ELO directly
        const { data: statsData } = await supabase
          .from("user_stats")
          .select("elo")
          .eq("user_id", user.id)
          .maybeSingle()

        if (statsData) {
          await supabase
            .from("user_stats")
            .update({
              elo: statsData.elo + 50,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
        } else {
          // Initialize user_stats if it doesn't exist
          await supabase
            .from("user_stats")
            .insert({
              user_id: user.id,
              elo: 550, // 500 default + 50 bonus
              rank: "Bronze III",
            })
        }

        // Mark ELO as awarded
        await supabase
          .from("getting_started_progress")
          .update({
            elo_awarded: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        // Show confetti
        setShowConfetti(true)
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
        })

        // Hide confetti after animation
        setTimeout(() => {
          setShowConfetti(false)
        }, 5000)
      }
    } catch (err) {
      console.error("Error in handleAllTasksCompleted:", err)
    }
  }

  const handleDismiss = async () => {
    if (!user) return

    // Only dismiss for this session (don't persist, so it reappears on next visit)
    setIsDismissed(true)
  }

  // Don't show if loading, no user, completed, dismissed, or page is loading
  if (
    loading ||
    authLoading ||
    isPageLoading ||
    !user ||
    !progress ||
    progress.completed ||
    isDismissed ||
    pathname === "/#" // Don't show on homepage hash
  ) {
    return null
  }

  const tasks = [
    {
      id: "problems",
      label: "Rezolvă 3 probleme",
      completed: progress.problems_solved_count >= 3,
      progress: progress.problems_solved_count,
      target: 3,
      link: "/probleme",
    },
    {
      id: "board",
      label: "Creează o tablă pe Planck Sketch",
      completed: progress.board_created,
      link: "/sketch/boards",
    },
    {
      id: "code",
      label: "Generează cod cu AI Agent în IDE",
      completed: progress.code_generated,
      link: "/planckcode/ide",
    },
  ]

  const allCompleted = tasks.every((task) => task.completed)

  // Determine card theme based on pathname (same as navbar)
  const isDashboard = pathname === "/dashboard"
  const isHomepage = pathname === "/"
  const isInsightRoute = pathname?.startsWith("/insight") ?? false
  const isSketchRoute = pathname?.startsWith("/sketch") ?? false
  const isPlanckCodeRoute = pathname?.startsWith("/planckcode") ?? false

  const cardTheme = isDashboard
    ? {
        background: "bg-[#080808]",
        border: "border-[#1a1a1a]",
      }
    : isInsightRoute || isSketchRoute
    ? {
        background: "bg-black",
        border: "border-gray-800",
      }
    : isPlanckCodeRoute
    ? {
        background: "bg-[#181818]",
        border: "border-gray-600",
      }
    : {
        background: "bg-[#0d1117]",
        border: "border-gray-800",
      }

  return (
    <div className="fixed top-20 right-4 z-[250] w-[320px] max-w-[calc(100vw-2rem)] hidden md:block animate-in slide-in-from-right">
      <Card 
        className={`${cardTheme.border} backdrop-blur-md shadow-xl transition-all duration-300 border opacity-60 hover:opacity-90`}
        style={{
          backgroundColor: isDashboard 
            ? 'rgba(8, 8, 8, 0.6)' 
            : isInsightRoute || isSketchRoute
            ? 'rgba(0, 0, 0, 0.6)'
            : isPlanckCodeRoute
            ? 'rgba(24, 24, 24, 0.6)'
            : 'rgba(13, 17, 23, 0.6)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDashboard 
            ? 'rgba(8, 8, 8, 0.9)' 
            : isInsightRoute || isSketchRoute
            ? 'rgba(0, 0, 0, 0.9)'
            : isPlanckCodeRoute
            ? 'rgba(24, 24, 24, 0.9)'
            : 'rgba(13, 17, 23, 0.9)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDashboard 
            ? 'rgba(8, 8, 8, 0.6)' 
            : isInsightRoute || isSketchRoute
            ? 'rgba(0, 0, 0, 0.6)'
            : isPlanckCodeRoute
            ? 'rgba(24, 24, 24, 0.6)'
            : 'rgba(13, 17, 23, 0.6)'
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white text-sm">Getting Started</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-2 text-sm transition-opacity",
                  task.completed && "opacity-60"
                )}
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {task.link ? (
                    <Link
                      href={task.link}
                      className="text-gray-200 hover:text-white transition-colors"
                    >
                      {task.label}
                    </Link>
                  ) : (
                    <span className="text-gray-200">{task.label}</span>
                  )}
                  {task.progress !== undefined && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {task.progress}/{task.target}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!allCompleted && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400 text-center">
                Completează toate taskurile pentru <span className="text-yellow-400 font-semibold">+50 ELO</span>
              </p>
            </div>
          )}

          {allCompleted && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-xs text-green-400 text-center font-semibold">
                🎉 Felicitări! Ai primit +50 ELO!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

