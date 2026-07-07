"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, BookOpen, TrendingUp, GraduationCap,
  Play, Zap, Check, Star, ArrowRight, Clock, Flame, X,
} from "lucide-react"
import { HomePageNavbar } from "@/components/homepage-navbar"
import { Footer } from "@/components/footer"
import {
  FadeInUp, FadeInLeft, FadeInRight,
  StaggerContainer, StaggerItem, ScaleIn,
} from "@/components/scroll-animations"

// ── Countdown ────────────────────────────────────────────────────────────────
const DEADLINE = new Date("2026-08-01T00:00:00")

function useCountdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = DEADLINE.getTime() - Date.now()
      if (diff <= 0) return setT({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

// ── Static data ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    initials: "AM", color: "bg-[#7C5CFC]", avatarSrc: "/reviews/avatar-1.png",
    quote: "Înainte petreceam ore întregi cu manualul și tot nu înțelegeam. Cu Insight, am înțeles termodinamica în două ore.",
    name: "Andrei M.", role: "Clasa a XI-a",
  },
  {
    initials: "MT", color: "bg-[#F59E3A]", avatarSrc: "/reviews/avatar-2.png",
    quote: "Traseul personalizat m-a ajutat să mă concentrez exact pe ce nu știam. Am luat 9 la fizică.",
    name: "Maria T.", role: "Clasa a XII-a",
  },
  {
    initials: "ED", color: "bg-[#10B981]", avatarSrc: "/reviews/avatar-3.png",
    quote: "Fiul meu nu voia să audă de fizică. Acum intră singur pe platformă în fiecare seară.",
    name: "Elena D.", role: "Părinte",
  },
  {
    initials: "RC", color: "bg-[#3B82F6]", avatarSrc: "/reviews/avatar-5.png",
    quote: "Catalogul de probleme video e aur. Orice problemă dificilă am găsit-o rezolvată și explicată pas cu pas.",
    name: "Radu C.", role: "Clasa a X-a",
  },
  {
    initials: "SP", color: "bg-[#EC4899]", avatarSrc: "/reviews/avatar-6.png",
    quote: "Stilul interactiv chiar funcționează. Nu mai uit a doua zi ce-am învățat ieri.",
    name: "Sofia P.", role: "Clasa a IX-a",
  },
  {
    initials: "MB", color: "bg-[#8B5CF6]", avatarSrc: "/reviews/avatar-1.png",
    quote: "Am recomandat PLANCK tuturor colegilor mei. Raportul preț-calitate este imbatabil.",
    name: "Mihai B.", role: "Clasa a XII-a",
  },
]

const FEATURES = [
  {
    Icon: GraduationCap,
    title: "Cursuri complete",
    desc: "Toate materiile de liceu, explicate de la zero până la nivel avansat.",
    iconColor: "text-[#7C5CFC]", iconBg: "bg-[#EBE8FF]",
    longDesc:
      "Toate materiile importante de liceu, structurate pe capitole și lecții clare. Pornești de la noțiunile de bază și ajungi până la nivel avansat, în ritmul tău, cu teorie explicată pe înțelesul tuturor și exemple concrete.",
    points: [
      "Toate materiile importante de liceu",
      "De la zero până la nivel de olimpiadă",
      "Lecții scurte, ușor de parcurs",
    ],
  },
  {
    Icon: Play,
    title: "1000+ probleme video",
    desc: "Fiecare problemă rezolvată pas cu pas, de oricâte ori ai nevoie.",
    iconColor: "text-[#F59E3A]", iconBg: "bg-[#FFF5E6]",
    longDesc:
      "Un catalog uriaș de probleme rezolvate pas cu pas pe video. Vezi exact cum se gândește și se rezolvă fiecare problemă și reia orice explicație de câte ori ai nevoie, oricând.",
    points: [
      "Peste 1000 de probleme rezolvate",
      "Explicații pas cu pas pe video",
      "Reia orice rezolvare oricând",
    ],
  },
  {
    Icon: Zap,
    title: "Stil interactiv",
    desc: "Înveți ca în Duolingo — înțelegi și aplici, nu memorezi.",
    iconColor: "text-[#3B82F6]", iconBg: "bg-[#EFF6FF]",
    longDesc:
      "Înveți activ, ca într-un joc. În loc să memorezi, înțelegi și aplici imediat prin exerciții interactive care îți fixează cunoștințele și îți dau feedback instant la fiecare pas.",
    points: [
      "Învățare activă, ca în Duolingo",
      "Feedback instant la fiecare pas",
      "Reții pe termen lung",
    ],
  },
  {
    Icon: Sparkles,
    title: "Traseu personalizat",
    desc: "Insight îți construiește un plan unic, adaptat exact nevoilor tale.",
    iconColor: "text-[#10B981]", iconBg: "bg-[#ECFDF5]",
    longDesc:
      "Insight, profesorul tău AI, analizează unde te afli și îți construiește un plan unic, adaptat exact nevoilor și obiectivelor tale. Te ghidează lecție cu lecție, ca să nu pierzi timp cu ce știi deja.",
    points: [
      "Plan unic, creat de AI",
      "Adaptat nivelului și obiectivelor tale",
      "Te ghidează pas cu pas",
    ],
  },
]

