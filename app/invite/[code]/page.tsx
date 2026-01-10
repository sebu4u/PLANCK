"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    Rocket,
    Brain,
    BookOpen,
    Sparkles,
    PenTool,
    ArrowRight,
    Users,
    Zap,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Prism from "@/components/Prism"

interface ReferrerInfo {
    name: string
    nickname?: string
}

export default function InvitePage() {
    const params = useParams()
    const router = useRouter()
    const code = params.code as string

    const [loading, setLoading] = useState(true)
    const [valid, setValid] = useState(false)
    const [referrer, setReferrer] = useState<ReferrerInfo | null>(null)

    useEffect(() => {
        const validateCode = async () => {
            try {
                const response = await fetch(`/api/referral/info?code=${code}`)
                const data = await response.json()

                if (data.valid) {
                    setValid(true)
                    setReferrer(data.referrer)
                } else {
                    setValid(false)
                }
            } catch (error) {
                console.error("Error validating referral code:", error)
                setValid(false)
            } finally {
                setLoading(false)
            }
        }

        if (code) {
            validateCode()
        }
    }, [code])

    const benefits = [
        {
            icon: Brain,
            title: "AI Tutor Personalizat",
            description: "Insight AI te ajută să înțelegi fizica pas cu pas"
        },
        {
            icon: BookOpen,
            title: "500+ Probleme de Fizică",
            description: "Cu rezolvări video și explicații detaliate"
        },
        {
            icon: Sparkles,
            title: "Learning Roadmaps",
            description: "Trasee personalizate pentru fiecare capitol"
        },
        {
            icon: PenTool,
            title: "Planck Sketch",
            description: "Whiteboard colaborativ pentru rezolvări"
        }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#101113] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    if (!valid) {
        return (
            <div className="min-h-screen bg-[#101113] text-white flex flex-col items-center justify-center p-4">
                <Rocket className="w-16 h-16 text-gray-500 mb-6" />
                <h1 className="text-2xl font-bold mb-2">Link invalid</h1>
                <p className="text-gray-400 mb-8 text-center">
                    Acest link de invitație nu este valid sau a expirat.
                </p>
                <Button
                    onClick={() => router.push("/")}
                    className="bg-white text-black hover:bg-gray-200"
                >
                    Mergi la pagina principală
                </Button>
            </div>
        )
    }

    const referrerName = referrer?.name || referrer?.nickname || "Un prieten"

    return (
        <div className="relative min-h-screen w-full bg-[#101113] text-white flex flex-col lg:flex-row overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Full Screen Background Decor */}
            <div className="absolute inset-0 w-full h-full z-0 opacity-40">
                <Prism
                    animationType="rotate"
                    timeScale={0.5}
                    height={3.5}
                    baseWidth={5.5}
                    scale={2.5}
                    hueShift={0}
                    colorFrequency={1}
                    noise={0.1}
                    glow={1}
                    offset={{ y: -80 }}
                    suspendWhenOffscreen
                />
            </div>

            {/* Left Side - Invitation & Features */}
            <div className="relative w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center items-center z-10">
                <div className="relative z-10 w-full max-w-lg">
                    {/* Invite Card */}
                    <motion.div
                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden group"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Rocket className="w-24 h-24 text-white rotate-45" />
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <Sparkles className="w-3 h-3" />
                            Invitație Specială
                        </div>

                        <h1 className="text-3xl font-bold mb-2 text-white leading-tight">
                            {referrerName}
                        </h1>
                        <p className="text-lg text-gray-400 font-medium mb-6">
                            te invită în universul <span className="text-white">Planck</span>.
                        </p>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 mt-1">
                                    <Brain className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">AI Tutor Personal</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">Înțelegi fizica instant. Explicații clare, non-stop, la orice oră.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 mt-1">
                                    <Zap className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Înveți Rapid & Eficient</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">Fără pierdere de timp. 500+ probleme rezolvate video.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 mt-1">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Succes Garantat</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">Tot ce ai nevoie pentru note de 10 și performanță.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - CTA & Login */}
            <div className="relative w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center items-center bg-black/20 backdrop-blur-sm border-l border-white/5 z-20">
                <motion.div
                    className="w-full max-w-md text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: 'var(--font-horizon, sans-serif)' }}>
                        JOIN THE
                    </h2>
                    <h2 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter mb-6" style={{ fontFamily: 'var(--font-horizon, sans-serif)' }}>
                        UNIVERSE
                    </h2>

                    <p className="text-xl text-gray-400 mb-10 font-light">
                        Nu mai pierde timpul. Începe acum.
                    </p>

                    <Button
                        onClick={() => router.push(`/register?ref=${code}`)}
                        className="w-full bg-white text-black hover:bg-gray-200 h-16 text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all duration-300 mb-4"
                    >
                        Creează Cont Gratuit
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-12">
                        Gratuit pentru totdeauna • Fără card bancar
                    </p>

                    <div className="pt-8 border-t border-white/10">
                        <p className="text-gray-400 mb-2">Ai deja cont?</p>
                        <Link href="/login" className="text-white font-bold hover:text-blue-400 transition-colors inline-flex items-center gap-1 group">
                            Conectează-te aici
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                <div className="absolute bottom-6 left-0 right-0 text-center">
                    <p className="text-xs text-gray-600">© 2025 Planck. Toate drepturile rezervate.</p>
                </div>
            </div>
        </div>
    )
}
