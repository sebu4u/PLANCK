'use client'

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PlanckCodeSidebar } from "@/components/planckcode-sidebar"
import { Button } from "@/components/ui/button"
import { PlanckCodeContentWrapper } from "@/components/planckcode-content-wrapper"
import { useState } from "react"
import Link from "next/link"

const roadmapItems = [
  {
    title: "Foundations",
    description:
      "Înveți bazele C++: variabile, input/output, condiții, loop-uri — fundația tuturor soluțiilor.",
    xPercent: 10,
  },
  {
    title: "Data Structures",
    description:
      "Te familiarizezi cu arrays, vectors, strings și structuri STL esențiale.",
    xPercent: 30,
  },
  {
    title: "Problem Solving",
    description:
      "Aplici conceptele în probleme reale: greedy, sortări, gândire algoritmică de bază.",
    xPercent: 50,
  },
  {
    title: "Algorithms & Recursion",
    description:
      "Intră în logica recursivă, backtracking și tehnicile care te pregătesc pentru probleme mai complexe.",
    xPercent: 70,
  },
  {
    title: "Advanced Applications",
    description:
      "Abordezi grafuri, DP, optimizări și strategii folosite în competiții și proiecte serioase.",
    xPercent: 90,
  },
]

const chapters = [
  {
    title: 'Introduction to Programming',
    description: 'Înveți bazele programării: variabile, tipuri de date, input/output și structuri de control.',
    difficulty: 'Începător',
    duration: '4h',
    lessons: 8,
    available: false,
  },
  {
    title: 'Data Structures',
    description: 'Arrays, vectors, strings, stacks, queues și alte structuri fundamentale din STL.',
    difficulty: 'Mediu',
    duration: '6h',
    lessons: 12,
    available: false,
  },
  {
    title: 'Algorithms',
    description: 'Sortări, căutări, algoritmi greedy și tehnici de optimizare pentru probleme competitive.',
    difficulty: 'Mediu',
    duration: '8h',
    lessons: 15,
    available: false,
  },
  {
    title: 'Problem Solving',
    description: 'Strategii de rezolvare, analiză de complexitate și abordări practice pentru probleme reale.',
    difficulty: 'Avansat',
    duration: '10h',
    lessons: 18,
    available: false,
  },
  {
    title: 'Competitive Programming Essentials',
    description: 'Tactici pentru concursuri, optimizări, pattern-uri comune și pregătire pentru olimpiade.',
    difficulty: 'Avansat',
    duration: '12h',
    lessons: 20,
    available: false,
  },
]

