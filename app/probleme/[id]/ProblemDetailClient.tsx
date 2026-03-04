"use client"

import { useMemo, useState, lazy, Suspense, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, List, CheckCircle2, X, Lock, Play } from "lucide-react"
import type { Problem } from "@/data/problems"
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import React from 'react';
import { useAuth } from "@/components/auth-provider"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { useIsMobile } from "@/hooks/use-mobile"
import { supabase } from "@/lib/supabaseClient"
import confetti from 'canvas-confetti'
import { Skeleton } from "@/components/ui/skeleton"
import { BadgeNotification } from "@/components/badge-notification"
import ProblemOrbButton from "@/components/problem-orb-button"

// Lazy load heavy sidebar components for faster initial render
const ProblemsSidebar = lazy(() => import("@/components/problems-sidebar").then(m => ({ default: m.ProblemsSidebar })))
const InsightChatSidebar = lazy(() => import("@/components/insight-chat-sidebar"))
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { PlanckPlusTrialModal } from "@/components/planck-plus-trial-modal"
import { ProblemAnswerCard } from "@/components/problems/problem-answer-card"
import { ProblemAnswerBottomSheet } from "@/components/problems/problem-answer-bottom-sheet"
import { RecommendedProblemCard } from "@/components/problems/recommended-problem-card"

// Lazy load video player component
const VideoPlayer = lazy(() => import("@/components/video-player").then(module => ({ default: module.VideoPlayer })))

// Array cu 10 iconițe variate pentru probleme (același sistem ca în problem-card)
const problemIcons = [
  "🔬", // microscop
  "⚗️", // eprubetă
  "🧮", // calculator
  "📊", // grafic
  "🔋", // baterie
  "💡", // bec
  "🎯", // țintă
  "⚙️", // roți dințate
  "🔍", // lupă
  "📐", // riglă
]

// Funcție pentru a obține o iconiță bazată pe ID-ul problemei
const getProblemIcon = (problemId: string): string => {
  let hash = 0;
  for (let i = 0; i < problemId.length; i++) {
    const char = problemId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % problemIcons.length;
  return problemIcons[index];
}

// Array cu textele de felicitare
const congratulationMessages = [
  "Felicitări! Ai rezolvat problema 🎉",
  "Bravo! Pas cu pas devii mai bun 🚀",
  "Super! Ai mai urcat un nivel 🔬",
  "Excelent! 💡",
  "Felicitări! Ai câștigat +1 XP"
]

const difficultyAccentClasses: Record<string, string> = {
  "Ușor": "border-emerald-600/30 bg-emerald-50 text-emerald-800",
  "Mediu": "border-amber-600/30 bg-amber-50 text-amber-800",
  "Avansat": "border-rose-600/30 bg-rose-50 text-rose-800",
}

// Loading skeleton for video content
function VideoSkeleton() {
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="w-14 h-14 rounded-full mx-auto bg-white/20" />
        <Skeleton className="w-24 h-4 rounded mx-auto bg-white/10" />
      </div>
    </div>
  )
}

function MissingVideoCard() {
  return (
    <div className="aspect-video w-full rounded-xl border border-dashed border-white/15 bg-white/5 flex flex-col items-center justify-center text-center px-6">
      <div className="text-5xl mb-4">🛠️</div>
      <p className="text-2xl font-semibold text-white">Ups, ne-ai prins de data asta..</p>
      <p className="mt-3 text-sm sm:text-base text-white/70 max-w-md">
        Lucrăm la rezolvarea video pentru această problemă. Revino curând sau explorează soluția în enunțul detaliat.
      </p>
    </div>
  )
}

function NoAnswerCard() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-6 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)] text-center">
      <div className="text-4xl">🛠️</div>
      <h2 className="text-lg font-semibold text-[#0b0d10]">Ups, ne-ai prins de data asta!</h2>
      <p className="text-sm text-[#2C2F33]/70">
        Încă lucrăm la rezolvarea acestei probleme. Revino curând sau explorează alte probleme din catalog.
      </p>
    </div>
  )
}

