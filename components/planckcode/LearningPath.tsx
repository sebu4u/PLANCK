"use client"

import { useState } from "react"

type RoadmapItem = {
  title: string
  description: string
  xPercent: number
}

const roadmapItems: RoadmapItem[] = [
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

export function LearningPathSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="w-full mt-32 mb-24 px-6 md:px-16">
      <div className="max-w-5xl mx-auto text-center space-y-6">
        <p className="scroll-animate-fade-up font-vt323 text-4xl sm:text-5xl md:text-6xl font-bold">
          Your Path to Mastering <span className="italic">C++</span>
        </p>
        <p className="scroll-animate-fade-up animate-delay-200 font-vt323 text-xl sm:text-2xl text-gray-300">
          Un traseu construit ca să-ți dezvolți skill-urile pas cu pas, cu lecții care chiar contează în problemele reale.
        </p>
        <p className="scroll-animate-fade-up animate-delay-400 font-vt323 text-base sm:text-lg text-gray-400 max-w-3xl mx-auto">
          Selectezi un nivel, înveți conceptul, îl aplici în IDE, apoi treci la următoarea etapă. Un flux simplu, practic și fără pierderi de timp.
        </p>
      </div>

      <div className="mt-16 scroll-animate-fade-up animate-delay-600">
        <div className="relative w-full max-w-5xl mx-auto h-60">
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
    </section>
  )
}

