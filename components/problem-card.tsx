import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Problem } from "@/data/problems"
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import React from 'react';
import { PlayCircle } from "lucide-react";

interface ProblemCardProps {
  problem: Problem
  solved?: boolean
  showSolution?: boolean
}

// Array cu 10 iconițe variate pentru probleme
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
  // Folosim hash-ul ID-ului pentru a obține o iconiță consistentă
  let hash = 0;
  for (let i = 0; i < problemId.length; i++) {
    const char = problemId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % problemIcons.length;
  return problemIcons[index];
}

const categoryIcons = {
  Mecanică: "🚀",
  Termodinamică: "🔥",
  Electricitate: "⚡",
  Optică: "🌟",
}

const difficultyColors = {
  Ușor: "bg-green-100 text-green-700 border-green-300",
  Mediu: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Avansat: "bg-red-100 text-red-700 border-red-300",
}

export function ProblemCard({ problem, solved }: ProblemCardProps) {
  const problemIcon = getProblemIcon(problem.id);
  
  // Funcție pentru a trunchia numele capitolului pe mobil
  const truncateChapterName = (chapterName: string) => {
    // Pe mobil, trunchiază la 25 de caractere și adaugă "..."
    const mobileTruncated = chapterName.length > 25 ? chapterName.substring(0, 25) + "..." : chapterName;
    return mobileTruncated;
  };
  
  return (
    <Card className="h-full flex flex-col border-0 shadow-xl bg-gradient-to-br from-white/80 via-purple-50 to-pink-50 backdrop-blur-md glassmorphism hover:scale-[1.025] hover:shadow-2xl transition-transform duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl drop-shadow-lg">{problemIcon}</span>
          <Badge className={`border ${difficultyColors[problem.difficulty as keyof typeof difficultyColors] || "bg-gray-100 text-gray-700 border-gray-300"} font-semibold px-3 py-1 text-xs`}>{problem.difficulty}</Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 font-semibold px-3 py-1 text-xs">
            <span className="block md:hidden">{truncateChapterName(problem.category)}</span>
            <span className="hidden md:block">{problem.category}</span>
          </Badge>
          {typeof problem.youtube_url === 'string' && problem.youtube_url.trim() !== '' && (
            <PlayCircle className="w-5 h-5 text-red-500" title="Rezolvare video" />
          )}
          {solved && <span className="ml-2 text-green-600 text-xl" title="Rezolvat">✔️</span>}
          <span className="text-xs text-gray-400 ml-auto font-mono">{problem.id}</span>
        </div>
        <CardTitle className="text-xl font-bold text-gray-900 mb-1 line-clamp-2 drop-shadow-sm">
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
        </CardTitle>
        {problem.description && <div className="text-sm text-gray-700 mb-1 line-clamp-2 font-medium">
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
        </div>}
        {problem.tags && Array.isArray(problem.tags) && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {problem.tags.map((tag: string, idx: number) => (
              <span key={idx} className="px-2 py-0.5 bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 rounded-full text-xs font-semibold shadow-sm border border-purple-100">{tag.trim()}</span>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <Link href={`/probleme/${problem.id}`}>
          <span className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-center font-bold w-full shadow-md hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200">
            Vezi problema
          </span>
        </Link>
      </CardContent>
    </Card>
  )
}

// Glassmorphism utility (can be added in globals.css if not present)
// .glassmorphism {
//   background: rgba(255,255,255,0.7);
//   box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
//   backdrop-filter: blur(8px);
//   border-radius: 1rem;
//   border: 1px solid rgba(255,255,255,0.18);
// }
