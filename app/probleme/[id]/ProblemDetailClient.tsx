"use client"
import { useState, lazy, Suspense } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, X, List } from "lucide-react"
import type { Problem } from "@/data/problems"
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import React from 'react';
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import confetti from 'canvas-confetti'
import { Skeleton } from "@/components/ui/skeleton"
import { ProblemsSidebar } from "@/components/problems-sidebar"
import { BadgeNotification } from "@/components/badge-notification"

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

// Loading skeleton for video content
function VideoSkeleton() {
  return (
    <div className="aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden shadow-2xl bg-gray-100">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="w-32 h-4 rounded mx-auto" />
        </div>
      </div>
    </div>
  )
}

// Loading skeleton for problem image
function ImageSkeleton() {
  return (
    <div className="mt-6 flex justify-center">
      <Skeleton className="w-full max-w-2xl h-96 rounded-lg" />
    </div>
  )
}

export default function ProblemDetailClient({ problem, categoryIcons, difficultyColors }: {
  problem: Problem,
  categoryIcons: any,
  difficultyColors: any
}) {
  const [showVideo, setShowVideo] = useState(false)
  const [isSolved, setIsSolved] = useState(false)
  const [loadingSolved, setLoadingSolved] = useState(true)
  const [congratulationMessage, setCongratulationMessage] = useState<string | null>(null)
  const [newBadge, setNewBadge] = useState<any>(null)
  const [showBadgeNotification, setShowBadgeNotification] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth();
  const problemIcon = getProblemIcon(problem.id);

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
    setLoadingSolved(true);
    
    // Marchează problema ca rezolvată
    await supabase.from('solved_problems').insert({
      user_id: user.id,
      problem_id: problem.id,
      solved_at: new Date().toISOString(),
    });
    
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
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Link href="/probleme" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Înapoi la probleme</span>
              </Link>
              
              {/* Problems Sidebar Toggle Button */}
              <Button
                onClick={() => setSidebarOpen(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Toate problemele</span>
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl drop-shadow-lg">{problemIcon}</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`border ${difficultyColors[problem.difficulty] || "bg-gray-100 text-gray-700 border-gray-300"} font-semibold px-3 py-1`}>
                      {problem.difficulty}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 font-semibold px-3 py-1">
                      {problem.category}
                    </Badge>
                    {typeof problem.youtube_url === 'string' && problem.youtube_url.trim() !== '' && (
                      <Badge className="bg-red-100 text-red-700 border-red-300 font-semibold px-3 py-1">
                        🎥 Rezolvare video
                      </Badge>
                    )}
                    {isSolved && (
                      <Badge className="bg-green-100 text-green-700 border-green-300 font-semibold px-3 py-1">
                        ✔️ Rezolvată
                      </Badge>
                    )}
                  </div>
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 line-clamp-3">
                  {problem.title.includes('$')
                    ? problem.title.split(/(\$[^$]+\$)/g).map((part, idx) =>
                        part.startsWith('$') && part.endsWith('$') ? (
                          <InlineMath key={idx} math={part.slice(1, -1)} />
                        ) : (
                          <span key={idx}>{part}</span>
                        )
                      )
                    : <span>{problem.title}</span>
                  }
                </h1>
                
                {problem.description && (
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {problem.description.includes('$')
                      ? problem.description.split(/(\$[^$]+\$)/g).map((part, idx) =>
                          part.startsWith('$') && part.endsWith('$') ? (
                            <InlineMath key={idx} math={part.slice(1, -1)} />
                          ) : (
                            <span key={idx}>{part}</span>
                          )
                        )
                      : <span>{problem.description}</span>
                    }
                  </p>
                )}
                
                {problem.tags && Array.isArray(problem.tags) && problem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {problem.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 rounded-full text-sm font-semibold shadow-sm border border-purple-100">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="lg:col-span-1">
                <Card className="border-purple-200 sticky top-24">
                  <CardHeader>
                    <CardTitle>Informații problema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono text-sm">{problem.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clasa:</span>
                      <span className="font-semibold">Clasa a {problem.class}-a</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoria:</span>
                      <span className="font-semibold">{problem.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dificultatea:</span>
                      <Badge className={`${difficultyColors[problem.difficulty] || "bg-gray-100 text-gray-700"}`}>
                        {problem.difficulty}
                      </Badge>
                    </div>
                    {problem.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Adăugată:</span>
                        <span className="text-sm">{new Date(problem.created_at).toLocaleDateString('ro-RO')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Content */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <Card className="border-purple-200 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">{problemIcon}</span>
                Enunțul problemei
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-inner">
                <div className="whitespace-pre-line text-lg leading-relaxed text-gray-800">
                  {problem.statement && problem.statement.includes("$")
                    ? problem.statement.split(/(\$[^$]+\$)/g).map((part, idx) =>
                        part.startsWith("$") && part.endsWith("$") ? (
                          <InlineMath key={idx} math={part.slice(1, -1)} />
                        ) : (
                          <span key={idx}>{part}</span>
                      ))
                    : <span>{problem.statement}</span>
                  }
                </div>
                {problem.image_url && (
                  <div className="mt-6 flex justify-center">
                    {!imageLoaded && <ImageSkeleton />}
                    <img
                      src={problem.image_url.replace(/^@/, '')}
                      alt="Ilustrație problemă"
                      className={`rounded-lg max-w-full max-h-96 shadow-md border border-gray-200 ${!imageLoaded ? 'hidden' : ''}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={(e) => {
                        console.error('Image failed to load:', problem.image_url, e);
                        setImageLoaded(true); // Hide skeleton even on error
                      }}
                      style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '384px' }}
                    />
                  </div>
                )}
              </div>
              
              {!showVideo && (
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  {typeof problem.youtube_url === 'string' && problem.youtube_url.trim() !== '' ? (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-xl hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-300 text-lg transform hover:shadow-2xl"
                    >
                      🎥 Vezi rezolvarea video
                    </button>
                  ) : (
                    <div className="px-8 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold text-lg border-2 border-gray-200">
                      📹 Rezolvare video indisponibilă
                    </div>
                  )}
                  {user && !loadingSolved && (
                    <button
                      onClick={handleMarkSolved}
                      disabled={isSolved}
                      className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg shadow-xl border-2 transition-all duration-200
                        ${isSolved ? 'bg-green-100 border-green-400 text-green-700 cursor-not-allowed' : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-500'}
                      `}
                      style={{ minWidth: 0 }}
                    >
                      {isSolved ? <span className="text-xl">✔️</span> : <span className="text-xl">☆</span>}
                      {isSolved ? 'Rezolvată' : 'Marchează ca rezolvată'}
                    </button>
                  )}
                  {!user && (
                    <span className="text-gray-400 text-xs">(autentifică-te pentru progres)</span>
                  )}
                </div>
              )}
              
              {showVideo && typeof problem.youtube_url === 'string' && problem.youtube_url.trim() !== '' && (
                <div className="mt-8 animate-fade-in-up">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">📹 Rezolvarea video</h3>
                    <Suspense fallback={<VideoSkeleton />}>
                      <VideoPlayer
                        videoUrl={problem.youtube_url}
                        title="Rezolvare video"
                      />
                    </Suspense>
                    {/* Button "Marchează ca rezolvată" sub video */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                      {user && !loadingSolved && (
                        <button
                          onClick={handleMarkSolved}
                          disabled={isSolved}
                          className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg shadow-xl border-2 transition-all duration-200
                            ${isSolved ? 'bg-green-100 border-green-400 text-green-700 cursor-not-allowed' : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-500'}
                          `}
                          style={{ minWidth: 0 }}
                        >
                          {isSolved ? <span className="text-xl">✔️</span> : <span className="text-xl">☆</span>}
                          {isSolved ? 'Rezolvată' : 'Marchează ca rezolvată'}
                        </button>
                      )}
                      {!user && (
                        <span className="text-gray-400 text-xs">(autentifică-te pentru progres)</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />
      
      {/* Problems Sidebar */}
      <ProblemsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentProblemId={problem.id}
      />
      
      {/* Congratulation Modal */}
      {congratulationMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-up">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Felicitări!</h3>
            <p className="text-gray-600 mb-6">{congratulationMessage}</p>
            <button
              onClick={() => setCongratulationMessage(null)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Continuă
            </button>
          </div>
        </div>
      )}
      
      {/* Badge Notification */}
      {showBadgeNotification && newBadge && (
        <BadgeNotification
          badge={newBadge.badge}
          onClose={() => {
            setShowBadgeNotification(false);
            setNewBadge(null);
          }}
        />
      )}
    </div>
  )
} 