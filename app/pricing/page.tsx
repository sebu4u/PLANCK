"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Check, Loader2, Rocket, X } from "lucide-react"
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 })
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString())

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

export default function PricingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"individual" | "schools">("individual")
  const [isYearly, setIsYearly] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)

  // Generate stable star positions only on client
  const stars = useMemo(() => {
    if (!mounted) return []
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000
    return Array.from({ length: 20 }, (_, i) => {
      // Use a seeded random based on index for consistency
      const seed = i * 0.618033988749895 // Golden ratio for better distribution
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

  // Individual Plans Data
  const individualPlans = [
    {
      id: "free",
      name: "Free",
      priceLabel: "Gratuit",
      description: "Pentru cei care vor să exploreze",
      features: [
        "3 prompt-uri gratuite pe zi",
        "Acces limitat la fișiere",
        "Acces limitat la learning roadmaps",
      ],
      missingFeatures: [
        "Learning roadmaps complete",
        "Acces la toate modelele",
        "Memorie îmbunătățită",
        "Acces nelimitat la PlanckCode",
      ],
      cta: "Începe acum",
      popular: false,
    },
    {
      id: "plus",
      name: "Plus",
      priceValue: isYearly ? 290 : 29,
      currency: "RON",
      period: isYearly ? "/an" : "/lună",
      description: "Cel mai popular pentru elevi",
      features: [
        "Tot ce conține planul Free",
        "800 prompt-uri pe lună",
        "Upload de 10 fișiere pe zi",
        "Learning roadmaps",
        "Acces la toate modelele",
        "Memorie îmbunătățită",
      ],
      missingFeatures: ["Acces nelimitat la PlanckCode"],
      cta: "Alege planul",
      popular: true,
      highlight: true,
      yearlyDiscountVal: "Economisești 58 RON",
    },
    {
      id: "pro",
      name: "Pro",
      priceValue: isYearly ? 590 : 59,
      currency: "RON",
      period: isYearly ? "/an" : "/lună",
      description: "Putere maximă pentru performanță",
      features: [
        "Tot ce conține planul Free și Plus",
        "Prompt-uri nelimitate",
        "Acces nelimitat la PlanckCode",
      ],
      cta: "Alege planul",
      popular: false,
      yearlyDiscountVal: "Economisești 118 RON",
    },
  ]

  // Schools Plans Data
  const schoolPlans = [
    {
      id: "trial",
      name: "School Trial Package",
      subtitle: "Testați Planck cu o clasă înainte de adoptarea completă.",
      features: [
        "Acces complet la Planck Code, Planck Sketch, Insight AI",
        "Peste 500+ probleme de fizică cu rezolvări video",
        "Acces pentru o clasă întreagă (max. 30 elevi)",
        "Panou de administrare pentru profesori",
        "Asistență tehnică prioritară în timpul trialului",
        "Training rapid pentru profesori (video + call)",
      ],
      cta: "Start School Trial",
      note: "Trialul durează 14 zile și poate fi prelungit la cerere.",
      gradient: "from-white/10 to-gray-400/10",
      border: "border-white/40",
    },
    {
      id: "custom",
      name: "Custom School Plans",
      subtitle: "Planuri flexibile pentru licee, colegii și rețele de școli.",
      features: [
        "Licențe pentru întreg liceul sau doar pentru clase selectate",
        "Acces complet pentru elevi + profesori",
        "Dashboard pentru profesori: progres, rapoarte, teme",
        "Integrare în orarul și resursele școlii",
        "Training complet pentru profesori",
        "Suport tehnic dedicat",
        "Posibilitatea de a activa module extra",
      ],
      cta: "Contact us for a personalized offer",
      note: "Reduceri pentru implementări pe termen lung și parteneriate.",
      gradient: "from-white/10 to-gray-400/10",
      border: "border-white/40",
    },
  ]

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
      
      {/* Back Home Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 right-8 max-[600px]:right-4 z-50 flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
        title="Înapoi acasă"
      >
        <Home className="w-4 h-4" />
        <span className="text-sm font-medium">Înapoi acasă</span>
      </button>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start pt-32 p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-12 z-20 mt-8">
          <div className="flex items-center gap-3 text-3xl font-bold text-white title-font mb-3">
            <Rocket className="w-8 h-8 text-white" />
            <span className="tracking-tight">PLANCK</span>
          </div>
          <p className="text-gray-400 text-lg tracking-wide font-light">
            Simple. Transparent. Flexible.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center p-1 mb-8 sm:mb-12 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab("individual")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
              activeTab === "individual" 
                ? "bg-white text-black shadow-lg scale-105" 
                : "text-gray-400 hover:text-white"
            )}
          >
            Individual
          </button>
          <button
            onClick={() => setActiveTab("schools")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
              activeTab === "schools" 
                ? "bg-white text-black shadow-lg scale-105" 
                : "text-gray-400 hover:text-white"
            )}
          >
            Schools
          </button>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "individual" ? (
              <motion.div
                key="individual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                {/* Cards Grid - Individual */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10 px-2">
                  {individualPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative flex flex-col p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 group hover:-translate-y-1",
                        plan.highlight
                          ? "bg-[#1A1B1E]/80 border-white/40 shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]"
                          : "bg-[#151619]/60 border-white/10 hover:border-white/20 hover:bg-[#1A1B1E]/80"
                      )}
                    >
                      {plan.yearlyDiscountVal && isYearly && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg whitespace-nowrap">
                          {plan.yearlyDiscountVal}
                        </div>
                      )}
                      
                      <div className="mb-5">
                        <h3 className="text-lg font-medium text-gray-200 mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-bold text-white">
                            {plan.priceValue ? (
                              <>
                                <AnimatedPrice value={plan.priceValue} /> {plan.currency}
                              </>
                            ) : (
                              plan.priceLabel
                            )}
                          </span>
                          {plan.priceLabel !== "Gratuit" && (
                            <span className="text-gray-500 text-sm">{plan.period}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-2 min-h-[20px]">{plan.description}</p>
                      </div>

                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                        {plan.missingFeatures?.map((feature, i) => (
                          <li key={`missing-${i}`} className="flex items-start gap-3 text-sm text-gray-600">
                            <X className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => {
                          if (plan.id === "plus" || plan.id === "pro") {
                            setPopupOpen(true)
                          } else if (plan.id === "free") {
                            router.push('/probleme')
                          }
                        }}
                        className={cn(
                          "w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          plan.highlight
                            ? "bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10"
                            : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                        )}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Slider Section - Below Cards */}
                <div className="flex items-center gap-4 bg-[#151619] px-6 py-3 rounded-full border border-white/5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">Save with yearly billing</span>
                    <Switch
                      checked={isYearly}
                      onCheckedChange={setIsYearly}
                      className="data-[state=checked]:bg-[#4A4B4E] data-[state=unchecked]:bg-[#2A2B2E]"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="schools"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto px-2"
              >
                {schoolPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 bg-[#151619]/60 hover:bg-[#1A1B1E]/80",
                      plan.border
                    )}
                  >
                    {/* Background Gradient Hint */}
                    <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", plan.gradient)} />

                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-400 mb-8 text-sm leading-relaxed">{plan.subtitle}</p>

                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-6 border-t border-white/5">
                        <button 
                          onClick={() => setPopupOpen(true)}
                          className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group"
                        >
                          {plan.cta}
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-3 text-center">
                          {plan.note}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Popup Dialog */}
      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent className="bg-[#1A1B1E]/90 backdrop-blur-sm border-white/40 text-white max-w-md rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white text-center">
              Almost there.
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-center mt-4 text-base leading-relaxed">
              Lucrăm la un Planck Pro care chiar merită banii.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setPopupOpen(false)}
              className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
            >
              Închide
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