export default function LearnPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <Navigation />
      <PlanckCodeSidebar />

      <PlanckCodeContentWrapper className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Two Column Layout: Roadmap Left, Chapters Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Roadmap */}
            <div className="w-full">
              <div className="text-center lg:text-left space-y-6 mb-12">
                <p className="scroll-animate-fade-up font-vt323 text-4xl sm:text-5xl md:text-6xl font-bold">
                  Your Path to Mastering <span className="italic">C++</span>
                </p>
                <p className="scroll-animate-fade-up animate-delay-200 font-vt323 text-xl sm:text-2xl text-gray-300">
                  Un traseu construit ca să-ți dezvolți skill-urile pas cu pas, cu lecții care chiar contează în problemele reale.
                </p>
                <p className="scroll-animate-fade-up animate-delay-400 font-vt323 text-base sm:text-lg text-gray-400">
                  Selectezi un nivel, înveți conceptul, îl aplici în IDE, apoi treci la următoarea etapă. Un flux simplu, practic și fără pierderi de timp.
                </p>
              </div>

              <div className="mt-8 scroll-animate-fade-up animate-delay-600">
                <div className="relative w-full h-60">
                  <svg viewBox="0 0 800 100" className="w-full h-full text-white/30" aria-hidden="true">
                    <line
                      x1="40"
                      y1="50"
                      x2="760"
                      y2="50"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>

                  {roadmapItems.map((item, index) => {
                    const isActive = activeIndex === index
                    const leftPercent = item.xPercent
                    const isLabelTop = index % 2 === 0
                    const delayClass = index === 0 ? '' : index === 1 ? 'animate-delay-100' : index === 2 ? 'animate-delay-200' : index === 3 ? 'animate-delay-300' : 'animate-delay-400';
                    return (
                      <div
                        key={item.title}
                        className={`absolute group cursor-pointer scroll-animate-scale ${delayClass}`}
                        style={{
                          left: `${leftPercent}%`,
                          top: '50%',
                          transform: "translate(-50%, -50%)",
                        }}
                        onClick={() => handleToggle(index)}
                      >
                        {/* Label deasupra */}
                        {isLabelTop && (
                          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex flex-col items-center font-vt323 text-sm sm:text-base text-gray-300 gap-1">
                            <span className="whitespace-nowrap">{item.title}</span>
                            <span className="text-lg leading-none text-gray-500 transform rotate-90">&gt;</span>
                          </div>
                        )}

                        {/* Tooltip description */}
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 ${isLabelTop ? 'top-full mt-8' : 'bottom-full mb-8'} w-80 max-w-[90vw] rounded-xl border border-white/10 bg-[#141414]/90 px-4 py-3 text-center text-sm text-gray-100 font-vt323 shadow-[0_15px_45px_rgba(0,0,0,0.45)] transition-all duration-200 ease-out pointer-events-none opacity-0 translate-y-2 scale-95 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:scale-100 ${
                            isActive ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : ""
                          }`}
                        >
                          {item.description}
                          <span className={`absolute left-1/2 ${isLabelTop ? 'top-[-6px]' : 'bottom-[-6px]'} h-3 w-3 -translate-x-1/2 rotate-45 bg-[#141414]/90`} />
                        </div>

                        {/* Punct pe linie */}
                        <div className="relative flex items-center justify-center">
                          <span
                            className={`h-4 w-4 rounded-full transition-all duration-200 ease-out ${
                              isActive ? "bg-white" : "bg-gray-400"
                            } md:group-hover:bg-white`}
                          />
                          <span
                            className={`absolute h-6 w-6 rounded-full border transition-all duration-200 ease-out ${
                              isActive ? "border-white" : "border-gray-500"
                            } md:group-hover:border-white`}
                          />
                        </div>

                        {/* Label dedesubt */}
                        {!isLabelTop && (
                          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 flex flex-col items-center font-vt323 text-sm sm:text-base text-gray-300 gap-1">
                            <span className="text-lg leading-none text-gray-500 transform -rotate-90">&gt;</span>
                            <span className="whitespace-nowrap">{item.title}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: Chapters Cards */}
            <div className="w-full space-y-6">
              <div className="text-center lg:text-left space-y-4 mb-8">
                <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                  Course Chapters
                </h2>
                <p className="font-vt323 text-lg sm:text-xl text-gray-400">
                  Explore structured chapters designed to build your skills step by step.
                </p>
              </div>

              <div className="relative">
                <div className="space-y-4 overflow-hidden" style={{ maxHeight: '580px' }}>
                  {chapters.slice(0, 3).map((chapter, index) => (
                    <div
                      key={chapter.title}
                      className="border border-white/20 rounded-2xl p-6 bg-transparent transition-all duration-300 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] scroll-animate-scale"
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-vt323">
                              {chapter.difficulty}
                            </p>
                            {!chapter.available && (
                              <span className="text-xs px-2 py-1 rounded bg-gray-800/50 border border-gray-700/50 text-gray-400 font-vt323">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl text-white font-vt323 font-medium mb-3">
                            {chapter.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed font-vt323 mb-4">
                        {chapter.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 font-vt323">
                        <span>{chapter.duration}</span>
                        <span>•</span>
                        <span>{chapter.lessons} lessons</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Fade gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="pt-16 space-y-6 text-center">
            <div className="space-y-4">
              <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                Start learning while you wait
              </h2>
              <p className="font-vt323 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
                Solve problems, track your progress, and compete on the leaderboard.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/planckcode/problems">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-gray-200 transition-all duration-300 font-vt323 text-xl px-8 py-6 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                >
                  Explore Problems
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PlanckCodeContentWrapper>

      <PlanckCodeContentWrapper className="bg-black py-16" innerClassName="max-w-none">
        <Footer backgroundColor="bg-black" />
      </PlanckCodeContentWrapper>
    </div>
  )
}
