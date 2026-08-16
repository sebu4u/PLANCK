"use client"

import { useMemo, useState, lazy, Suspense, useEffect, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, List, CheckCircle2, ChevronRight, Loader2, Camera } from "lucide-react"
import type { Problem } from "@/data/problems"
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import React from 'react';
import { useAuth } from "@/components/auth-provider"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { supabase } from "@/lib/supabaseClient"
import confetti from 'canvas-confetti'
import { Skeleton } from "@/components/ui/skeleton"
import { BadgeNotification } from "@/components/badge-notification"
import ProblemOrbButton from "@/components/problem-orb-button"

// Lazy load heavy sidebar components for faster initial render
const ProblemsSidebar = lazy(() => import("@/components/problems-sidebar").then(m => ({ default: m.ProblemsSidebar })))
const InsightChatSidebar = lazy(() => import("@/components/insight-chat-sidebar"))
import { cn } from "@/lib/utils"
import { PlanckPlusTrialModal } from "@/components/planck-plus-trial-modal"
import { ProblemAnswerCard } from "@/components/problems/problem-answer-card"
import {
  ProblemWrongAnswerEloCard,
  type ProblemWrongAnswerPenalty,
} from "@/components/problems/problem-wrong-answer-elo-card"
import { RecommendedProblemCard } from "@/components/problems/recommended-problem-card"
import {
  ensurePhysicsCatalogProblemsCached,
  getFreshPhysicsCatalogProblems,
  getPhysicsCatalogSkipGridSkeletonSessionKey,
} from "@/lib/physics-catalog-problems-cache"
import {
  getProblemDetailSubjectConfig,
  type ProblemDetailSubject,
} from "@/lib/problem-detail-subject"
import { useSocialProofTrigger } from "@/hooks/engagement/use-social-proof-trigger"
import { ProblemsPwaInstallBanner } from "@/components/problems-pwa-install-banner"
import { extractYouTubeVideoId, LazyYouTubePlayer } from "@/components/lazy-youtube-player"
import { ReportIssueButton } from "@/components/content-reports/report-issue-button"

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
  "Ușor":
    "border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-600/30",
  "Mediu":
    "border-amber-600/30 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-600/30",
  "Avansat":
    "border-rose-600/30 bg-rose-50 text-rose-800 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-600/30",
}

const CATALOG_RETURN_HREF_STORAGE_KEY = "catalog:catalogReturnHref"

function getStoredCatalogBackHref(catalogHrefPrefix: string, fallbackHref: string) {
  try {
    const href = sessionStorage.getItem(CATALOG_RETURN_HREF_STORAGE_KEY)
    if (href?.startsWith(catalogHrefPrefix)) {
      return href
    }
  } catch {
    // ignore
  }
  return fallbackHref
}

