'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useCatalogTheme } from '@/components/catalog-theme-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getAvailableThemes, ThemeId, getTheme } from '@/lib/catalog-themes'
import { Settings, Loader2, LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface CatalogThemeSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CatalogThemeSettingsDialog({
  open,
  onOpenChange,
}: CatalogThemeSettingsDialogProps) {
  const { user } = useAuth()
  const { theme, setTheme, isLoading: themeLoading } = useCatalogTheme()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const availableThemes = getAvailableThemes()

  const handleThemeSelect = async (themeId: ThemeId) => {
    if (!user) {
      toast({
        title: 'Autentificare necesară',
        description: 'Trebuie să fii autentificat pentru a schimba tema.',
        variant: 'destructive',
      })
      return
    }

    if (themeId === theme) {
      return // Already selected
    }

    setSaving(true)
    try {
      await setTheme(themeId)
      toast({
        title: 'Temă actualizată',
        description: `Tema a fost schimbată cu succes.`,
      })
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza tema. Te rugăm să încerci din nou.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setări Temă
            </DialogTitle>
            <DialogDescription>
              Pentru a personaliza tema catalogului, trebuie să fii autentificat.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <LogIn className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Autentifică-te pentru a accesa setările de temă
              </p>
              <Link href="/auth/login">
                <Button className="w-full">
                  Autentificare
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setări Temă Catalog
          </DialogTitle>
          <DialogDescription>
            Alege o temă personalizată pentru catalog. Tema va fi aplicată imediat pe ambele cataloage (fizică și informatică).
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {/* Default theme option */}
          <button
            onClick={() => handleThemeSelect('default')}
            disabled={saving || themeLoading}
            className={`
              relative rounded-lg border-2 p-4 text-left transition-all
              ${theme === 'default' 
                ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${saving || themeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Implicit</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Fundal standard (fără imagine)
                </p>
                <div className="h-24 rounded bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300" />
              </div>
              {theme === 'default' && (
                <div className="ml-2 flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Custom theme options */}
          {availableThemes.map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => handleThemeSelect(themeOption.id)}
              disabled={saving || themeLoading}
              className={`
                relative rounded-lg border-2 p-4 text-left transition-all overflow-hidden
                ${theme === themeOption.id 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${saving || themeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{themeOption.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {themeOption.description}
                  </p>
                  <div 
                    className="h-24 rounded border border-gray-300 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: themeOption.images.physics.desktop 
                        ? `url(${themeOption.images.physics.desktop})` 
                        : 'linear-gradient(to bottom right, #e0e0e0, #f5f5f5)',
                    }}
                  />
                </div>
                {theme === themeOption.id && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  </div>
                )}
              </div>
              {(saving || themeLoading) && theme === themeOption.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>

        {saving && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Se salvează tema...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

