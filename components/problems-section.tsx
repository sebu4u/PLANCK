import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Eye, Atom } from "lucide-react"
import Link from "next/link"
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import React from 'react';

const problemCategories = [
  {
    title: "Mecanică",
    count: 156,
    difficulty: "Mediu",
    description: "Probleme de cinematică, dinamică și energie",
    icon: "🚀",
  },
  {
    title: "Termodinamică",
    count: 89,
    difficulty: "Avansat",
    description: "Procese termodinamice și teoria cinetică",
    icon: "🔥",
  },
  {
    title: "Electricitate",
    count: 134,
    difficulty: "Mediu",
    description: "Electrostatică și curent electric",
    icon: "⚡",
  },
  {
    title: "Optică",
    count: 67,
    difficulty: "Ușor",
    description: "Optica geometrică și ondulatorie",
    icon: "🌟",
  },
]

const recentProblems = [
  {
    id: 1,
    title: "Mișcarea uniformă accelerată",
    category: "Mecanică",
    difficulty: "Mediu",
    hasAccess: false,
  },
  {
    id: 2,
    title: "Legea lui Ohm în circuite",
    category: "Electricitate",
    difficulty: "Ușor",
    hasAccess: false,
  },
  {
    id: 3,
    title: "Reflexia și refracția luminii",
    category: "Optică",
    difficulty: "Mediu",
    hasAccess: false,
  },
]

export function ProblemsSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 max-w-7xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center mb-12 sm:mb-16 animate-fade-in-up">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Catalog de Probleme
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
          Peste 400 de probleme organizate pe categorii cu rezolvări detaliate
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {problemCategories.map((category, index) => (
          <Card
            key={index}
            className="bg-white border-purple-200 hover:border-purple-400 transition-all duration-300 space-card"
          >
            <CardHeader className="text-center p-4 sm:p-6">
              <div className="text-3xl mb-2">{category.icon}</div>
              <CardTitle className="text-gray-900 text-lg sm:text-xl">{category.title}</CardTitle>
              <CardDescription className="text-gray-600 text-sm">{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {category.count}
              </div>
              <Badge
                variant="outline"
                className={`text-xs sm:text-sm
                  ${category.difficulty === "Ușor" ? "border-green-500 text-green-600" : ""}
                  ${category.difficulty === "Mediu" ? "border-yellow-500 text-yellow-600" : ""}
                  ${category.difficulty === "Avansat" ? "border-red-500 text-red-600" : ""}
                `}
              >
                {category.difficulty}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <Atom className="w-6 h-6 text-purple-600" />
            Probleme Recente
          </h3>
          <div className="space-y-4">
            {recentProblems.map((problem) => (
              <Card
                key={problem.id}
                className="bg-white border-purple-200 hover:border-purple-400 transition-all duration-300 space-card"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-gray-900 font-medium mb-1 text-sm sm:text-base">
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
                      </h4>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span>{problem.category}</span>
                        <span>•</span>
                        <Badge variant="outline">
                          {problem.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-300 hover:border-purple-500 hover:text-purple-600 text-xs sm:text-sm"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Vezi
                      </Button>
                      <Button size="sm" variant="ghost" disabled className="text-gray-500 text-xs sm:text-sm">
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Rezolvare
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 sm:p-8 rounded-lg border border-purple-200 cosmic-glow">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">🚀 Acces Complet la Rezolvări</h3>
          <p className="text-gray-700 mb-6 text-sm sm:text-base">
            Obține acces la toate rezolvările detaliate, explicații pas cu pas și sfaturi pentru rezolvarea problemelor.
          </p>
          <ul className="space-y-2 mb-6 text-gray-700 text-sm sm:text-base">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex-shrink-0"></div>
              Rezolvări detaliate pentru toate problemele
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex-shrink-0"></div>
              Explicații pas cu pas
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex-shrink-0"></div>
              Sfaturi și trucuri de rezolvare
            </li>
          </ul>
          <Link href="/abonament">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 cosmic-glow h-12">
              🌟 Începe Abonamentul
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
