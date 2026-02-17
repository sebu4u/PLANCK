"use client"

import Link from "next/link"
import Image from "next/image"
import { Rocket, ArrowLeft, Users, CheckCircle, Play, Clock, Sparkles, Code, Cpu, PenTool, BrainCircuit, User } from "lucide-react"
import { platformStats, teamMembers } from "@/lib/despre-constants"
import { useRef, useState, useEffect } from "react"
import { DespreHeroSection } from "@/components/despre/despre-hero-section"

/* ──────────────────────────────────────────────
   Section IDs for scroll indicator
   ────────────────────────────────────────────── */
const DESPRE_SECTION_IDS = ["hero-section", "despre-stats", "despre-premiu", "despre-misiune", "despre-echipa", "despre-cta"]

/* ──────────────────────────────────────────────
   Section indicator (right-side lines)
   ────────────────────────────────────────────── */
function DespreSectionIndicator() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const elements = DESPRE_SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = entry.target.id
          const index = DESPRE_SECTION_IDS.indexOf(id)
          if (index !== -1) setActiveIndex(index)
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3 py-4 items-end"
      aria-label="Secțiuni pagină"
    >
      {DESPRE_SECTION_IDS.map((_, index) => (
        <div
          key={index}
          className={`h-0.5 rounded-full transition-all duration-300 ml-auto ${
            index === activeIndex ? "w-8 bg-white" : "w-2 bg-white/30"
          }`}
        />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Icon resolver for stat cards
   ────────────────────────────────────────────── */
const statIcons: Record<string, React.ReactNode> = {
  users: <Users className="w-6 h-6" />,
  check: <CheckCircle className="w-6 h-6" />,
  play: <Play className="w-6 h-6" />,
  clock: <Clock className="w-6 h-6" />,
}

/* ──────────────────────────────────────────────
   Main client component
   ────────────────────────────────────────────── */
export function DesprePageClient() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-purple-500/30">
      {/* ── Navbar minimal ── */}
      <DespreNavbar />

      {/* ── Section indicator (right) ── */}
      <DespreSectionIndicator />

      <main>
        {/* ── Hero ── */}
        <DespreHeroSection />

        {/* ── Statistici ── */}
        <StatsSection />

        {/* ── Premiu ── */}
        <AwardSection />

        {/* ── Misiunea noastră ── */}
        <MissionSection />

        {/* ── Echipa PLANCK ── */}
        <TeamSection />

        {/* ── CTA final ── */}
        <CTASection />
      </main>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Navbar — visible only at top of page
   ────────────────────────────────────────────── */
const TOP_THRESHOLD_PX = 80

function DespreNavbar() {
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    const check = () => setIsAtTop(typeof window !== "undefined" ? window.scrollY < TOP_THRESHOLD_PX : true)
    check()
    window.addEventListener("scroll", check, { passive: true })
    return () => window.removeEventListener("scroll", check)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 bg-transparent transition-all duration-300 ${
        isAtTop ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16 pointer-events-none [&_a]:pointer-events-auto">
        {/* Logo — drop shadow for visibility without background */}
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-bold text-xl hover:text-purple-400 transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]"
        >
          <Rocket className="w-5 h-5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" />
          <span>PLANCK</span>
        </Link>

        {/* Back button — drop shadow for visibility without background */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-purple-400 transition-colors rounded-full border border-white/20 hover:border-purple-500/40 px-4 py-2 bg-black/20 backdrop-blur-sm shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Înapoi acasă
        </Link>
      </div>
    </nav>
  )
}

/* ──────────────────────────────────────────────
   Statistics
   ────────────────────────────────────────────── */
function StatsSection() {
  return (
    <section id="despre-stats" className="relative py-20 px-4" aria-label="Statistici platformă">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {platformStats.map((stat) => (
            <div
              key={stat.label}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-center transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.06]"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:bg-purple-500/20 transition-colors">
                  {statIcons[stat.icon]}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/50 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   Award / Premiu
   ────────────────────────────────────────────── */
const AWARD_IMAGES = [
  "/premiu/premiu-1.jpg",
  "/premiu/premiu-2.jpg",
  "/premiu/premiu-3.jpg",
]

function AwardSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const imageCount = AWARD_IMAGES.length
  const transitionDurationMs = 320

  const startSlideTransition = (nextIndex: number) => {
    if (nextIndex === currentSlide || isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(nextIndex)
      requestAnimationFrame(() => setIsTransitioning(false))
    }, transitionDurationMs)
  }

  // Auto-advance every 5 seconds with smooth transition
  useEffect(() => {
    const interval = setInterval(() => {
      startSlideTransition((currentSlide + 1) % imageCount)
    }, 5000)
    return () => clearInterval(interval)
  }, [currentSlide, imageCount, isTransitioning])

  const getVisibleSlides = (centerIndex: number) => {
    const prev = (centerIndex - 1 + imageCount) % imageCount
    const next = (centerIndex + 1) % imageCount
    return [prev, centerIndex, next]
  }

  const renderSlideStrip = (centerIndex: number) => {
    const visibleSlides = getVisibleSlides(centerIndex)

    return (
      <div className="absolute inset-0 flex items-center justify-center gap-3 sm:gap-4">
        {visibleSlides.map((slideIndex, position) => {
          const isCenter = position === 1
          const src = AWARD_IMAGES[slideIndex]
          return (
            <div
              key={`${centerIndex}-${slideIndex}-${position}`}
              className={`relative flex-shrink-0 h-full rounded-2xl overflow-hidden border transition-all duration-500 bg-black/20 ${
                isCenter
                  ? "w-[72vw] sm:w-[58vw] md:w-[48vw] lg:w-[42vw] max-w-[680px] border-purple-500/40 opacity-100 scale-100"
                  : "w-[18vw] sm:w-[16vw] md:w-[15vw] lg:w-[14vw] max-w-[220px] border-white/10 opacity-45 scale-95"
              }`}
            >
              <Image
                src={src}
                alt={`PLANCK la Start Your StartUp 2025 - foto ${slideIndex + 1}`}
                fill
                className="object-contain"
                sizes={isCenter ? "(max-width: 640px) 72vw, (max-width: 768px) 58vw, 42vw" : "220px"}
              />
            </div>
          )
        })}
      </div>
    )
  }

  const activeDot = currentSlide

  return (
    <section id="despre-premiu" className="relative py-24 px-4 overflow-hidden" aria-labelledby="premiu-heading">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Premiul I
          </div>
          <h2 id="premiu-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Start Your StartUp 2025
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-violet-400 rounded-full mx-auto mb-8" />
          <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            PLANCK a câștigat <span className="text-white font-medium">Premiul I</span> la concursul național
            Start Your StartUp 2025, organizat de Universitatea Politehnica din București — cea mai importantă
            competiție de antreprenoriat pentru liceeni din România.
          </p>
        </div>

        {/* Photo carousel */}
        <div className="relative">
          {/* Left/right fades */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#0a0a0c] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#0a0a0c] to-transparent z-10 pointer-events-none" />

          {/* Cyclic visual carousel: prev | current | next */}
          <div className="relative h-[min(70vw,420px)] sm:h-[min(60vw,480px)] overflow-hidden">
            <div
              className={`absolute inset-0 transition-all ${
                isTransitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
              }`}
              style={{ transitionDuration: `${transitionDurationMs}ms` }}
            >
              {renderSlideStrip(currentSlide)}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {AWARD_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => startSlideTransition(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeDot ? "w-6 bg-purple-400" : "w-1.5 bg-white/30"
                }`}
                aria-label={`Foto ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   Mission
   ────────────────────────────────────────────── */
function MissionSection() {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Cursuri de Fizică",
      description: "Lecții video HD, de la mecanică la fizică cuantică. Pregătire completă pentru Bacalaureat, admitere la medicină și politehnică, și olimpiade de fizică.",
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Informatică & PlanckCode",
      description: "PlanckCode este un IDE online C++ cu compilator integrat, Online Judge și asistent AI. Scrii, compilezi și testezi cod direct în browser, pregătindu-te pentru concursuri de informatică.",
    },
    {
      icon: <BrainCircuit className="w-6 h-6" />,
      title: "Insight AI & Raptor1",
      description: "Insight este asistentul AI al platformei, alimentat de modelele Raptor1. Explică concepte, ghidează rezolvarea problemelor pas cu pas și oferă tutorat personalizat la fizică și informatică.",
    },
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Planck Sketch",
      description: "Whiteboard colaborativ online, gratuit și fără cont. Desen liber, grafice matematice și explicații vizuale — perfect pentru studiu individual sau colaborare la distanță.",
    },
  ]

  return (
    <section id="despre-misiune" className="relative py-24 px-4 overflow-hidden" aria-labelledby="misiune-heading">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 id="misiune-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Misiunea noastră
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-violet-400 rounded-full mx-auto mb-8" />
          <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            Planck Academy este o platformă educațională de fizică și informatică pentru liceu, creată de elevi olimpici.
            Misiunea noastră este să transformăm modul în care elevii învață științele exacte — făcând educația de calitate
            accesibilă, interactivă și bazată pe inteligență artificială.
          </p>
        </div>

        {/* Mission text block */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10 mb-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/[0.03] to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-6 text-white/70 text-base sm:text-lg leading-relaxed">
            <p>
              <strong className="text-white">PLANCK</strong> a fost creată cu convingerea că fizica și informatica nu trebuie să fie materii temute, ci
              <span className="text-purple-400 font-medium"> aventuri intelectuale</span> care deschid uși către înțelegerea universului și a tehnologiei.
              Oferim cursuri video structurate pe capitole, probleme explicate pas cu pas, simulări BAC și grile interactive.
            </p>
            <p>
              Platforma integrează instrumente avansate de inteligență artificială: <strong className="text-white">Insight</strong>, asistentul nostru AI alimentat de
              modelele <strong className="text-white">Raptor1</strong> (fast, standard și heavy), oferă tutorat personalizat — explicând concepte, ghidând rezolvarea
              problemelor și provocând elevii să gândească mai profund.
            </p>
            <p>
              Cu <strong className="text-white">PlanckCode</strong>, elevii au acces la un IDE online C++ complet, cu compilator în browser, feedback instant și
              Online Judge pentru concursuri de informatică. <strong className="text-white">Planck Sketch</strong> completează ecosistemul cu un whiteboard colaborativ
              online — ideal pentru desen, grafice matematice și explicații vizuale, accesibil gratuit, fără cont.
            </p>
            <p>
              Echipa PLANCK este formată din <span className="text-purple-400 font-medium">elevi olimpici și pasionați de educație</span> care înțeleg provocările
              cu care se confruntă liceenii. Credem în educație bazată pe înțelegere profundă, nu pe memorare, și construim
              instrumentele care fac acest lucru posibil.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.06]"
            >
              <div className="absolute inset-0 rounded-2xl bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:bg-purple-500/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   Team (horizontal scroll)
   ────────────────────────────────────────────── */
function TeamSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const amount = 320
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" })
  }

  return (
    <section id="despre-echipa" className="relative py-24 px-4 overflow-hidden" aria-labelledby="echipa-heading">
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 id="echipa-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Echipa PLANCK
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-violet-400 rounded-full mx-auto mb-8" />
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Suntem o echipă tânără de elevi olimpici și voluntari pasionați de educație și tehnologie
          </p>
        </div>

        {/* Scroll arrows */}
        <div className="relative">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-purple-400 hover:border-purple-500/30 flex items-center justify-center transition-all -ml-2 sm:ml-0"
              aria-label="Scroll stânga"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-purple-400 hover:border-purple-500/30 flex items-center justify-center transition-all -mr-2 sm:mr-0"
              aria-label="Scroll dreapta"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          )}

          {/* Left/right fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0c] to-transparent z-10 pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0c] to-transparent z-10 pointer-events-none" />
          )}

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth px-1"
          >
            {teamMembers.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TeamCard({ member }: { member: typeof teamMembers[number] }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="group relative flex-shrink-0 w-[280px] sm:w-[300px] snap-start rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.06]">
      <div className="absolute inset-0 rounded-2xl bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-full border-2 border-purple-500/30 overflow-hidden bg-white/5 flex items-center justify-center">
            {imgError ? (
              <User className="w-10 h-10 text-white/30" />
            ) : (
              <Image
                src={member.image}
                alt={member.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            )}
          </div>
          {/* Badge dot */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-violet-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
        <p className="text-purple-400 text-sm font-medium mb-1">{member.role}</p>
        <p className="text-white/40 text-xs mb-4">{member.badge}</p>
        <p className="text-white/60 text-sm leading-relaxed">{member.description}</p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   CTA
   ────────────────────────────────────────────── */
function CTASection() {
  return (
    <section id="despre-cta" className="relative py-24 px-4 overflow-hidden" aria-label="Call to action">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Gata să gândești mai profund?
        </h2>
        <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
          Alătură-te comunității PLANCK și descoperă o nouă modalitate de a învăța fizica și informatica.
          Cursuri, probleme, AI și instrumente — totul într-un singur loc.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white font-semibold text-base hover:from-purple-600 hover:to-violet-600 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/20"
          >
            <Rocket className="w-5 h-5" />
            Începe gratuit
          </Link>
          <Link
            href="/cursuri"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/15 text-white/80 font-semibold text-base hover:bg-white/5 hover:border-purple-500/30 hover:text-white transition-all duration-300"
          >
            Explorează cursurile
          </Link>
        </div>
      </div>
    </section>
  )
}
