"use client"

import { ContinueLearningItem } from "@/lib/dashboard-data"
import { Button } from "@/components/ui/button"
import { BookOpen, Code, Pencil, ArrowRight } from "lucide-react"
import Link from "next/link"

interface ContinueLearningCardProps {
  items: ContinueLearningItem[]
}

export function ContinueLearningCard({ items }: ContinueLearningCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="w-5 h-5 text-blue-400" />
      case 'problem':
        return <Code className="w-5 h-5 text-purple-400" />
      case 'sketch':
        return <Pencil className="w-5 h-5 text-green-400" />
      default:
        return <BookOpen className="w-5 h-5 text-gray-400" />
    }
  }

  const mainItem = items[0]

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-4 hover:border-white/20 transition-all hover:scale-105 transform origin-center">
      <h3 className="text-lg font-semibold text-white/90 mb-3">Continue Learning</h3>

      {/* Main Continue Item */}
      {mainItem && (
        <div className="mb-4 p-3 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-start gap-3 mb-2">
            <div className="mt-1">{getIcon(mainItem.type)}</div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-white/90 mb-0.5">{mainItem.title}</h4>
              <p className="text-sm text-white/60">{mainItem.description}</p>
            </div>
          </div>
          <Link href={mainItem.url}>
            <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
              Continue Learning
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      {/* Other Items */}
      <div className="space-y-2">
        {items.slice(1).map((item, index) => (
          <Link key={index} href={item.url}>
            <div className="flex items-center gap-3 p-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer group">
              {getIcon(item.type)}
              <div className="flex-1">
                <p className="text-sm font-medium text-white/85 group-hover:text-white/100 transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-white/50">{item.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

