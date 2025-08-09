"use client"
import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Problem } from "@/data/problems"
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import React from 'react';
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"

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

export default function ProblemDetailClient({ problem, categoryIcons, difficultyColors }: {
  problem: Problem,
  categoryIcons: any,
  difficultyColors: any
}) {
  const [showVideo, setShowVideo] = useState(false)
  const [isSolved, setIsSolved] = useState(false)
  const [loadingSolved, setLoadingSolved] = useState(true)
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
    await supabase.from('solved_problems').insert({
      user_id: user.id,
      problem_id: problem.id,
      solved_at: new Date().toISOString(),
    });
    setIsSolved(true);
    setLoadingSolved(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 text-gray-900 relative overflow-hidden">
      
      <Navigation />
      <div className="pt-16 relative" style={{ zIndex: 2 }}>
        {/* Header */}
        <section className="py-12 px-4 bg-gradient-to-br from-white/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm border-b border-purple-100/50 shadow-lg">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <Link href="/probleme" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 hover:underline transition-colors duration-200 font-medium">
              <ArrowLeft className="w-4 h-4" /> Înapoi la catalog
            </Link>
            <div className="flex items-start gap-4">
              <div className="text-6xl drop-shadow-lg bg-white/50 rounded-2xl p-4 backdrop-blur-sm">
                {problemIcon}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
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
                <div className="flex gap-3 flex-wrap">
                  <Badge className={`${difficultyColors[problem.difficulty as keyof typeof difficultyColors] || ""} text-sm px-4 py-2`}>
                    {problem.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-4 py-2 bg-white/50 backdrop-blur-sm">
                    {problem.category}
                  </Badge>
                  <span className="text-sm text-gray-500 font-mono bg-white/30 px-3 py-2 rounded-lg backdrop-blur-sm">
                    #{problem.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Problem Statement & Video */}
        <section className="py-12 px-4 max-w-4xl mx-auto relative z-10">
          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">{problemIcon}</span>
                Enunțul problemei
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                <div className="bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <span className="font-semibold text-purple-700">Cod problemă:</span> {problem.id}
                </div>
                <div className="bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <span className="font-semibold text-purple-700">Data adăugării:</span> {problem.created_at ? new Date(problem.created_at).toLocaleDateString('ro-RO') : ''}
                </div>
              </div>
              {problem.description && (
                <div className="mt-4 p-4 bg-white/70 rounded-lg backdrop-blur-sm border-l-4 border-purple-400">
                  <div className="text-gray-700 font-medium">
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
                  </div>
                </div>
              )}
              {problem.tags && Array.isArray(problem.tags) && problem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {problem.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 rounded-full text-sm font-semibold shadow-sm border border-purple-100 backdrop-blur-sm">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
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
                    <img
                      src={problem.image_url}
                      alt="Ilustrație problemă"
                      className="rounded-lg max-w-full max-h-96 shadow-md border border-gray-200"
                    />
                  </div>
                )}
              </div>
              
              {!showVideo && (
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button
                    onClick={() => setShowVideo(true)}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-xl hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-300 text-lg transform hover:shadow-2xl"
                  >
                    🎥 Vezi rezolvarea video
                  </button>
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
              
              {showVideo && (
                <div className="mt-8 animate-fade-in-up">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">📹 Rezolvarea video</h3>
                    <div className="aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden shadow-2xl">
                      <iframe
                        width="100%"
                        height="100%"
                        src={problem.youtube_url.replace("watch?v=", "embed/")}
                        title="Rezolvare video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                      ></iframe>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />
    </div>
  )
} 