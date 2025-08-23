import { Video, Puzzle, Trophy, Smartphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const benefits = [
  {
    icon: Video,
    title: "Cursuri video premium",
    description: "Explicații clare și structurate, realizate de olimpici la fizică. Înveți exact ce trebuie, fără să pierzi timp.",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    borderColor: "border-blue-200"
  },
  {
    icon: Puzzle,
    title: "Probleme cu rezolvări pas cu pas",
    description: "Exerciții organizate pe niveluri, fiecare cu explicații logice și sfaturi practice.",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
    borderColor: "border-purple-200"
  },
  {
    icon: Trophy,
    title: "Gamification care te motivează",
    description: "Primești puncte, badge-uri și urmărești progresul tău. Înveți cu plăcere, ca într-un joc.",
    gradient: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 to-orange-50",
    borderColor: "border-yellow-200"
  },
  {
    icon: Smartphone,
    title: "Acces oricând, oriunde",
    description: "Tot conținutul la dispoziție, pe telefon sau calculator, când vrei tu.",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
    borderColor: "border-green-200"
  }
]

export function BenefitsSection() {
  return (
    <section className="py-12 px-4 bg-gradient-to-br from-white to-purple-50/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Moving stars */}
        <div className="absolute top-10 left-20 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
        <div
          className="absolute top-32 right-32 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-40 w-1 h-1 bg-purple-300 rounded-full opacity-70 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-60 right-60 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-40 animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>

        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-300 rounded-full opacity-40 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-3 h-3 bg-pink-300 rounded-full opacity-30 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-50 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Geometric shapes */}
        <div
          className="absolute top-20 left-1/4 w-16 h-16 border border-purple-200 rounded-lg opacity-20 rotate-12 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/4 w-12 h-12 border border-pink-200 rounded-full opacity-25 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-purple-600 mb-4 cosmic-text-glow">
            De ce să alegi PLANCK?
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Fizica nu trebuie să fie complicată. Cu PLANCK, înveți mai simplu și mai eficient.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mt-4 animate-expand"></div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon
            return (
              <Card
                key={index}
                className={`bg-gradient-to-br ${benefit.bgGradient} ${benefit.borderColor} hover:border-purple-400 transition-all duration-300 space-card animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4 md:p-6 text-center">
                  {/* Icon */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${benefit.gradient} rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 cosmic-glow shadow-lg`}>
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 leading-tight">
                    {benefit.title}
                  </h3>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
