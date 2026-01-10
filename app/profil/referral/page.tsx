"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
    Gift,
    Copy,
    Check,
    Sparkles,
    Share2,
    Crown,
    Home,
    Rocket
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { motion } from "framer-motion"

interface ReferralStats {
    referral_code: string
    plus_months_remaining: number
    total_referrals: number
}

export default function ReferralPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [stats, setStats] = useState<ReferralStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Generate stable star positions only on client
    const stars = useMemo(() => {
        if (!mounted) return []
        const width = typeof window !== 'undefined' ? window.innerWidth : 1000
        return Array.from({ length: 20 }, (_, i) => {
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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login")
            return
        }

        const fetchStats = async () => {
            if (!user) return

            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session?.session?.access_token

                if (!token) {
                    setLoading(false)
                    return
                }

                const response = await fetch("/api/referral/stats", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    setStats(data)
                }
            } catch (error) {
                console.error("Error fetching referral stats:", error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchStats()
        }
    }, [user, authLoading, router])

    const referralLink = stats?.referral_code
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${stats.referral_code}`
        : ''

    const handleCopyLink = async () => {
        if (!referralLink) return

        try {
            await navigator.clipboard.writeText(referralLink)
            setCopied(true)
            toast({
                title: "Link copiat!",
                description: "Poți să-l trimiți prietenilor tăi.",
            })
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            toast({
                title: "Eroare",
                description: "Nu am putut copia linkul. Încearcă din nou.",
                variant: "destructive",
            })
        }
    }

    const handleShare = async () => {
        if (!referralLink) return

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Invitație Planck",
                    text: "Încearcă Planck - cea mai bună platformă pentru a învăța fizica!",
                    url: referralLink,
                })
            } catch (error) {
                // User cancelled share
            }
        } else {
            handleCopyLink()
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#101113] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full bg-[#101113] text-white overflow-hidden flex flex-col font-sans selection:bg-blue-500/30">
            {/* Top Glow Effect */}
            <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-white/10 blur-[120px] rounded-[100%] pointer-events-none z-0" />

            {/* Stars Background */}
            <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none z-0 opacity-60">
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

            {/* Custom Header */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 z-50 flex justify-between items-center relative">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xl font-bold text-white title-font">
                        <Rocket className="w-6 h-6 text-white" />
                        <span className="tracking-tight">PLANCK</span>
                    </div>

                    <button
                        onClick={() => router.push('/pricing')}
                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Pricing
                    </button>
                </div>

                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
                >
                    <Home className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Înapoi acasă</span>
                </button>
            </div>

            <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
                {/* Header Content */}
                <div className="text-center mb-10 mt-8">
                    <h1 className="text-3xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Invită-ți prietenii
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed mb-8">
                        Pentru fiecare prieten care devine membru, ambii primiți <span className="text-white font-medium">1 lună de Plus+ gratuit</span>
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <Crown className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-300">
                            Ai acumulat <span className="text-white font-bold">{stats?.plus_months_remaining ?? 0} luni</span> de Plus+
                        </span>
                    </div>
                </div>

                {/* Referral Link Card */}
                <div className="w-full bg-[#151619]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8 hover:bg-[#1A1B1E]/80 transition-all duration-300">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                        <Share2 className="w-5 h-5 text-gray-400" />
                        Linkul tău unic
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 bg-black/20 rounded-xl px-4 py-3 border border-white/5 font-mono text-sm text-gray-300 overflow-hidden flex items-center">
                            <span className="truncate w-full">{referralLink || "Se generează linkul..."}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleCopyLink}
                                className="bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/5 transition-all"
                                disabled={!stats?.referral_code}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Copiat!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copiază
                                    </>
                                )}
                            </Button>
                            {typeof navigator !== 'undefined' && 'share' in navigator && (
                                <Button
                                    onClick={handleShare}
                                    variant="outline"
                                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                    disabled={!stats?.referral_code}
                                >
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="w-full bg-[#151619]/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-[#1A1B1E]/80 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-medium text-white">Cum funcționează exact?</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                1
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-base">Trimite linkul</h4>
                                <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                                    Copiază linkul unic de mai sus și trimite-l prietenilor tăi pe WhatsApp, Instagram sau orice altă aplicație.
                                </p>
                            </div>
                        </div>

                        <div className="relative pl-4 ml-4 border-l border-dashed border-white/10 -my-2 py-4" />

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                2
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-base">Prietenii se înregistrează</h4>
                                <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                                    Ei își creează un cont gratuit pe Planck folosind linkul tău. Nu trebuie să plătească nimic.
                                </p>
                            </div>
                        </div>

                        <div className="relative pl-4 ml-4 border-l border-dashed border-white/10 -my-2 py-4" />

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                3
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-base">Toată lumea câștigă</h4>
                                <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                                    Tu primești instant o lună de acces Plus+. Prietenul tău primește și el o lună de Plus+ ca bun venit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
