'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Paintbrush, Type, X } from 'lucide-react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

export type PlanckCodeThemeId = 'planck-dark' | 'planck-nebula' | 'planck-classic'
export type PlanckCodeFontId = 'jetbrains-mono' | 'fira-code' | 'source-code'

export type PlanckCodeThemeOption = {
  id: PlanckCodeThemeId
  label: string
  description?: string
  previewClass: string
}

export type PlanckCodeFontOption = {
  id: PlanckCodeFontId
  label: string
  stack: string
}

const THEME_OPTIONS: PlanckCodeThemeOption[] = [
  {
    id: 'planck-dark',
    label: 'Planck Dark',
    description: 'Contrast ridicat cu accente verde neon',
    previewClass: 'bg-gradient-to-br from-[#050505] via-[#11291a] to-[#0f172a]',
  },
  {
    id: 'planck-nebula',
    label: 'Nebula',
    description: 'Tonuri violet-albastre inspirate de spațiu',
    previewClass: 'bg-gradient-to-br from-[#171434] via-[#2e1c4d] to-[#43266a]',
  },
  {
    id: 'planck-classic',
    label: 'Classic',
    description: 'Stilul clasic Monaco cu contrast moderat',
    previewClass: 'bg-gradient-to-br from-[#1c1c1c] via-[#2a2a2a] to-[#303030]',
  },
]

const FONT_OPTIONS: PlanckCodeFontOption[] = [
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    stack: '"JetBrains Mono", "Fira Code", Menlo, monospace',
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    stack: '"Fira Code", "JetBrains Mono", Consolas, monospace',
  },
  {
    id: 'source-code',
    label: 'Source Code Pro',
    stack: '"Source Code Pro", "Fira Code", Menlo, monospace',
  },
]

const FONT_SIZES = [12, 14, 16, 18, 20]

type PlanckCodeSettings = {
  theme: PlanckCodeThemeId
  font: PlanckCodeFontId
  fontSize: number
}

type PlanckCodeSettingsContextValue = {
  settings: PlanckCodeSettings
  setTheme: (theme: PlanckCodeThemeId) => void
  setFont: (font: PlanckCodeFontId) => void
  setFontSize: (size: number) => void
  themes: PlanckCodeThemeOption[]
  fonts: PlanckCodeFontOption[]
  fontSizes: number[]
  modalOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const STORAGE_KEY = 'planckcode.ide.settings'

const DEFAULT_SETTINGS: PlanckCodeSettings = {
  theme: 'planck-classic',
  font: 'jetbrains-mono',
  fontSize: 14,
}

const PlanckCodeSettingsContext = createContext<PlanckCodeSettingsContextValue | null>(null)

function isValidTheme(value: unknown): value is PlanckCodeThemeId {
  return typeof value === 'string' && THEME_OPTIONS.some((option) => option.id === value)
}

function isValidFont(value: unknown): value is PlanckCodeFontId {
  return typeof value === 'string' && FONT_OPTIONS.some((option) => option.id === value)
}

function isValidFontSize(value: unknown): value is number {
  return typeof value === 'number' && FONT_SIZES.includes(value)
}

function sanitizeSettings(candidate: unknown): PlanckCodeSettings {
  if (!candidate || typeof candidate !== 'object') {
    return DEFAULT_SETTINGS
  }

  const record = candidate as Partial<Record<keyof PlanckCodeSettings, unknown>>

  return {
    theme: isValidTheme(record.theme) ? record.theme : DEFAULT_SETTINGS.theme,
    font: isValidFont(record.font) ? record.font : DEFAULT_SETTINGS.font,
    fontSize: isValidFontSize(record.fontSize) ? record.fontSize : DEFAULT_SETTINGS.fontSize,
  }
}

export function PlanckCodeSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlanckCodeSettings>(DEFAULT_SETTINGS)
  const [isHydrated, setIsHydrated] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings(sanitizeSettings(parsed))
      }
    } catch (error) {
      console.warn('[PlanckCodeSettings] Failed to read settings from localStorage', error)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('[PlanckCodeSettings] Failed to persist settings to localStorage', error)
    }
  }, [settings, isHydrated])

  const value = useMemo<PlanckCodeSettingsContextValue>(
    () => ({
      settings,
      setTheme: (theme) => setSettings((prev) => ({ ...prev, theme })),
      setFont: (font) => setSettings((prev) => ({ ...prev, font })),
      setFontSize: (fontSize) => setSettings((prev) => ({ ...prev, fontSize })),
      themes: THEME_OPTIONS,
      fonts: FONT_OPTIONS,
      fontSizes: FONT_SIZES,
      modalOpen,
      openModal: () => setModalOpen(true),
      closeModal: () => setModalOpen(false),
    }),
    [settings, modalOpen]
  )

  return (
    <PlanckCodeSettingsContext.Provider value={value}>
      {children}
      <PlanckCodeSettingsModal
        open={modalOpen}
        onClose={value.closeModal}
        settings={settings}
        setTheme={value.setTheme}
        setFont={value.setFont}
        setFontSize={value.setFontSize}
        themes={THEME_OPTIONS}
        fonts={FONT_OPTIONS}
        fontSizes={FONT_SIZES}
      />
    </PlanckCodeSettingsContext.Provider>
  )
}