function normalizeProblemTags(tags: Problem["tags"] | string[] | null | undefined): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter(Boolean)
  }

  if (typeof tags === "string" && tags.trim()) {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
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

// Loading skeleton for problem image
function ImageSkeleton() {
  return (
    <div className="mt-6 flex justify-center">
      <Skeleton className="w-full max-w-2xl h-80 rounded-xl bg-[#dfdcd8]" />
    </div>
  )
}

type DifficultyColors = Record<string, string>

export default function ProblemDetailClient({
  problem,
  categoryIcons,
  difficultyColors,
  embedVariant,
  classroomCatalogHref,
  subject = "physics",
}: {
  problem: Problem
  categoryIcons: any
  difficultyColors: DifficultyColors
  /** When set, hides Navigation/Footer and uses layout suited for embedding under classroom shell. */
  embedVariant?: "classroomAssignment"
  /** Link for "Înapoi la catalog" in classroom assignment flow. */
  classroomCatalogHref?: string
  subject?: ProblemDetailSubject
}) {
  const subjectConfig = getProblemDetailSubjectConfig(subject)
  const isClassroomEmbed = embedVariant === "classroomAssignment"
  const [isSolved, setIsSolved] = useState(false)
  const [loadingSolved, setLoadingSolved] = useState(true)
  const [congratulationMessage, setCongratulationMessage] = useState<string | null>(null)
  const [newBadge, setNewBadge] = useState<any>(null)
  const [showBadgeNotification, setShowBadgeNotification] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [insightSidebarOpen, setInsightSidebarOpen] = useState(false)
  const [insightChatMounted, setInsightChatMounted] = useState(false)
  const { user } = useAuth();
  const { isFree } = useSubscriptionPlan()
  const problemIcon = getProblemIcon(problem.id);
  const [showMobileUpgradeModal, setShowMobileUpgradeModal] = useState(false)
  const [openedInsightFromCard, setOpenedInsightFromCard] = useState(false)
  const [canMarkSolvedByAnswer, setCanMarkSolvedByAnswer] = useState(false)
  const [initialHintMessage, setInitialHintMessage] = useState<string | null>(null)
  /** When set, overrides bubble text for the initial auto-sent message (e.g. bracketed label on card). */
  const [initialInsightDisplayOverride, setInitialInsightDisplayOverride] = useState<string | null>(null)
  const [showCongratulationCloseButton, setShowCongratulationCloseButton] = useState(false)
  const [storedCatalogBackHref] = useState(() =>
    getStoredCatalogBackHref(subjectConfig.catalogHrefPrefix, subjectConfig.catalogBackHref),
  )
  const router = useRouter()
  const [catalogBackLoading, setCatalogBackLoading] = useState(false)
  const [wrongAnswerPenalty, setWrongAnswerPenalty] = useState<ProblemWrongAnswerPenalty | null>(null)
  const [wrongPageShake, setWrongPageShake] = useState(false)
  const [mobileAnswerMaximised, setMobileAnswerMaximised] = useState(false)
  useSocialProofTrigger({ enabled: Boolean(user?.id) && !isClassroomEmbed, problemId: problem.id })

  useEffect(() => {
    const mountIfNeeded = () => {
      if (insightSidebarOpen || window.matchMedia("(min-width: 1024px)").matches) {
        setInsightChatMounted(true)
      }
    }
    mountIfNeeded()
    const media = window.matchMedia("(min-width: 1024px)")
    media.addEventListener("change", mountIfNeeded)
    return () => media.removeEventListener("change", mountIfNeeded)
  }, [insightSidebarOpen])

  useEffect(() => {
    if (!wrongAnswerPenalty) return
    setWrongPageShake(true)
    const id = window.setTimeout(() => setWrongPageShake(false), 480)
    return () => window.clearTimeout(id)
  }, [wrongAnswerPenalty])

  const handleWrongAnswerPenalty = useCallback((penalty: ProblemWrongAnswerPenalty) => {
    setWrongAnswerPenalty(penalty)
  }, [])

  const youtubeVideoId = useMemo(() => {
    if (typeof problem.youtube_url !== "string" || problem.youtube_url.trim() === "") return null
    return extractYouTubeVideoId(problem.youtube_url)
  }, [problem.youtube_url])
  const hasVideo = Boolean(youtubeVideoId)
  const hasAnswerCard = problem.answer_type === "value" || problem.answer_type === "grila"
  const hasProblemImage = typeof problem.image_url === "string" && problem.image_url.trim() !== ""

  React.useEffect(() => {
    setCanMarkSolvedByAnswer(false)
    setWrongAnswerPenalty(null)
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

  const difficultyTone =
    difficultyAccentClasses[problem.difficulty] ||
    "border-[#0b0d10]/15 bg-white text-[#2C2F33] hover:bg-white hover:text-[#2C2F33] hover:border-[#0b0d10]/15"
  const classLabel = problem.classString
    ? problem.classString
    : typeof problem.class === 'number'
      ? `Clasa a ${problem.class}-a`
      : null
  const problemTags = useMemo(() => normalizeProblemTags(problem.tags), [problem.tags])

  const renderProblemMetaBadges = (className?: string, options?: { hideDifficulty?: boolean; hideVideo?: boolean }) => (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {!options?.hideDifficulty && (
        <Badge
          variant="outline"
          className={cn(
            "cursor-default border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]",
            difficultyTone,
          )}
        >
          {problem.difficulty}
        </Badge>
      )}
      <Badge
        variant="outline"
        className="flex cursor-default items-center gap-2 border border-[#0b0d10]/15 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#2C2F33] hover:bg-white hover:text-[#2C2F33] hover:border-[#0b0d10]/15"
      >
        <span className="text-base leading-none">{categoryIcons?.[problem.category] ?? '📘'}</span>
        {problem.category}
      </Badge>
      {hasVideo && !options?.hideVideo && (
        <Badge
          variant="outline"
          className="cursor-default border border-red-600/30 bg-red-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-800 hover:border-red-600/30 hover:bg-red-50 hover:text-red-800"
        >
          🎥 Video
        </Badge>
      )}
    </div>
  )

  // Add custom scrollbar class to body (skip when embedded in classroom shell — parent scrolls)
  React.useEffect(() => {
    if (isClassroomEmbed) return
    document.body.classList.add("problem-page-scrollbar")
    return () => {
      document.body.classList.remove("problem-page-scrollbar")
    }
  }, [isClassroomEmbed])

  React.useEffect(() => {
    const checkSolved = async () => {
      if (subject !== "physics") {
        setLoadingSolved(false)
        return
      }
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
  }, [user, problem.id, subject]);

  const showSolvedCelebration = () => {
    const randomMessage = congratulationMessages[Math.floor(Math.random() * congratulationMessages.length)];
    setCongratulationMessage(randomMessage);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 1000,
    });
  };

  const handleMarkSolved = async () => {
    if (!user) return;
    if (isSolved) return; // Prevent duplicate submissions
    setLoadingSolved(true);

    if (subject === "math") {
      // Math catalog doesn't use solved_problems / ELO trigger — still grant PlanckPass XP
      void import("@/lib/planckpass/award-client").then(({ awardPlanckPassXpForProblem }) =>
        awardPlanckPassXpForProblem(String(problem.id), problem.difficulty),
      )
      setIsSolved(true);
      setLoadingSolved(false);
      showSolvedCelebration();
      return;
    }

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

    // PlanckPass XP (idempotent; also attempted in SQL trigger if migration applied)
    void import("@/lib/planckpass/award-client").then(({ awardPlanckPassXpForProblem }) =>
      awardPlanckPassXpForProblem(String(problem.id), problem.difficulty),
    )

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
    showSolvedCelebration();
  };

  const catalogBackHref = classroomCatalogHref ?? storedCatalogBackHref

  const handleBackToCatalog = async () => {
    if (isClassroomEmbed) return
    if (catalogBackLoading) return
    setCatalogBackLoading(true)
    try {
      if (subject === "physics") {
        await ensurePhysicsCatalogProblemsCached()
        if (getFreshPhysicsCatalogProblems()?.length) {
          try {
            sessionStorage.setItem(getPhysicsCatalogSkipGridSkeletonSessionKey(), "1")
          } catch {
            // ignore
          }
        }
        await import("@/components/problem-card")
      }
      router.prefetch(catalogBackHref)
      router.push(catalogBackHref)
    } catch (err) {
      console.error("[problem-detail] Back to catalog prefetch failed:", err)
      setCatalogBackLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col text-[#2C2F33]",
        isClassroomEmbed ? "min-h-0 bg-[#f6f5f4]" : "min-h-screen bg-[#f6f5f4] lg:bg-white",
        wrongAnswerPenalty &&
          "shadow-[inset_0_0_120px_rgba(244,63,94,0.14)] transition-[box-shadow] duration-300",
      )}
    >
      {!isClassroomEmbed ? <Navigation /> : null}

      <div
        className={cn(
          "flex-1",
          isClassroomEmbed
            ? "relative w-full min-h-0"
            : "lg:fixed lg:top-16 lg:left-0 lg:right-[25vw] lg:bottom-0 lg:pb-[6px] lg:pl-[6px] lg:pt-0 lg:pr-0",
          wrongPageShake && "animate-grile-wrong-shake",
        )}
      >
        <div
          className={cn(
            "relative z-[1]",
            isClassroomEmbed ? "bg-[#f6f5f4]" : "lg:rounded-xl lg:bg-[#f6f5f4] lg:h-full lg:overflow-hidden lg:shadow-md",
          )}
        >
        <div
          className={cn(
            "problem-page-scrollbar",
            isClassroomEmbed
              ? "overflow-x-hidden"
              : "lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:rounded-xl",
          )}
        >
        {!isClassroomEmbed ? (
          <div className="pt-16 lg:hidden">
            <ProblemsPwaInstallBanner />
          </div>
        ) : null}
        <div
          className={cn(
            "px-4 sm:px-6 lg:px-12 pb-16",
            isClassroomEmbed ? "pt-4" : "pt-4 lg:pt-8",
            hasAnswerCard && "max-lg:pb-40",
          )}
        >
          <div className="mx-auto max-w-[1600px] space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSidebarOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2 rounded-full border-[#0b0d10]/15 bg-white/80 px-4 py-2 text-sm font-medium text-[#0b0d10] transition hover:bg-white"
                  >
                    <List className="w-4 h-4" />
                    <span>Toate problemele</span>
                  </Button>
                  <Badge
                    variant="outline"
                    className={cn(
                      "lg:hidden cursor-default shrink-0 border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      difficultyTone,
                    )}
                  >
                    {problem.difficulty}
                  </Badge>
                  {hasVideo ? (
                    <span
                      className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-600/25 bg-red-50 text-red-800"
                      aria-label="Are rezolvare video"
                      title="Are rezolvare video"
                    >
                      <Camera className="h-4 w-4" strokeWidth={2.1} />
                    </span>
                  ) : null}
                </div>
                {isClassroomEmbed ? (
                  <Link
                    href={catalogBackHref}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#2C2F33]/70 transition hover:text-[#0b0d10]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Înapoi la selectarea problemelor</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleBackToCatalog}
                    disabled={catalogBackLoading}
                    aria-busy={catalogBackLoading}
                    className={cn(
                      "items-center gap-2 text-sm font-medium text-[#2C2F33]/70 transition hover:text-[#0b0d10] disabled:pointer-events-none disabled:opacity-60",
                      user ? "hidden burger:inline-flex" : "inline-flex",
                    )}
                  >
                    {catalogBackLoading ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
                    )}
                    <span>Înapoi la catalog</span>
                  </button>
                )}
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
                <ReportIssueButton
                  sourceType={subject === "math" ? "math_problem" : "physics_problem"}
                  sourceId={problem.id}
                  sourceMeta={{ subject }}
                />
                {isSolved && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    Rezolvată
                  </span>
                )}
              </div>
            </div>

            <div className="grid items-start gap-8">
              <section className="space-y-8">
                <div className="flex flex-col gap-6">
                  <h1 className="text-[1.3125rem] sm:text-4xl lg:text-5xl font-semibold leading-tight text-[#0b0d10]">
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
                    <ReportIssueButton
                      sourceType={subject === "math" ? "math_problem" : "physics_problem"}
                      sourceId={problem.id}
                      sourceMeta={{ subject }}
                    />
                  </div>

                  {problemTags.length > 0 && (
                    <div className="hidden sm:flex flex-wrap gap-2">
                      {problemTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#0b0d10]/15 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#2C2F33]/75"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-[#0b0d10]/10 bg-white/95 p-6 shadow-[0_12px_30px_-24px_rgba(11,13,16,0.45)] lg:mb-8">
                      <div className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-[#2C2F33]">
                        {renderInlineMath(problem.statement)}
                      </div>
                    </div>

                    {hasVideo && youtubeVideoId ? (
                      <>
                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 xl:gap-8">
                          <div className="space-y-6">
                            {hasProblemImage && (
                              <div className="flex justify-center lg:justify-start">
                                {!imageLoaded && (
                                  <Skeleton className="h-72 w-full max-w-[620px] rounded-xl bg-[#dfdcd8]" />
                                )}
                                <img
                                  src={problem.image_url!.replace(/^@/, "")}
                                  alt="Ilustrație problemă"
                                  className={cn(
                                    "h-auto w-full max-w-[620px] rounded-xl border border-[#0b0d10]/10 bg-white object-contain shadow-sm",
                                    !imageLoaded && "hidden"
                                  )}
                                  onLoad={() => setImageLoaded(true)}
                                  onError={(e) => {
                                    console.error("Image failed to load:", problem.image_url, e)
                                    setImageLoaded(true)
                                  }}
                                />
                              </div>
                            )}
                            <div className="overflow-hidden rounded-2xl border border-[#0b0d10]/10 bg-white shadow-[0_12px_30px_-24px_rgba(11,13,16,0.45)]">
                              <LazyYouTubePlayer
                                videoId={youtubeVideoId}
                                title="Rezolvare video"
                                className="rounded-none shadow-none"
                                locked={isFree}
                                lockedLabel="Disponibil cu Planck Plus+"
                                onLockedClick={() => setShowMobileUpgradeModal(true)}
                              />
                            </div>
                          </div>
                          <div className="hidden space-y-6 lg:block">
                            {hasAnswerCard ? (
                              <ProblemAnswerCard
                                problem={problem}
                                onCanMarkSolvedChange={setCanMarkSolvedByAnswer}
                                onSolvedCorrectly={handleMarkSolved}
                                isSolved={isSolved}
                                userId={user?.id ?? null}
                                onWrongAnswerPenalty={handleWrongAnswerPenalty}
                                showHintButton={!isClassroomEmbed}
                                onHintClick={
                                  !isClassroomEmbed
                                    ? () => {
                                        setOpenedInsightFromCard(true)
                                        setInsightSidebarOpen(true)
                                        setInitialHintMessage("Am nevoie de un hint")
                                      }
                                    : undefined
                                }
                              />
                            ) : null}
                            <RecommendedProblemCard currentProblem={problem} subject={subject} />
                          </div>
                          <div className="lg:hidden">
                            <RecommendedProblemCard currentProblem={problem} subject={subject} />
                          </div>
                        </div>
                        {renderProblemMetaBadges("hidden lg:flex")}
                      </>
                    ) : (
                      <>
                        {hasProblemImage && (
                          <div className="flex justify-center lg:hidden">
                            {!imageLoaded && <ImageSkeleton />}
                            <img
                              src={problem.image_url!.replace(/^@/, "")}
                              alt="Ilustrație problemă"
                              className={cn(
                                "w-full h-auto max-w-full rounded-xl border border-[#0b0d10]/10 bg-white object-contain shadow-sm",
                                !imageLoaded && "hidden"
                              )}
                              onLoad={() => setImageLoaded(true)}
                              onError={(e) => {
                                console.error("Image failed to load:", problem.image_url, e)
                                setImageLoaded(true)
                              }}
                            />
                          </div>
                        )}
                        {hasProblemImage && (
                          <div className="hidden lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.72fr)] items-start gap-6 xl:gap-8">
                            <div className="flex justify-start">
                              {!imageLoaded && (
                                <Skeleton className="h-72 w-full max-w-[620px] rounded-xl bg-[#dfdcd8]" />
                              )}
                              <img
                                src={problem.image_url!.replace(/^@/, "")}
                                alt="Ilustrație problemă"
                                className={cn(
                                  "h-auto w-full max-w-[620px] rounded-xl border border-[#0b0d10]/10 bg-white object-contain shadow-sm",
                                  !imageLoaded && "hidden"
                                )}
                                onLoad={() => setImageLoaded(true)}
                                onError={(e) => {
                                  console.error("Image failed to load:", problem.image_url, e)
                                  setImageLoaded(true)
                                }}
                              />
                            </div>
                            <div className="space-y-3">
                              {hasAnswerCard ? (
                                <ProblemAnswerCard
                                  problem={problem}
                                  onCanMarkSolvedChange={setCanMarkSolvedByAnswer}
                                  onSolvedCorrectly={handleMarkSolved}
                                  isSolved={isSolved}
                                  userId={user?.id ?? null}
                                  onWrongAnswerPenalty={handleWrongAnswerPenalty}
                                />
                              ) : (
                                <NoAnswerCard />
                              )}
                              {renderProblemMetaBadges("hidden lg:flex")}
                            </div>
                          </div>
                        )}
                        <div
                          className={cn(
                            "hidden items-start gap-6 lg:grid xl:gap-8",
                            hasProblemImage ? "grid-cols-1" : "grid-cols-2"
                          )}
                        >
                          {!hasProblemImage && (
                            <div className="space-y-3">
                              {hasAnswerCard ? (
                                <ProblemAnswerCard
                                  problem={problem}
                                  onCanMarkSolvedChange={setCanMarkSolvedByAnswer}
                                  onSolvedCorrectly={handleMarkSolved}
                                  isSolved={isSolved}
                                  userId={user?.id ?? null}
                                  onWrongAnswerPenalty={handleWrongAnswerPenalty}
                                />
                              ) : (
                                <NoAnswerCard />
                              )}
                              {renderProblemMetaBadges()}
                            </div>
                          )}
                          <RecommendedProblemCard currentProblem={problem} subject={subject} />
                        </div>
                      </>
                    )}

                    {!isClassroomEmbed && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setInitialHintMessage("Explică-mi pas cu pas")
                            setInitialInsightDisplayOverride("[Explică-mi pas cu pas]")
                            setInsightSidebarOpen(true)
                          }}
                          className={cn(
                            "lg:hidden flex w-full min-h-[56px] cursor-pointer select-none touch-manipulation items-center gap-3 rounded-2xl border border-[#0b0d10]/12 bg-white p-4 text-left shadow-[0_4px_14px_-4px_rgba(11,13,16,0.12)] transition-[transform,box-shadow,background-color,border-color] duration-150",
                            "hover:border-[#0b0d10]/18 hover:bg-white hover:shadow-[0_8px_24px_-8px_rgba(11,13,16,0.18)]",
                            "active:scale-[0.98] active:border-[#0b0d10]/22 active:bg-[#fafafa] active:shadow-[inset_0_2px_8px_rgba(11,13,16,0.06)]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0d10]/20 focus-visible:ring-offset-2"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-[#0b0d10]">✦ Esti blocat?</p>
                            <p className="mt-1 text-sm font-medium text-[#2C2F33]/70">[Explică-mi pas cu pas]</p>
                          </div>
                          <ChevronRight
                            className="h-5 w-5 shrink-0 self-center text-[#2C2F33]/40"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          <img
                            src="/streak-icon.png"
                            alt=""
                            className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
                            width={64}
                            height={64}
                            aria-hidden
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {renderProblemMetaBadges("lg:hidden", { hideDifficulty: true, hideVideo: true })}
              </section>

              {/* Pe mobil: card problema recomandată sub datele problemei, înainte de footer */}
              {!hasVideo && (
                <div className="lg:hidden w-full">
                  <RecommendedProblemCard currentProblem={problem} subject={subject} />
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
        {!isClassroomEmbed ? (
          <Footer
            theme="light"
            backgroundColor="bg-[#f6f5f4]"
            borderColor="border-[#0b0d10]/10"
          />
        ) : null}
        </div>
        </div>

      <Suspense fallback={null}>
        <ProblemsSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentProblemId={problem.id}
          subject={subject}
        />
      </Suspense>

      {congratulationMessage && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
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

      {wrongAnswerPenalty && (
        <ProblemWrongAnswerEloCard
          penalty={wrongAnswerPenalty}
          onDismiss={() => setWrongAnswerPenalty(null)}
        />
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

      {!isClassroomEmbed && (
        <ProblemOrbButton
          style={
            hasAnswerCard
              ? {
                  // Keep base clearance for the minimised bar; lift extra with GPU transform when maximised.
                  bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
                  transform:
                    !insightSidebarOpen && mobileAnswerMaximised
                      ? problem.answer_type === "grila"
                        ? "translate3d(0, -13.5rem, 0)"
                        : "translate3d(0, -4.25rem, 0)"
                      : "translate3d(0, 0, 0)",
                }
              : undefined
          }
          onOpenSidebar={() => {
            setOpenedInsightFromCard(false)
            setInsightSidebarOpen(true)
          }}
        />
      )}

      {hasAnswerCard ? (
        <ProblemAnswerCard
          layout="bottomBar"
          problem={problem}
          onCanMarkSolvedChange={setCanMarkSolvedByAnswer}
          onSolvedCorrectly={handleMarkSolved}
          isSolved={isSolved}
          userId={user?.id ?? null}
          onWrongAnswerPenalty={handleWrongAnswerPenalty}
          onMobileMaximisedChange={setMobileAnswerMaximised}
          showHintButton={!isClassroomEmbed}
          onHintClick={
            !isClassroomEmbed
              ? () => {
                  setOpenedInsightFromCard(true)
                  setInsightSidebarOpen(true)
                  setInitialHintMessage("Am nevoie de un hint")
                }
              : undefined
          }
        />
      ) : null}

      {!isClassroomEmbed && insightChatMounted && (
        <Suspense fallback={null}>
          <InsightChatSidebar
            isOpen={insightSidebarOpen}
            embedOnDesktop
            problemLightTheme
            onClose={() => {
              setInsightSidebarOpen(false)
              setOpenedInsightFromCard(false)
              setInitialHintMessage(null)
              setInitialInsightDisplayOverride(null)
            }}
            problemId={problem.id}
            problemStatement={problem.statement || ''}
            problemImageUrl={hasProblemImage ? problem.image_url!.replace(/^@/, '') : null}
            persona="problem_tutor"
            enableInteractiveTutor={subject === 'physics' || subject === 'math'}
            problemSubject={subject === 'math' ? 'math' : 'physics'}
            onMobileUpgradePrompt={() => setShowMobileUpgradeModal(true)}
            initialUserMessage={initialHintMessage}
            initialUserMessageDisplay={initialInsightDisplayOverride ?? initialHintMessage}
            onInitialMessageSent={() => {
              setInitialHintMessage(null)
              setInitialInsightDisplayOverride(null)
            }}
          />
        </Suspense>
      )}

      {/* Plus+ trial modal when free user opens video resolution */}
      {showMobileUpgradeModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <PlanckPlusTrialModal
            title="Rezolvarea video este disponibilă cu Planck Plus+. Vezi planurile pentru a o debloca."
            onClose={() => setShowMobileUpgradeModal(false)}
          />
        </div>
      )}
    </div>
  )
} 