// ── Sub-components ───────────────────────────────────────────────────────────

function FomoBanner({ days }: { days: number }) {
  return (
    <div className="w-full border-b border-orange-100 bg-gradient-to-r from-[#fff3e6] to-[#fff8f0]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center">
        <Flame className="h-4 w-4 flex-shrink-0 text-orange-500" />
        <p className="text-sm font-semibold text-orange-800">
          Prețul redus expiră pe{" "}
          <span className="font-bold text-orange-600">1 august</span>
          {days > 0 && (
            <> — mai sunt <span className="font-bold text-orange-600">{days} zile</span></>
          )}
        </p>
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-screen bg-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#EBE8FF] opacity-40 blur-[120px]" />
      </div>
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-16 pt-28 text-center">
        <FadeInUp>
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[#EBE8FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5B47D6]">
            <Sparkles className="h-3.5 w-3.5" />
            Ofertă specială de lansare
          </span>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Materia pe care nu ai{" "}
            <br className="hidden sm:block" />
            înțeles-o niciodată,{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
              explicată simplu.
            </span>
          </h1>
        </FadeInUp>

        <FadeInUp delay={0.18} className="mt-6">
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg sm:leading-8">
            Cursuri complete pe toate materiile, un catalog de{" "}
            <strong className="font-semibold text-gray-700">1000+ probleme rezolvate video</strong>, și un profesor AI care îți creează un{" "}
            <strong className="font-semibold text-gray-700">traseu personalizat</strong> — totul într-un singur abonament.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.26} className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98]"
          >
            Încearcă gratuit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex h-14 items-center justify-center rounded-full border border-gray-300 border-b-[3px] border-b-[#b8bcc4] bg-white px-8 text-base font-bold text-gray-900 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
          >
            Vezi planurile
          </a>
        </FadeInUp>

        <FadeInUp delay={0.34} className="mt-8 flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
          <div className="flex">
            {[0, 1, 2, 3, 4].map(i => (
              <Star key={i} className="h-4 w-4 fill-[#F59E3A] text-[#F59E3A]" />
            ))}
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">Peste 1.000 de elevi</span> învață deja pe PLANCK
          </p>
        </FadeInUp>
      </div>
    </section>
  )
}

function StatsBar() {
  return (
    <section className="bg-[#F8F7FF] py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4">
        <StaggerContainer className="grid grid-cols-3 divide-x divide-[#EBE8FF]">
          {[
            { value: "1000+", label: "Probleme rezolvate video" },
            { value: "5000+", label: "Ore de conținut" },
            { value: "100+", label: "Elevi mulțumiți" },
          ].map(s => (
            <StaggerItem key={s.label} className="px-4 text-center sm:px-8">
              <p className="text-2xl font-black text-[#7C5CFC] sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs leading-snug text-gray-500 sm:text-sm">{s.label}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function InsightSection() {
  return (
    <section className="overflow-hidden bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <FadeInRight>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBE8FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5B47D6]">
              <Sparkles className="h-3.5 w-3.5" />
              Exclusiv Plus &amp; Premium
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Insight.{" "}
              <span className="bg-gradient-to-r from-[#9a7bff] to-[#ffb56b] bg-clip-text text-transparent">
                Profesorul tău AI personal.
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
              Nu mai pierzi ore căutând ce să înveți. Insight analizează unde ești acum și îți construiește un traseu complet — ales din peste{" "}
              <strong className="font-semibold text-gray-700">1.000 de ore de conținut</strong> creat de elevi olimpici și profesori calificați.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { Icon: Sparkles, text: "Traseu 100% personalizat pentru nevoile tale" },
                { Icon: BookOpen, text: "Alege din 1000+ ore de conținut verificat" },
                { Icon: TrendingUp, text: "Se adaptează pe măsură ce avansezi" },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EBE8FF]">
                    <Icon className="h-3.5 w-3.5 text-[#7C5CFC]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 sm:text-base">{text}</span>
                </li>
              ))}
            </ul>
          </FadeInRight>

          <FadeInLeft>
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <div className="rounded-[28px] bg-gradient-to-br from-[#f3f0ff] to-[#fff8f0] p-6 shadow-[0_24px_60px_rgba(124,92,252,0.14)] ring-1 ring-[#EBE8FF]">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#c77bff]">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Insight</p>
                    <p className="text-xs text-gray-400">Traseul tău personalizat</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Mecanică", progress: 85, color: "bg-[#7C5CFC]" },
                    { label: "Termodinamică", progress: 42, color: "bg-[#F59E3A]" },
                    { label: "Electricitate", progress: 18, color: "bg-[#3B82F6]" },
                    { label: "Optică", progress: 5, color: "bg-[#10B981]" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                        <span className="text-xs text-gray-400">{item.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-white p-3.5 ring-1 ring-gray-100">
                  <p className="text-xs font-bold text-[#7C5CFC]">Insight îți recomandă:</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Începe cu{" "}
                    <strong className="text-gray-700">Termodinamica — Lecția 1</strong>. Te va ajuta să avansezi rapid la examen.
                  </p>
                </div>
              </div>
            </div>
          </FadeInLeft>
        </div>
      </div>
    </section>
  )
}

function FeatureModal({ feature, onClose }: { feature: (typeof FEATURES)[number]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={feature.title}
        className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-black/5 sm:p-8"
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Închide"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconBg}`}>
          <feature.Icon className={`h-7 w-7 ${feature.iconColor}`} />
        </div>

        <h3 className="pr-10 text-2xl font-black tracking-tight text-gray-900">{feature.title}</h3>
        <p className="mt-3 text-base leading-relaxed text-gray-600">{feature.longDesc}</p>

        <ul className="mt-6 space-y-3">
          {feature.points.map(point => (
            <li key={point} className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${feature.iconBg}`}>
                <Check className={`h-3.5 w-3.5 ${feature.iconColor}`} />
              </span>
              <span className="text-sm leading-relaxed text-gray-700 sm:text-base">{point}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/register"
          className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98]"
        >
          Vezi mai mult
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </motion.div>
    </motion.div>
  )
}

function FeaturesGrid() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeFeature = activeIndex !== null ? FEATURES[activeIndex] : null

  return (
    <section className="bg-[#F8F7FF] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Tot ce ai nevoie,{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] to-[#ffb56b] bg-clip-text text-transparent">
              într-un singur loc.
            </span>
          </h2>
          <p className="mt-3 text-base text-gray-500 sm:text-lg">
            Un abonament. Toate materiile. Fără compromisuri.
          </p>
        </FadeInUp>
        <StaggerContainer
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          staggerDelay={0.08}
        >
          {FEATURES.map((f, i) => (
            <StaggerItem key={f.title}>
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Vezi mai mult despre ${f.title}`}
                className="h-full w-full rounded-[20px] bg-white p-5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] sm:p-6"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.iconBg}`}>
                  <f.Icon className={`h-5 w-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-sm font-bold leading-tight text-gray-900 sm:text-base">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-sm">{f.desc}</p>
              </button>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      <AnimatePresence>
        {activeFeature && (
          <FeatureModal feature={activeFeature} onClose={() => setActiveIndex(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}

function TestimonialCard({ t, className = "" }: { t: (typeof TESTIMONIALS)[number]; className?: string }) {
  return (
    <div className={`flex h-full flex-col rounded-[20px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-black/5 ${className}`}>
      <div className="mb-4 flex gap-0.5">
        {[0, 1, 2, 3, 4].map(i => (
          <Star key={i} className="h-4 w-4 fill-[#F59E3A] text-[#F59E3A]" />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-gray-600 sm:text-base">
        „{t.quote}"
      </p>
      <div className="mt-5 flex items-center gap-3">
        <Image
          src={t.avatarSrc}
          alt={t.name}
          width={40}
          height={40}
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-bold text-gray-900">{t.name}</p>
          <p className="text-xs text-gray-400">{t.role}</p>
        </div>
      </div>
    </div>
  )
}

function TestimonialsSection() {
  const mobileTestimonials = TESTIMONIALS.slice(0, 5)
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Ce spun elevii despre PLANCK
          </h2>
          <p className="mt-3 text-base text-gray-500 sm:text-lg">
            Peste 1.000 de elevi și-au îmbunătățit deja notele.
          </p>
        </FadeInUp>

        {/* Mobile — scroller orizontal auto (5 testimoniale, utilizatorul nu derulează manual) */}
        <div
          className="sm:hidden motion-reduce:hidden -mx-4 w-[calc(100%+2rem)] overflow-hidden select-none [touch-action:pan-y]"
          aria-label="Ce spun elevii despre PLANCK"
        >
          <div className="flex w-max items-stretch gap-4 px-4 motion-safe:animate-stats-marquee">
            {[...mobileTestimonials, ...mobileTestimonials].map((t, index) => (
              <TestimonialCard key={`${t.name}-${index}`} t={t} className="h-[260px] w-[300px] flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Mobile — prefers-reduced-motion: listă statică (5 testimoniale) */}
        <div className="hidden motion-reduce:grid sm:motion-reduce:hidden gap-4">
          {mobileTestimonials.map(t => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>

        {/* Desktop — grid complet */}
        <StaggerContainer className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.09}>
          {TESTIMONIALS.map(t => (
            <StaggerItem key={t.name}>
              <TestimonialCard t={t} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-[0_4px_12px_rgba(124,92,252,0.15)] ring-1 ring-[#EBE8FF] sm:h-16 sm:w-16">
        <span className="text-2xl font-black tabular-nums text-[#7C5CFC] sm:text-3xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:text-xs">
        {label}
      </span>
    </div>
  )
}

function PricingSection() {
  const { days, hours, minutes, seconds } = useCountdown()

  const freeFeatures = [
    "10 lecții gratuite din cursurile platformei",
    "Catalog de probleme — fără rezolvări video",
    "Câteva întrebări pe zi pentru Insight",
  ]
  const plusFeatures = [
    "Acces complet la toate materiile de pe platformă",
    "Toate traseele de învățare — peste 5000+ ore de conținut",
    "Insight 2.5, profesorul AI al platformei",
    "Rezolvări video la toate problemele disponibile",
    "Roadmap complet până la nota dorită la BAC",
  ]
  const premiumFeatures = [
    "Tot ce include Plus",
    "Trasee personalizate cu Insight 2.5, pentru orice subiect",
    "Din septembrie — o pregătire săptămânală gratuită la orice materie",
    "Prioritate la noile funcționalități",
  ]

  return (
    <section id="pricing" className="bg-[#F8F7FF] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeInUp className="mb-4 text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Alege planul tău —{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] to-[#ffb56b] bg-clip-text text-transparent">
              înainte să se termine oferta
            </span>
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Prețul actual este special. Pe{" "}
            <strong className="text-gray-700">1 august</strong>, abonamentele se scumpesc semnificativ.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.1} className="mb-12 flex justify-center">
          <div className="inline-flex flex-col items-center rounded-2xl bg-white px-8 py-5 shadow-[0_8px_24px_rgba(124,92,252,0.1)] ring-1 ring-[#EBE8FF]">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500">
              <Clock className="h-3.5 w-3.5" />
              Oferta expiră în
            </div>
            <div className="flex items-end gap-2">
              <CountdownUnit value={days} label="zile" />
              <span className="mb-4 text-xl font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={hours} label="ore" />
              <span className="mb-4 text-xl font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={minutes} label="min" />
              <span className="mb-4 text-xl font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={seconds} label="sec" />
            </div>
          </div>
        </FadeInUp>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Free card */}
          <FadeInUp delay={0.12}>
            <div className="relative h-full rounded-[25px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-black/5 sm:p-8">
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                Începe fără card
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-gray-900">Free</h3>
              <p className="text-sm text-gray-400">Testează platforma înainte să faci upgrade</p>
              <div className="mt-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tight text-gray-900">Gratuit</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  Fără card. Poți face upgrade oricând.
                </p>
              </div>
              <ul className="mt-7 space-y-3">
                {freeFeatures.map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <Check className="h-3 w-3 text-gray-500" />
                    </div>
                    <span className="text-sm leading-snug text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-full border border-gray-300 border-b-[3px] border-b-[#b8bcc4] bg-white text-sm font-bold text-gray-900 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
              >
                Creează cont gratuit
              </Link>
            </div>
          </FadeInUp>

          {/* Plus card */}
          <FadeInUp delay={0.15}>
            <div className="relative h-full rounded-[25px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.10)] ring-1 ring-black/5 sm:p-8">
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#EBE8FF] px-3 py-1 text-xs font-bold text-[#5B47D6]">
                ⭐ Cel mai popular
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-gray-900">Plus+</h3>
              <p className="text-sm text-gray-400">Cel mai bun raport preț–rezultate</p>
              <div className="mt-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-400 line-through">49 RON/lună</span>
                  <span className="rounded-full bg-[#FFE566] px-2 py-0.5 text-xs font-bold text-[#7A6000]">
                    -41%
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tight text-gray-900">29</span>
                  <span className="text-lg font-semibold text-gray-500">RON/lună</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  sau 290 RON/an —{" "}
                  <strong className="text-gray-600">0.79 lei/zi</strong>
                </p>
              </div>
              <ul className="mt-7 space-y-3">
                {plusFeatures.map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#EBE8FF]">
                      <Check className="h-3 w-3 text-[#7C5CFC]" />
                    </div>
                    <span className="text-sm leading-snug text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
              >
                Încearcă Plus — 29 RON/lună
              </Link>
            </div>
          </FadeInUp>

          {/* Premium card */}
          <FadeInUp delay={0.22}>
            <div className="relative h-full rounded-[28px] bg-gradient-to-br from-[#7aaeff] via-[#d39bff] to-[#ffb35c] p-[2.5px] shadow-[0_18px_45px_rgba(124,58,237,0.18)]">
              <div className="h-full rounded-[26px] bg-white p-6 sm:p-8">
                <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-3 py-1 text-xs font-bold text-white">
                  ✦ Premium
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-gray-900">Premium</h3>
                <p className="text-sm text-gray-400">Pentru elevul care vrea să ajungă primul</p>
                <div className="mt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-400 line-through">99 RON/lună</span>
                    <span className="rounded-full bg-[#FFE566] px-2 py-0.5 text-xs font-bold text-[#7A6000]">
                      -40%
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight text-gray-900">59</span>
                    <span className="text-lg font-semibold text-gray-500">RON/lună</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    sau 590 RON/an —{" "}
                    <strong className="text-gray-600">1.61 lei/zi</strong>
                  </p>
                </div>
                <ul className="mt-7 space-y-3">
                  {premiumFeatures.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#ffb35c]">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm leading-snug text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
                >
                  Încearcă Premium — 59 RON/lună
                </Link>
              </div>
            </div>
          </FadeInUp>
        </div>

        <FadeInUp delay={0.3} className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            ✓ Cont gratuit în 30 de secunde &nbsp;·&nbsp; ✓ Upgrade oricând &nbsp;·&nbsp; ✓ Fără angajamente pe termen lung
          </p>
        </FadeInUp>
      </div>
    </section>
  )
}

function FinalCTASection() {
  const { days, hours, minutes, seconds } = useCountdown()

  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EBE8FF] opacity-50 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <ScaleIn>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Nu lăsa nota la liceu{" "}
            <br className="hidden sm:block" />
            pe seama{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
              șansei.
            </span>
          </h2>
        </ScaleIn>

        <FadeInUp delay={0.15} className="mt-4">
          <p className="text-base text-gray-500 sm:text-lg">Oferta de lansare expiră în:</p>
        </FadeInUp>

        <FadeInUp delay={0.2} className="mt-8 flex justify-center">
          <div className="flex items-end gap-2.5 sm:gap-4">
            <CountdownUnit value={days} label="zile" />
            <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
            <CountdownUnit value={hours} label="ore" />
            <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
            <CountdownUnit value={minutes} label="min" />
            <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
            <CountdownUnit value={seconds} label="sec" />
          </div>
        </FadeInUp>

        <FadeInUp delay={0.28} className="mt-10">
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[#7C5CFC] px-10 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
          >
            Începe acum — gratuit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="mt-3 text-sm text-gray-400">
            Creezi cont gratuit în 30 de secunde. Upgrade oricând.
          </p>
        </FadeInUp>
      </div>
    </section>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────
export function LandingPageContent() {
  const { days } = useCountdown()

  return (
    <div className="relative min-h-screen bg-white">
      <FomoBanner days={days} />
      <div className="relative">
        <HomePageNavbar variant="light" />
        <HeroSection />
      </div>
      <StatsBar />
      <InsightSection />
      <FeaturesGrid />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <Footer
        theme="light"
        backgroundColor="bg-[#F8F7FF]"
        borderColor="border-gray-200"
      />
    </div>
  )
}
