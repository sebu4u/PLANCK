'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { CatalogThemeSettingsDialog } from '@/components/catalog-theme-settings-dialog'

interface PhysicsProblemsHeaderProps {
  totalProblems: number
  freeProblems: number
}

export function PhysicsProblemsHeader({ totalProblems, freeProblems }: PhysicsProblemsHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)] relative">
        {/* Settings button - top right corner */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Setări</span>
          </Button>
        </div>

        <div className="flex flex-col gap-6 pr-20 sm:pr-24">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white/70">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/40">
                  Catalog
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold text-white">
                  Catalog de Probleme
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/50">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {freeProblems} gratuite
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-1.5">
                <span className="size-1.5 rounded-full bg-white/40" />
                {totalProblems} totale
              </span>
            </div>
          </div>
          <p className="max-w-2xl text-base text-white/60">
            Explorează enunțurile problemelor de fizică și selectează rapid ceea ce te interesează,
            filtrând după dificultate, clasă sau capitol.
          </p>
        </div>
      </div>

      <CatalogThemeSettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </>
  )
}

