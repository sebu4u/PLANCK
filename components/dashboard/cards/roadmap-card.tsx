"use client"

import { RoadmapStep } from "@/lib/dashboard-data"
import { Check, Lock, Circle, Crown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import Link from "next/link"

interface RoadmapCardProps {
  steps: RoadmapStep[]
}

export function RoadmapCard({ steps }: RoadmapCardProps) {
  const { isFree } = useSubscriptionPlan()
  const getStepIcon = (step: RoadmapStep) => {
    if (step.is_completed) {
      return <Check className="w-5 h-5 text-green-400" />
    }
    if (step.is_locked) {
      return <Lock className="w-5 h-5 text-white/30" />
    }
    return <Circle className="w-5 h-5 text-blue-400" />
  }

  const getStepStyle = (step: RoadmapStep) => {
    if (step.is_completed) {
      return "bg-green-500/10 border-green-500/30"
    }
    if (step.is_locked) {
      return "bg-white/[0.02] border-white/10 opacity-60"
    }
    return "bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20"
  }

  const currentStepIndex = steps.findIndex(step => !step.is_completed && !step.is_locked)

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 transform origin-center relative overflow-hidden">
      <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
        Roadmap Personalizat
        {isFree && <Lock className="w-4 h-4 text-yellow-500" />}
      </h3>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const progressPercent = step.total_items > 0
            ? (step.completed_items / step.total_items) * 100
            : 0
          const isCurrentStep = index === currentStepIndex

          return (
            <div
              key={step.id}
              className={`p-4 rounded-lg border transition-all ${getStepStyle(step)} ${
                isCurrentStep ? 'shadow-lg shadow-blue-500/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="mt-0.5">{getStepIcon(step)}</div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                        {step.title}
                        {isCurrentStep && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                            Current
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">{step.description}</p>
                    </div>
                    <span className="text-xs text-white/50 whitespace-nowrap ml-2">
                      {step.completed_items}/{step.total_items}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {!step.is_locked && step.total_items > 0 && (
                    <div className="mt-2">
                      <Progress value={progressPercent} className="h-1.5 bg-white/5">
                        <div
                          className={`h-full transition-all rounded-full ${
                            step.is_completed
                              ? 'bg-green-400'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </Progress>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="mt-2">
                    <span className="text-xs px-2 py-1 bg-white/5 text-white/60 rounded-md">
                      {step.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-white/70">Overall Progress</p>
          <p className="text-sm font-semibold text-white/90">
            {steps.filter(s => s.is_completed).length}/{steps.length} completed
          </p>
        </div>
        <Progress
          value={(steps.filter(s => s.is_completed).length / steps.length) * 100}
          className="h-2 bg-white/5"
        >
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all rounded-full"
            style={{
              width: `${(steps.filter(s => s.is_completed).length / steps.length) * 100}%`,
            }}
          />
        </Progress>
      </div>

      {/* Locked Overlay for Free Users */}
      {isFree && (
        <div className="absolute inset-0 bg-[#131316]/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-yellow-500" />
          </div>
          <h4 className="text-lg font-bold text-white/90 mb-2 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Premium Feature
          </h4>
          <p className="text-sm text-white/60 mb-4 max-w-xs">
            Roadmap-ul personalizat este disponibil doar pentru utilizatorii Premium
          </p>
          <Link href="/insight">
            <button className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30">
              Vezi Planurile
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

