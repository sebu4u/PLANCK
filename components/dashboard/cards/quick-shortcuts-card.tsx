"use client"

import { Search, Code, Pencil, BookOpen, Star, Sparkles, Users, MessageCircle } from "lucide-react"
import Link from "next/link"

export function QuickShortcutsCard() {
  const shortcuts = [
    {
      icon: <Search className="w-5 h-5" />,
      label: "Search Problems",
      url: "/probleme",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
    },
    {
      icon: <Code className="w-5 h-5" />,
      label: "Planck Code",
      url: "/planckcode",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
    },
    {
      icon: <Pencil className="w-5 h-5" />,
      label: "Sketch",
      url: "/sketch/new",
      color: "text-green-400",
      bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: "Lessons",
      url: "/cursuri",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20",
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: "Saved Problems",
      url: "/probleme?saved=true",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      label: "Ask Insight",
      url: "/insight/chat",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Clasa Mea",
      url: "/clasa",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20",
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Community",
      url: "/community",
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20",
    },
  ]

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-all">
      <h3 className="text-lg font-semibold text-white/90 mb-4">Quick Shortcuts</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {shortcuts.map((shortcut, index) => (
          <Link key={index} href={shortcut.url}>
            <button
              className={`w-full p-4 rounded-lg border transition-all group ${shortcut.bgColor}`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`${shortcut.color} group-hover:scale-110 transition-transform`}>
                  {shortcut.icon}
                </div>
                <span className="text-xs font-medium text-white/80 group-hover:text-white/100 transition-colors text-center">
                  {shortcut.label}
                </span>
              </div>
            </button>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-lg font-bold text-white/90">127</p>
          <p className="text-xs text-white/60">Total Actions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white/90">15</p>
          <p className="text-xs text-white/60">This Week</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white/90">
            <Pencil className="w-5 h-5 inline text-green-400" />
          </p>
          <p className="text-xs text-white/60">Most Used</p>
        </div>
      </div>
    </div>
  )
}

