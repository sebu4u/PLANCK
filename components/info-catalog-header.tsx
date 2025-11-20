'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { CatalogThemeSettingsDialog } from '@/components/catalog-theme-settings-dialog'

interface InfoCatalogHeaderProps {
  totalProblems: number
  pageSize: number
}

export function InfoCatalogHeader({ totalProblems, pageSize }: InfoCatalogHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <header className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)] sm:px-8 relative">
        {/* Settings button - top right */}
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

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 pr-20 sm:pr-24">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/40">
              Informatică
            </p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Catalog de Probleme de Informatică
            </h1>
            <p className="max-w-2xl text-base text-white/65">
              Antrenează-te pentru olimpiade și concursuri: probleme structurate pe clase,
              capitole și niveluri de dificultate, pregătite pentru evaluare automată cu Judge0
              direct în PlanckCode.
            </p>
          </div>
          <div className="grid gap-3 text-xs uppercase tracking-[0.24em] text-white/50 sm:grid-cols-2">
            <span className="inline-flex flex-col rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-center">
              <span className="text-2xl font-semibold text-white">{totalProblems}</span>
              <span className="mt-1 text-[0.65rem]">Probleme active</span>
            </span>
            <span className="inline-flex flex-col rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-center">
              <span className="text-2xl font-semibold text-white">{pageSize}</span>
              <span className="mt-1 text-[0.65rem]">Pe pagină</span>
            </span>
          </div>
        </div>
      </header>

      <CatalogThemeSettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </>
  )
}

