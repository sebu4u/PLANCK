'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { CatalogThemeSettingsDialog } from '@/components/catalog-theme-settings-dialog'

export function PhysicsCatalogHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      {/* Settings button - fixed top right, higher z-index to be above other elements */}
      <div className="fixed top-20 right-4 z-[500]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          className="bg-white shadow-lg border-gray-300 hover:bg-gray-50"
        >
          <Settings className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Setări Temă</span>
        </Button>
      </div>

      <CatalogThemeSettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </>
  )
}

