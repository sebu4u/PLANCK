"use client"

import { useMemo, useState, lazy, Suspense } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, List, CheckCircle2, Maximize2, X } from "lucide-react"
import type { Problem } from "@/data/problems"
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import React from 'react';
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import confetti from 'canvas-confetti'
import { Skeleton } from "@/components/ui/skeleton"
import { ProblemsSidebar } from "@/components/problems-sidebar"
import { BadgeNotification } from "@/components/badge-notification"
import ProblemOrbButton from "@/components/problem-orb-button"
import InsightChatSidebar from "@/components/insight-chat-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProblemBoard } from "@/components/problems/problem-board"
import { cn } from "@/lib/utils"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { createTLStore, defaultShapeUtils } from "@tldraw/tldraw"

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
  "Ușor": "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
  "Mediu": "border-amber-500/50 bg-amber-500/10 text-amber-200",
  "Avansat": "border-rose-500/50 bg-rose-500/10 text-rose-200",
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

// Loading skeleton for problem image
function ImageSkeleton() {
  return (
    <div className="mt-6 flex justify-center">
      <Skeleton className="w-full max-w-2xl h-80 rounded-xl bg-white/10" />
    </div>
  )
}

type DifficultyColors = Record<string, string>

export default function ProblemDetailClient({ problem, categoryIcons, difficultyColors }: {
  problem: Problem,
  categoryIcons: any,
  difficultyColors: DifficultyColors
}) {
  const [activeTab, setActiveTab] = useState<'statement' | 'video'>(
    typeof problem.youtube_url === 'string' && problem.youtube_url.trim() !== '' ? 'statement' : 'statement'
  )
  const [isSolved, setIsSolved] = useState(false)
  const [loadingSolved, setLoadingSolved] = useState(true)
  const [congratulationMessage, setCongratulationMessage] = useState<string | null>(null)
  const [newBadge, setNewBadge] = useState<any>(null)
  const [showBadgeNotification, setShowBadgeNotification] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [insightSidebarOpen, setInsightSidebarOpen] = useState(false)
  const [mobileBoardVisible, setMobileBoardVisible] = useState(false)
  const [desktopBoardExpanded, setDesktopBoardExpanded] = useState(false)
  const { user } = useAuth();
  const problemIcon = getProblemIcon(problem.id);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)

  // Create a shared store for the desktop whiteboard (minimized and maximized share the same instance)
  const desktopBoardStore = useMemo(() => createTLStore({ shapeUtils: defaultShapeUtils }), [])

  const hasVideo = useMemo(() => {
    return typeof problem.youtube_url === 'string' && problem.youtube_url.trim() !== ''
  }, [problem.youtube_url])

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

  const difficultyTone = difficultyAccentClasses[problem.difficulty] || "border-white/15 bg-white/5 text-white/80"
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

    // Also manually update getting started progress as fallback
    // The trigger should handle this, but we do it here as backup
    if (!error) {
      // Count actual solved problems and update
      supabase
        .from('solved_problems')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => {
          if (count !== null) {
            supabase
              .from('getting_started_progress')
              .upsert(
                {
                  user_id: user.id,
                  problems_solved_count: count,
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: 'user_id',
                  ignoreDuplicates: false,
                }
              )
          }
        })
    }

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
      origin: { y: 0.6 }
    });

    // Ascunde mesajul după 3 secunde
    setTimeout(() => {
      setCongratulationMessage(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen text-white flex flex-col">
      <Navigation />

      {/* Upgrade Banner for Free Users */}
      {showUpgradeBanner && (
        <div className="fixed top-[116px] left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-2 duration-300">
          <Link
            href="/pricing"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/90 to-amber-500/90 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-medium rounded-full shadow-lg transition-all hover:scale-105"
          >
            <span>Upgrade to Plus</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </Link>
        </div>
      )}

      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          insightSidebarOpen ? "lg:mr-[33vw]" : ""
        )}
      >
        <div className="px-4 sm:px-6 lg:px-12 pt-20 lg:pt-[116px] pb-16">
          <div className="mx-auto max-w-[1600px] space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setSidebarOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/20"
                >
                  <List className="w-4 h-4" />
                  <span>Toate problemele</span>
                </Button>
                <Link
                  href="/probleme"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Înapoi la catalog</span>
                </Link>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-sm text-white/60">
                {classLabel && (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                    {classLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1">
                  <span className="text-lg leading-none">{problemIcon}</span>
                  <span>ID {problem.id}</span>
                </span>
                {isSolved && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    Rezolvată
                  </span>
                )}
              </div>
            </div>

            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] 2xl:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              <section className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-[0px_24px_70px_-40px_rgba(0,0,0,0.9)]">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={cn("border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]", difficultyTone)}>
                          {problem.difficulty}
                        </Badge>
                        <Badge className="flex items-center gap-2 border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                          <span className="text-base leading-none">{categoryIcons?.[problem.category] ?? '📘'}</span>
                          {problem.category}
                        </Badge>
                        {hasVideo && (
                          <Badge className="border border-red-500/40 bg-red-500/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                            🎥 Video
                          </Badge>
                        )}
                        {isSolved && (
                          <Badge className="border border-emerald-500/50 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                            ✔️ Rezolvată
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-white">
                      {renderInlineMath(problem.title)}
                    </h1>

                    {problem.description && (
                      <p className="text-base sm:text-lg leading-relaxed text-white/70">
                        {renderInlineMath(problem.description)}
                      </p>
                    )}

                    {problem.tags && Array.isArray(problem.tags) && problem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {problem.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/60"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) => setActiveTab(value as 'statement' | 'video')}
                      className="w-full"
                    >
                      <TabsList className="flex w-full gap-1 sm:gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 overflow-hidden">
                        <TabsTrigger
                          value="statement"
                          className="flex-[0_0_calc(50%-0.125rem)] sm:flex-1 min-w-0 rounded-full text-sm font-medium text-white/60 data-[state=active]:bg-white data-[state=active]:text-black px-2 sm:px-4 py-2 text-center overflow-hidden"
                        >
                          <span className="truncate block">Enunț</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="video"
                          className="flex-[0_0_calc(50%-0.125rem)] sm:flex-1 min-w-0 rounded-full text-sm font-medium text-white/60 data-[state=active]:bg-white data-[state=active]:text-black px-2 sm:px-4 py-2 text-center overflow-hidden"
                        >
                          <span className="truncate block">Video</span>
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="statement" className="mt-6">
                        <div className="rounded-2xl border border-white/8 bg-black/40 p-6">
                          <ScrollArea className="max-h-[60vh] pr-3">
                            <div className="whitespace-pre-wrap text-base leading-relaxed text-white/85">
                              {renderInlineMath(problem.statement)}
                            </div>
                            {problem.image_url && (
                              <div className="mt-6 flex justify-center">
                                {!imageLoaded && <ImageSkeleton />}
                                <img
                                  src={problem.image_url.replace(/^@/, '')}
                                  alt="Ilustrație problemă"
                                  className={cn(
                                    "max-h-[420px] w-auto rounded-xl border border-white/10 object-contain shadow-xl",
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
                          </ScrollArea>
                        </div>
                      </TabsContent>
                      <TabsContent value="video" className="mt-6">
                        <div className="rounded-2xl border border-white/8 bg-black/40 p-6">
                          {hasVideo ? (
                            <Suspense fallback={<VideoSkeleton />}>
                              <VideoPlayer videoUrl={problem.youtube_url!} title="Rezolvare video" />
                            </Suspense>
                          ) : (
                            <MissingVideoCard />
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {user && !loadingSolved && (
                    <Button
                      onClick={handleMarkSolved}
                      disabled={isSolved}
                      className={cn(
                        'rounded-full border px-6 py-3 text-sm font-semibold transition',
                        isSolved
                          ? 'cursor-not-allowed border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                          : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                      )}
                    >
                      {isSolved ? 'Rezolvată' : 'Marchează ca rezolvată'}
                    </Button>
                  )}
                  {!user && (
                    <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                      Autentifică-te pentru a salva progresul
                    </span>
                  )}
                  <Button
                    onClick={() => setMobileBoardVisible(true)}
                    className="rounded-full border border-indigo-500/40 bg-indigo-500/20 px-6 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30 lg:hidden"
                  >
                    Deschide tabla
                  </Button>
                </div>
              </section>

              <aside className="space-y-6">
                {/* Only show minimized board when dialog is not expanded */}
                {!desktopBoardExpanded && (
                  <div className="hidden lg:flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-[0px_24px_80px_-40px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">Tabla de lucru</h2>
                        <p className="mt-1 text-sm text-white/50">
                          Rezolvă problema direct pe această tablă. Salvează dacă ai cont.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDesktopBoardExpanded(true)}
                        className="hidden rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 lg:inline-flex"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="relative h-[600px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                      <ProblemBoard problemId={problem.id} store={desktopBoardStore} />
                    </div>
                  </div>
                )}

                <div className="lg:hidden rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                    {classLabel && (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                        {classLabel}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1">
                      <span className="text-base leading-none">{problemIcon}</span>
                      <span className="font-mono uppercase tracking-[0.28em] text-white/60">ID {problem.id}</span>
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">Tabla de lucru</h2>
                  <p className="mt-2 text-sm text-white/60">
                    Pentru o experiență mai bună pe mobil, deschide tabla pe tot ecranul.
                  </p>
                  <Button
                    onClick={() => setMobileBoardVisible(true)}
                    className="mt-4 w-full rounded-full border border-indigo-500/40 bg-indigo-500/20 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30"
                  >
                    Deschide tabla
                  </Button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <ProblemsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentProblemId={problem.id}
      />

      {congratulationMessage && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 text-center shadow-2xl">
            <div className="mb-4 text-6xl">🎉</div>
            <h3 className="mb-3 text-2xl font-bold">Felicitări!</h3>
            <p className="mb-6 text-white/70">{congratulationMessage}</p>
            <Button
              onClick={() => setCongratulationMessage(null)}
              className="rounded-full border border-white/20 bg-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/25"
            >
              Continuă
            </Button>
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

      <ProblemOrbButton onOpenSidebar={() => setInsightSidebarOpen(true)} />

      <InsightChatSidebar
        isOpen={insightSidebarOpen}
        onClose={() => setInsightSidebarOpen(false)}
        problemId={problem.id}
        problemStatement={problem.statement || ''}
        persona="problem_tutor"
        onFreePlanMessage={() => setShowUpgradeBanner(true)}
      />

      <Dialog open={desktopBoardExpanded} onOpenChange={setDesktopBoardExpanded}>
        <DialogContent hideClose className="max-w-[95vw] border border-white/10 bg-[#141414] text-white top-[calc(50%+32px)] sm:top-[calc(50%+36px)] md:top-[calc(50%+40px)]">
          <DialogTitle className="sr-only">Tabla de lucru - Vizualizare pe tot ecranul</DialogTitle>
          <div className="flex items-center justify-between pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Tabla de lucru</p>
              <p className="text-sm text-white/60">Vizualizare pe tot ecranul</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDesktopBoardExpanded(false)}
              className="rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-[75vh] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <ProblemBoard problemId={problem.id} store={desktopBoardStore} />
          </div>
        </DialogContent>
      </Dialog>

      <Drawer
        open={mobileBoardVisible}
        onOpenChange={(open) => {
          // Prevent automatic closing from swipe/scroll gestures
          // Only allow closing via the button
          if (open) {
            setMobileBoardVisible(true)
          }
        }}
        dismissible={false}
      >
        <DrawerContent
          className="bg-[#141414] text-white border-t border-white/10"
          onPointerDownOutside={(e) => {
            // Prevent closing on outside click
            e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing on escape key
            e.preventDefault()
          }}
        >
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-base font-semibold uppercase tracking-[0.3em] text-white/60">
              Tabla de lucru
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <div className="h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <ProblemBoard problemId={problem.id} />
            </div>
            <Button
              className="mt-4 w-full rounded-full border border-white/15 bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20"
              onClick={() => setMobileBoardVisible(false)}
            >
              Închide tabla
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
} 