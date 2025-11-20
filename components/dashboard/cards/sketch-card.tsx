"use client"

import { RecentSketch, formatRelativeTime } from "@/lib/dashboard-data"
import { Button } from "@/components/ui/button"
import { Pencil, Clock, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { BoardPreview } from "@/components/sketch/BoardPreview"

interface SketchCardProps {
  sketches: RecentSketch[]
}

export function SketchCard({ sketches }: SketchCardProps) {
  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 transform origin-center">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white/90">Planck Sketch</h3>
        <Pencil className="w-5 h-5 text-green-400" />
      </div>

      {sketches.length > 0 ? (
        <>
          {/* CTA to Open Sketch */}
          <Link href="/sketch/new">
            <Button className="w-full mb-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
              <Pencil className="w-4 h-4 mr-2" />
              Open Sketch
            </Button>
          </Link>

          {/* Recent Boards - Grid with 2 small preview cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {sketches.slice(0, 2).map((sketch) => (
              <Link key={sketch.id} href={`/sketch/board/${sketch.id}`}>
                <div className="group relative bg-white/10 backdrop-blur-md border border-white/15 rounded-lg overflow-hidden cursor-pointer hover:border-white/25 hover:bg-white/15 transition-all duration-300 shadow-lg">
                  {/* Preview Area */}
                  <div className="aspect-video w-full bg-black/30 relative overflow-hidden">
                    <BoardPreview boardId={sketch.id} className="absolute inset-0" />
                    
                    {/* Name Overlay at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {sketch.name}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Access to All Boards */}
          <Link href="/sketch/boards">
            <Button variant="ghost" className="w-full mt-2 text-white/60 hover:text-white/90 hover:bg-white/[0.03]">
              View All Boards
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.03] flex items-center justify-center">
            <Pencil className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-sm text-white/60 mb-4">Nu ai table create încă</p>
          <Link href="/sketch/new">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create your first board
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