type PlanckCodeSettingsModalProps = {
  open: boolean
  onClose: () => void
  settings: PlanckCodeSettings
  setTheme: (theme: PlanckCodeThemeId) => void
  setFont: (font: PlanckCodeFontId) => void
  setFontSize: (size: number) => void
  themes: PlanckCodeThemeOption[]
  fonts: PlanckCodeFontOption[]
  fontSizes: number[]
}

function PlanckCodeSettingsModal({
  open,
  onClose,
  settings,
  setTheme,
  setFont,
  setFontSize,
  themes,
  fonts,
  fontSizes,
}: PlanckCodeSettingsModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/70">
      <div
        className="absolute inset-0"
        role="presentation"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 rounded-xl border border-white/10 bg-[#1b1b1d] shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
        style={{ width: 'min(420px, 90vw, 90vh)', height: 'min(420px, 90vw, 90vh)' }}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Personalizează PlanckCode</h2>
              <p className="mt-1 text-xs text-gray-400">
                Ajustează rapid tema și fonturile pentru editorul tău.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 p-2 text-gray-400 transition hover:border-white/20 hover:text-white"
              aria-label="Închide setările IDE"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <section>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              <Paintbrush className="h-4 w-4 text-emerald-400" />
              Temă
            </div>
            <div className="mt-3 grid gap-2">
              {themes.map((theme) => {
                const isActive = settings.theme === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`flex items-center gap-2 rounded-lg border border-transparent bg-white/[0.03] px-3 py-2 text-left transition hover:border-emerald-400/50 hover:bg-white/[0.06] ${
                      isActive ? 'border-emerald-400/70 bg-emerald-400/10' : ''
                    }`}
                    aria-pressed={isActive}
                    type="button"
                  >
                    <div
                      className={`h-10 w-14 flex-shrink-0 overflow-hidden rounded-md border border-white/10 ${theme.previewClass}`}
                    />
                    <div>
                      <div className="text-sm font-semibold text-white">{theme.label}</div>
                      {theme.description && (
                        <p className="text-[11px] text-gray-400">{theme.description}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

            <Separator className="border-t border-white/10" />

            <section>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                <Type className="h-4 w-4 text-sky-400" />
                Font
              </div>
              <div className="mt-3 grid gap-2">
                {fonts.map((font) => {
                  const isActive = settings.font === font.id
                  return (
                    <button
                      key={font.id}
                      onClick={() => setFont(font.id)}
                      className={`flex items-center justify-between rounded-lg border border-transparent bg-white/[0.03] px-3 py-2 transition hover:border-sky-400/50 hover:bg-white/[0.07] ${
                        isActive ? 'border-sky-400/70 bg-sky-400/10' : ''
                      }`}
                      aria-pressed={isActive}
                      type="button"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{font.label}</div>
                        <p
                          className="text-[11px] text-gray-400"
                          style={{ fontFamily: font.stack }}
                        >
                          #include &lt;iostream&gt; — int main() {'{ return 0; }'}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">
                        {font.id.replace('-', ' ')}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                Dimensiune Font
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {fontSizes.map((size) => {
                  const isActive = settings.fontSize === size
                  return (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`rounded-md border border-transparent px-3 py-1.5 text-sm transition hover:border-white/40 hover:bg-white/10 ${
                        isActive
                          ? 'border-white/70 bg-white/15 text-white'
                          : 'text-gray-300'
                      }`}
                      aria-pressed={isActive}
                      type="button"
                    >
                      {size}px
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-gray-300 hover:border-white/40 hover:bg-white/10"
              onClick={onClose}
              type="button"
            >
              Închide
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function usePlanckCodeSettings() {
  const context = useContext(PlanckCodeSettingsContext)

  if (!context) {
    throw new Error('usePlanckCodeSettings must be used within PlanckCodeSettingsProvider')
  }

  return context
}

export function getFontStack(fontId: PlanckCodeFontId) {
  return FONT_OPTIONS.find((option) => option.id === fontId)?.stack ?? FONT_OPTIONS[0].stack
}

export function getThemeOption(themeId: PlanckCodeThemeId) {
  return THEME_OPTIONS.find((option) => option.id === themeId) ?? THEME_OPTIONS[0]
}

