"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, FileQuestion, CheckCircle, Code } from "lucide-react"
import Link from "next/link"

export function AiAssistantCard() {
  const suggestions = [
    {
      icon: <MessageSquare className="w-4 h-4" />,
      text: "Explică-mi o noțiune",
      action: "/insight/chat?prompt=Explică-mi+o+noțiune",
    },
    {
      icon: <FileQuestion className="w-4 h-4" />,
      text: "Generează un quiz",
      action: "/insight/chat?prompt=Generează+un+quiz",
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      text: "Verifică-mi soluția",
      action: "/insight/chat?prompt=Verifică-mi+soluția",
    },
    {
      icon: <Code className="w-4 h-4" />,
      text: "Revizuiește-mi codul",
      action: "/insight/chat?prompt=Revizuiește-mi+codul",
    },
  ]

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6 hover:border-gray-300 transition-all hover:scale-105 transform origin-center relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 blur-3xl -z-0" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900">AI Assistant – Insight</h3>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Ai nevoie de ajutor? Insight este aici pentru tine 24/7
        </p>

        {/* Main CTA */}
        <Link href="/insight/chat">
          <Button className="w-full mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Ask Insight Anything
          </Button>
        </Link>

        {/* Suggestion Chips */}
        <div className="space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((suggestion, index) => (
              <Link key={index} href={suggestion.action}>
                <button className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-purple-500/30 transition-all text-left group">
                  <div className="flex items-center gap-2 text-gray-700 group-hover:text-gray-900 transition-colors">
                    {suggestion.icon}
                    <span className="text-xs font-medium">{suggestion.text}</span>
                  </div>
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-gray-900">47</p>
            <p className="text-xs text-gray-600">Questions Asked</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-gray-900">98%</p>
            <p className="text-xs text-gray-600">Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  )
}

