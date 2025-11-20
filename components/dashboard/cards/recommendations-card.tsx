"use client"

import { Recommendation } from "@/lib/dashboard-data"
import { Button } from "@/components/ui/button"
import { BookOpen, Code, GraduationCap, Lightbulb, ArrowRight } from "lucide-react"
import Link from "next/link"

interface RecommendationsCardProps {
  recommendations: Recommendation[]
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="w-5 h-5 text-blue-400" />
      case 'problem':
        return <Code className="w-5 h-5 text-purple-400" />
      case 'course':
        return <GraduationCap className="w-5 h-5 text-green-400" />
      case 'topic':
        return <Lightbulb className="w-5 h-5 text-yellow-400" />
      default:
        return <Lightbulb className="w-5 h-5 text-gray-400" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'Lecție'
      case 'problem':
        return 'Problemă'
      case 'course':
        return 'Curs'
      case 'topic':
        return 'Subiect'
      default:
        return 'Recomandare'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'problem':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'course':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'topic':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 transform origin-center">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white/90">Recomandări Inteligente</h3>
      </div>

      <p className="text-sm text-white/60 mb-6">
        Personalizate pentru progresul tău
      </p>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg border border-white/5 hover:border-white/10 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-0.5">{getIcon(rec.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white/90 group-hover:text-white/100 transition-colors">
                      {rec.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${getTypeColor(rec.type)}`}
                    >
                      {getTypeLabel(rec.type)}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mb-2">{rec.description}</p>
                  {rec.reason && (
                    <p className="text-xs text-white/40 italic">💡 {rec.reason}</p>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <Link href={rec.target_url}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20 text-white/80 hover:text-white/100"
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.03] flex items-center justify-center">
            <Lightbulb className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-sm text-white/60 mb-2">No recommendations yet</p>
          <p className="text-xs text-white/40">Complete more activities to get personalized suggestions</p>
        </div>
      )}

      {/* AI Badge */}
      <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full border border-purple-500/20">
          <Lightbulb className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-white/70">Powered by AI</span>
        </div>
      </div>
    </div>
  )
}