function LockedVideoCard({ onUpgradeClick }: { onUpgradeClick: () => void }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <img
        src="/video-locked-placeholder.jpg"
        alt="Rezolvare video blocată"
        className="h-full w-full object-cover blur-md scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/20" />

      {/* Mobile: only lock icon + CTA (more space) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center sm:hidden">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-sm">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <Link
          href="/pricing"
          className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-white/90"
          aria-label="Încearcă Planck Plus+ gratuit 7 zile"
        >
          Încearcă Plus+ (7 zile gratuit)
        </Link>
      </div>

      {/* Desktop: keep full copy + secondary CTA */}
      <div className="absolute inset-0 hidden sm:flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-sm">
          <Lock className="h-6 w-6 text-white" />
        </div>
        <p className="text-xl sm:text-2xl font-semibold text-white">
          Ai nevoie de Planck Plus+ pentru rezolvarea video
        </p>
        <p className="mt-2 text-sm sm:text-base text-white/70 max-w-md">
          Deblochează videoclipul pentru această problemă și toate rezolvările video.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link
            href="/pricing"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-white/90"
          >
            Încearcă Plus+ (7 zile gratuit)
          </Link>
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
            onClick={onUpgradeClick}
          >
            Vezi detalii
          </Button>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton for problem image
function ImageSkeleton() {
  return (
    <div className="mt-6 flex justify-center">
      <Skeleton className="w-full max-w-2xl h-80 rounded-xl bg-[#dfdcd8]" />
    </div>
  )
}

type DifficultyColors = Record<string, string>

export default function ProblemDetailClient({ problem, categoryIcons, difficultyColors }: {
  problem: Problem,
  categoryIcons: any,
  difficultyColors: DifficultyColors
}) {
  const [isSolved, setIsSolved] = useState(false)
  const [loadingSolved, setLoadingSolved] = useState(true)
  const [congratulationMessage, setCongratulationMessage] = useState<string | null>(null)
  const [newBadge, setNewBadge] = useState<any>(null)
  const [showBadgeNotification, setShowBadgeNotification] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [insightSidebarOpen, setInsightSidebarOpen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const { user } = useAuth();
  const { isFree } = useSubscriptionPlan()
  const isMobile = useIsMobile()
  const problemIcon = getProblemIcon(problem.id);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)

  const [showMobileUpgradeModal, setShowMobileUpgradeModal] = useState(false)
  const [openedInsightFromCard, setOpenedInsightFromCard] = useState(false)
  const [canMarkSolvedByAnswer, setCanMarkSolvedByAnswer] = useState(false)
  const [initialHintMessage, setInitialHintMessage] = useState<string | null>(null)
  const [showCongratulationCloseButton, setShowCongratulationCloseButton] = useState(false)

  const hasVideo = useMemo(() => {
    return typeof problem.youtube_url === 'string' && problem.youtube_url.trim() !== ''
  }, [problem.youtube_url])
  const hasAnswerCard = problem.answer_type === "value" || problem.answer_type === "grila"

  const isVideoLockedForUser = hasVideo && isFree

  React.useEffect(() => {
    setCanMarkSolvedByAnswer(false)
  }, [problem.id, problem.answer_type])

  useEffect(() => {
    if (!congratulationMessage) {
      setShowCongratulationCloseButton(false)
      return
    }

    const closeButtonTimer = window.setTimeout(() => {
      setShowCongratulationCloseButton(true)
    }, 2000)

    const autoDismissTimer = window.setTimeout(() => {
      setCongratulationMessage(null)
    }, 7000)

    return () => {
      window.clearTimeout(closeButtonTimer)
      window.clearTimeout(autoDismissTimer)
    }
  }, [congratulationMessage])

  const renderInlineMath = (value?: string | null) => {
    if (!value) return null
    if (!value.includes('$')) return value
    return value.split(/(\$[^$]+\$)/g).map((part, idx) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={idx} math={part.slice(1, -1)} />
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>
    })
  }

  const difficultyTone = difficultyAccentClasses[problem.difficulty] || "border-[#0b0d10]/15 bg-white text-[#2C2F33]"
  const classLabel = problem.classString
    ? problem.classString
    : typeof problem.class === 'number'
      ? `Clasa a ${problem.class}-a`
      : null

  // Add custom scrollbar class to body
  React.useEffect(() => {
    document.body.classList.add('problem-page-scrollbar')
    return () => {
      document.body.classList.remove('problem-page-scrollbar')
    }
  }, [])

  React.useEffect(() => {
    const checkSolved = async () => {
      if (!user) return setLoadingSolved(false);
      const { data } = await supabase
        .from('solved_problems')
        .select('id')
        .eq('user_id', user.id)
        .eq('problem_id', problem.id)
        .maybeSingle();
      setIsSolved(!!data);
      setLoadingSolved(false);
    };
    checkSolved();
  }, [user, problem.id]);

  const handleMarkSolved = async () => {
    if (!user) return;
    if (isSolved) return; // Prevent duplicate submissions
    setLoadingSolved(true);

    // Marchează problema ca rezolvată
    // ELO-ul se acordă automat prin trigger on_problem_solved
    const { error } = await supabase.from('solved_problems').insert({
      user_id: user.id,
      problem_id: problem.id,
      solved_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error marking problem as solved:', error);
      setLoadingSolved(false);
      return;
    }

    // Verifică dacă utilizatorul a câștigat un badge nou (în ultimele 5 secunde)
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    const { data: newBadges } = await supabase
      .from('user_badges')
      .select(`
        id,
        earned_at,
        badge:badges (
          id,
          name,
          description,
          icon,
          color
        )
      `)
      .eq('user_id', user.id)
      .gte('earned_at', fiveSecondsAgo)
      .order('earned_at', { ascending: false })
      .limit(1);

    if (newBadges && newBadges.length > 0) {
      setNewBadge(newBadges[0]);
      setShowBadgeNotification(true);
    }

    setIsSolved(true);
    setLoadingSolved(false);

    // Afișează mesajul de felicitare
    const randomMessage = congratulationMessages[Math.floor(Math.random() * congratulationMessages.length)];
    setCongratulationMessage(randomMessage);

    // Confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 1000,
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f5f4] text-[#2C2F33] flex flex-col">
      <Navigation />

      {/* Upgrade Banner for Free Users */}
      {showUpgradeBanner && (
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-2 duration-300">
          <Link
            href="/pricing"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/90 to-amber-500/90 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-medium rounded-full shadow-lg transition-all hover:scale-105"
          >
            <span>Upgrade to Plus</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </Link>
        </div>
      )}

      <div className="flex-1">
        <div className={cn("px-4 sm:px-6 lg:px-12 pt-20 lg:pt-20 pb-16", isMobile && "pb-28")}>
          <div className="mx-auto max-w-[1600px] space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setSidebarOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2 rounded-full border-[#0b0d10]/15 bg-white/80 px-4 py-2 text-sm font-medium text-[#0b0d10] transition hover:bg-white"
                >
                  <List className="w-4 h-4" />
                  <span>Toate problemele</span>
                </Button>
                <Link
                  href="/probleme"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#2C2F33]/70 transition hover:text-[#0b0d10]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Înapoi la catalog</span>
                </Link>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-sm text-[#2C2F33]/75">
                {classLabel && (
                  <span className="inline-flex items-center rounded-full border border-[#0b0d10]/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#2C2F33]/80">
                    {classLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-[#0b0d10]/10 bg-white px-3 py-1">
                  <span className="text-lg leading-none">{problemIcon}</span>
                  <span>ID {problem.id}</span>
                </span>
                {isSolved && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    Rezolvată
                  </span>
                )}
              </div>
            </div>

            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] 2xl:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              <section className="space-y-8">
                <div className="flex flex-col gap-6">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-[#0b0d10]">
                    {renderInlineMath(problem.title)}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#2C2F33]/75 sm:hidden">
                    {classLabel && (
                      <span className="inline-flex items-center rounded-full border border-[#0b0d10]/10 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2C2F33]/80">
                        {classLabel}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#0b0d10]/10 bg-white px-3 py-1">
                      <span className="text-base leading-none">{problemIcon}</span>
                      <span>ID {problem.id}</span>
                    </span>
                  </div>

                  {problem.tags && Array.isArray(problem.tags) && problem.tags.length > 0 && (
                    <div className="hidden sm:flex flex-wrap gap-2">
                      {problem.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-full border border-[#0b0d10]/15 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#2C2F33]/75"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-[#0b0d10]/10 bg-white/95 p-6 shadow-[0_12px_30px_-24px_rgba(11,13,16,0.45)]">
                      <div className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-[#2C2F33]">
                        {renderInlineMath(problem.statement)}
                      </div>
                    </div>
                    {problem.image_url && (
                      <div className="flex justify-center">
                        {!imageLoaded && <ImageSkeleton />}
                        <img
                          src={problem.image_url.replace(/^@/, '')}
                          alt="Ilustrație problemă"
                          className={cn(
                            "w-full h-auto max-w-full rounded-xl border border-[#0b0d10]/10 bg-white object-contain shadow-sm",
                            !imageLoaded && 'hidden'
                          )}
                          onLoad={() => setImageLoaded(true)}
                          onError={(e) => {
                            console.error('Image failed to load:', problem.image_url, e)
                            setImageLoaded(true)
                          }}
                        />
                      </div>
                    )}
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => hasVideo && setIsVideoModalOpen(true)}
                        disabled={!hasVideo}
                        className="rounded-full border-[#0b0d10]/20 bg-white/70 px-5 py-2.5 text-sm font-medium text-[#2C2F33] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {hasVideo ? "Rezolvare video" : "Video în curând"}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]", difficultyTone)}>
                    {problem.difficulty}
                  </Badge>
                  <Badge className="flex items-center gap-2 border border-[#0b0d10]/15 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#2C2F33]">
                    <span className="text-base leading-none">{categoryIcons?.[problem.category] ?? '📘'}</span>
                    {problem.category}
                  </Badge>
                  {hasVideo && (
                    <Badge className="border border-red-600/30 bg-red-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-800">
                      🎥 Video
                    </Badge>
                  )}
                </div>
              </section>

              <aside className="hidden lg:block space-y-6">
                {hasAnswerCard ? (
                  <div className="mx-auto max-w-md">
                    <ProblemAnswerCard
                      problem={problem}
                      onCanMarkSolvedChange={setCanMarkSolvedByAnswer}
                      onSolvedCorrectly={handleMarkSolved}
                      isSolved={isSolved}
                    />
                  </div>
                ) : (
                  <div className="mx-auto max-w-md">
                    <NoAnswerCard />
                  </div>
                )}
                <div className="mx-auto max-w-md">
                  <RecommendedProblemCard currentProblem={problem} />
                </div>
              </aside>

              {/* Pe mobil: card problema recomandată sub datele problemei, înainte de footer */}
              <div className="lg:hidden w-full">
                <RecommendedProblemCard currentProblem={problem} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer
        theme="light"
        backgroundColor="bg-[#f6f5f4]"
        borderColor="border-[#0b0d10]/10"
      />

      <Suspense fallback={null}>
        <ProblemsSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentProblemId={problem.id}
        />
      </Suspense>

      {congratulationMessage && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#0b0d10]/10 bg-white p-8 text-center shadow-2xl">
            <div className="mb-4 text-6xl">🎉</div>
            <h3 className="mb-3 text-2xl font-bold text-[#0b0d10]">Felicitări!</h3>
            <p className="mb-6 text-[#2C2F33]/70">{congratulationMessage}</p>
            <div
              className={cn(
                "transition-opacity duration-500",
                showCongratulationCloseButton ? "opacity-100" : "pointer-events-none opacity-0"
              )}
            >
              <Button
                onClick={() => setCongratulationMessage(null)}
                className="rounded-full bg-[#2a2a2a] px-6 py-3 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] hover:bg-[#2a2a2a]"
              >
                Continuă
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBadgeNotification && newBadge && (
        <BadgeNotification
          badge={newBadge.badge}
          onClose={() => {
            setShowBadgeNotification(false)
            setNewBadge(null)
          }}
        />
      )}

      {isMobile && (
        <ProblemAnswerBottomSheet
          problem={problem}
          hasAnswerCard={hasAnswerCard}
          isSolved={isSolved}
          onCanMarkSolvedChange={setCanMarkSolvedByAnswer}
          onSolvedCorrectly={handleMarkSolved}
          onOpenHint={() => {
            setOpenedInsightFromCard(true)
            setInsightSidebarOpen(true)
            setInitialHintMessage("Am nevoie de un hint")
          }}
        />
      )}

      {!isMobile && (
        <ProblemOrbButton
          onOpenSidebar={() => {
            setOpenedInsightFromCard(false)
            setInsightSidebarOpen(true)
          }}
        />
      )}

      <Suspense fallback={null}>
        <InsightChatSidebar
          isOpen={insightSidebarOpen}
          onClose={() => {
            setInsightSidebarOpen(false)
            setOpenedInsightFromCard(false)
            setInitialHintMessage(null)
          }}
          problemId={problem.id}
          problemStatement={problem.statement || ''}
          persona="problem_tutor"
          onFreePlanMessage={() => setShowUpgradeBanner(true)}
          onMobileUpgradePrompt={() => setShowMobileUpgradeModal(true)}
          initialUserMessage={initialHintMessage}
          initialUserMessageDisplay={initialHintMessage}
          onInitialMessageSent={() => setInitialHintMessage(null)}
        />
      </Suspense>

      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent hideClose className="max-w-4xl border border-white/10 bg-[#141414] text-white top-[calc(50%+32px)] sm:top-[calc(50%+36px)] md:top-[calc(50%+40px)]">
          <DialogTitle className="sr-only">Rezolvare video</DialogTitle>
          <DialogDescription className="sr-only">
            Modal cu rezolvarea video pentru problema curentă.
          </DialogDescription>
          <div className="flex items-center justify-between pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Video</p>
              <p className="text-sm text-white/70">Rezolvare pentru această problemă</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVideoModalOpen(false)}
              className="rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/40 p-3 sm:p-6">
            {hasVideo ? (
              isVideoLockedForUser ? (
                <LockedVideoCard onUpgradeClick={() => setShowMobileUpgradeModal(true)} />
              ) : (
                <Suspense fallback={<VideoSkeleton />}>
                  <VideoPlayer videoUrl={problem.youtube_url!} title="Rezolvare video" />
                </Suspense>
              )
            ) : (
              <MissingVideoCard />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal for Mobile */}
      {showMobileUpgradeModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <PlanckPlusTrialModal
            title="Rezolvarea video este disponibilă cu Planck Plus+. Încearcă 7 zile GRATUIT"
            onClose={() => setShowMobileUpgradeModal(false)}
          />
        </div>
      )}
    </div>
  )
} 