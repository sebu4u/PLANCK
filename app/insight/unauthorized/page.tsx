"use client"

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { Lock, Chrome, Github, ArrowLeft, Brain, Check, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

function InsightUnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, loginWithGoogle, loginWithGitHub } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState<"google" | "github" | null>(null)
  const [mounted, setMounted] = useState(false)

  // Generate stable star positions only on client
  const stars = useMemo(() => {
    if (!mounted) return []
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000
    // Reduce stars on mobile for better performance
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    const starCount = isMobile ? 10 : 20
    return Array.from({ length: starCount }, (_, i) => {
      const seed = i * 0.618033988749895
      const random = (seed: number) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }
      
      return {
        id: i,
        x: random(seed) * width,
        y: random(seed + 1) * 400,
        opacity: random(seed + 2) * 0.5 + 0.3,
        scale: random(seed + 3) * 0.5 + 0.5,
        width: random(seed + 4) * 2 + 1,
        height: random(seed + 5) * 2 + 1,
        animateY: random(seed + 6) * -20,
        animateOpacity: random(seed + 7) * 0.3 + 0.2,
        duration: random(seed + 8) * 5 + 5,
      }
    })
  }, [mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get redirect URL from query params, default to /insight/chat
  const redirectUrl = searchParams.get('redirect') || '/insight/chat'

  // If user is already authenticated, redirect them to chat
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectUrl)
    }
  }, [user, authLoading, router, redirectUrl])

  const handleGoogleLogin = async () => {
    setLoading("google")
    const { error } = await loginWithGoogle()
    if (error) {
      toast({
        title: "Eroare la autentificare cu Google",
        description: error.message,
        variant: "destructive",
      })
      setLoading(null)
    } else {
      setTimeout(() => {
        router.push(redirectUrl)
      }, 500)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading("github")
    const { error } = await loginWithGitHub()
    if (error) {
      toast({
        title: "Eroare la autentificare cu GitHub",
        description: error.message,
        variant: "destructive",
      })
      setLoading(null)
    } else {
      setTimeout(() => {
        router.push(redirectUrl)
      }, 500)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // If user is already authenticated, don't render the page (will redirect via useEffect)
  if (user) {
    return null
  }

  const features = [
    "Întreabă orice despre fizică",
    "Rezolvă probleme pas cu pas",
    "Primește explicații personalizate",
    "Învață la propriul tău ritm",
  ]

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full"
      >
        {/* Main Card */}
        <div className="relative flex flex-col md:flex-row gap-6 md:gap-10 p-6 sm:p-8 md:p-12 rounded-xl md:rounded-2xl border border-white/10 bg-[#151619]/60 backdrop-blur-sm hover:bg-[#1A1B1E]/80 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]">
          {/* Left Side - Content */}
          <div className="flex-1 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
                  <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 relative z-10" />
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 absolute -bottom-1 -right-1 z-10" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                    Autentificare necesară
                  </h1>
                  <p className="text-gray-400 text-base sm:text-lg md:text-xl mt-1 md:mt-2">
                    Ai nevoie de cont pentru a folosi Insight AI
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-white font-semibold text-sm sm:text-base uppercase tracking-wide text-gray-300">
                Ce poți face cu Insight?
              </h3>
              <ul className="space-y-2.5 md:space-y-3">
                {features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2.5 md:gap-3 text-sm sm:text-base text-gray-300"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Info Text */}
            <p className="text-sm sm:text-base text-gray-500 pt-2 md:pt-4">
              Înregistrarea este gratuită și durează doar câteva secunde
            </p>
          </div>

          {/* Right Side - Auth Buttons */}
          <div className="flex-1 space-y-4 md:space-y-6 flex flex-col justify-center md:justify-center">
            <div className="space-y-3 md:space-y-4">
              <Button
                onClick={handleGoogleLogin}
                disabled={loading !== null}
                className={cn(
                  "w-full h-12 sm:h-14 text-sm sm:text-base bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 shadow-lg shadow-white/10 touch-manipulation",
                  loading === "google" && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading === "google" ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                    <span className="sm:inline">Se conectează...</span>
                  </>
                ) : (
                  <>
                    <Chrome className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 shrink-0" />
                    <span>Continuă cu Google</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleGitHubLogin}
                disabled={loading !== null}
                className={cn(
                  "w-full h-12 sm:h-14 text-sm sm:text-base bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all duration-200 touch-manipulation",
                  loading === "github" && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading === "github" ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    <span className="sm:inline">Se conectează...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                    <span>Continuă cu GitHub</span>
                  </>
                )}
              </Button>
            </div>

            {/* Back Button */}
            <div className="pt-4 md:pt-6 border-t border-white/5">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="w-full h-11 sm:h-12 text-sm sm:text-base text-gray-400 hover:text-white hover:bg-white/5 touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                Înapoi
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function InsightUnauthorizedPage() {
  const [mounted, setMounted] = useState(false)

  // Generate stable star positions only on client
  const stars = useMemo(() => {
    if (!mounted) return []
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000
    // Reduce stars on mobile for better performance
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    const starCount = isMobile ? 10 : 20
    return Array.from({ length: starCount }, (_, i) => {
      const seed = i * 0.618033988749895
      const random = (seed: number) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }
      
      return {
        id: i,
        x: random(seed) * width,
        y: random(seed + 1) * 400,
        opacity: random(seed + 2) * 0.5 + 0.3,
        scale: random(seed + 3) * 0.5 + 0.5,
        width: random(seed + 4) * 2 + 1,
        height: random(seed + 5) * 2 + 1,
        animateY: random(seed + 6) * -20,
        animateOpacity: random(seed + 7) * 0.3 + 0.2,
        duration: random(seed + 8) * 5 + 5,
      }
    })
  }, [mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen w-full bg-[#101113] text-white overflow-hidden flex flex-col font-sans selection:bg-blue-500/30">
      {/* Top Glow Effect */}
      <div className="absolute -top-[200px] sm:-top-[300px] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1200px] h-[400px] sm:h-[600px] bg-white/10 blur-[80px] sm:blur-[120px] rounded-[100%] pointer-events-none z-0" />
      
      {/* Stars Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] sm:h-[600px] overflow-hidden pointer-events-none z-0 opacity-40 sm:opacity-60">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute bg-white rounded-full"
            initial={{
              x: star.x,
              y: star.y,
              opacity: star.opacity,
              scale: star.scale,
            }}
            animate={{
              y: [null, star.animateY],
              opacity: [null, star.animateOpacity],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
            }}
          />
        ))}
      </div>

      <Navigation />
      
      <main className="relative z-10 flex-1 flex items-center justify-center px-2 sm:px-4 pt-20 sm:pt-24 pb-4 sm:py-8 min-h-[calc(100vh-64px)]">
        <Suspense fallback={
          <div className="w-full max-w-md px-2">
            <div className="bg-[#151619]/60 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm sm:text-base">Se încarcă...</p>
              </div>
            </div>
          </div>
        }>
          <InsightUnauthorizedContent />
        </Suspense>
      </main>
    </div>
  )
}

