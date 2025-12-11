"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Check, Filter, MousePointerClick, Search, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "problems-catalog-guide-dismissed-v1"

type GuideStep = {
  id: string
  title: string
  description: string
  bullets: string[]
  accent?: "filters" | "search" | "open"
}

interface ProblemsGuestGuideProps {
  isMobile: boolean
  onOpenFilters?: () => void
}

type CardPosition = {
  top?: number
  left?: number
  right?: number
  bottom?: number
  transform?: string
}

export function ProblemsGuestGuide({ isMobile, onOpenFilters }: ProblemsGuestGuideProps) {
  const { user, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [cardPosition, setCardPosition] = useState<CardPosition>({})
  const cardRef = useRef<HTMLDivElement>(null)

  const stepTargets: Record<string, string[]> = {
    filtre: ["catalog-filters-panel", "catalog-filters-mobile", "guide-mobile-filters-button", "guide-filters-panel-body"],
    "clasa-capitol": ["catalog-filters-panel", "guide-filters-panel-body", "guide-class-select", "guide-chapter-select"],
    dificultate: ["catalog-filters-panel", "guide-filters-panel-body", "guide-difficulty"],
    cautare: ["catalog-filters-panel", "guide-filters-panel-body", "guide-search-input"],
    deschide: ["guide-problems-grid"],
  }

  const steps = useMemo<GuideStep[]>(() => [
    {
      id: "filtre",
      title: "Deschide filtrele",
      description: "Folosește panoul de filtre pentru a restrânge catalogul.",
      bullets: [
        "Apasă butonul „Filtre” (dreapta sus pe mobil) sau panoul din stânga pe desktop.",
        "Dacă vrei, îți deschidem noi filtrarea: butonul de mai jos."
      ],
      accent: "filters"
    },
    {
      id: "clasa-capitol",
      title: "Alege clasa și capitolul",
      description: "Selectează materia exactă pe care vrei să o vezi.",
      bullets: [
        "În dropdown-ul „Clasa” alege nivelul (ex. „a 10-a”).",
        "După ce selectezi clasa, deschide „Capitol” și alege tema potrivită."
      ],
      accent: "filters"
    },
    {
      id: "dificultate",
      title: "Setează dificultatea",
      description: "Păstrează doar problemele potrivite nivelului tău.",
      bullets: [
        "Apasă butoanele „Ușor”, „Mediu” sau „Avansat” din secțiunea Dificultate.",
        "Poți combina cu progresul „Rezolvate/Nerezolvate” dacă vrei să eviți repetările."
      ],
      accent: "filters"
    },
    {
      id: "cautare",
      title: "Caută rapid",
      description: "Găsești instant o problemă după cod sau cuvinte din enunț.",
      bullets: [
        "În câmpul „Caută după enunț, cod (ex: M003) sau tag-uri...” tastează un cuvânt-cheie (ex. „pendul”).",
        "Poți introduce codul complet al problemei (ex. „T014”) pentru a o deschide direct."
      ],
      accent: "search"
    },
    {
      id: "deschide",
      title: "Vezi problema",
      description: "Deschide pagina problemei ca să citești enunțul complet.",
      bullets: [
        "Dă click pe card sau pe butonul „Vezi problema” de pe card.",
        "Dacă ai aplicat filtre, lista afișată respectă exact selecțiile tale."
      ],
      accent: "open"
    },
  ], [])

  const activeTargetsRef = useRef<HTMLElement[]>([])

  const highlightTargets = (ids: string[]) => {
    if (typeof document === "undefined") return

    // Remove active class from previous targets
    activeTargetsRef.current.forEach((el) => {
      el.classList.remove("guide-highlight-active")
    })

    const newTargets: HTMLElement[] = []
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      el.classList.add("guide-highlight-active")
      el.classList.add("guide-glow-anim")
      setTimeout(() => {
        el.classList.remove("guide-glow-anim")
      }, 1100)
      newTargets.push(el)
    })

    activeTargetsRef.current = newTargets
  }

  const findFirstVisibleTarget = (ids: string[]): HTMLElement | null => {
    if (typeof document === "undefined") return null
    for (const id of ids) {
      const el = document.getElementById(id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      // Check if element is visible (has dimensions and is in viewport)
      if (rect.width > 0 && rect.height > 0) {
        return el
      }
    }
    return null
  }

  const calculateCardPosition = useCallback(() => {
    if (!isOpen || typeof document === "undefined") return

    const stepId = steps[stepIndex]?.id
    if (!stepId) return

    const targets = stepTargets[stepId] || []
    const targetEl = findFirstVisibleTarget(targets)
    
    if (!targetEl) {
      // Fallback: center on screen if target not found
      if (isMobile) {
        setCardPosition({ bottom: 16, left: 16, right: 16 })
      } else {
        setCardPosition({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" })
      }
      return
    }

    const targetRect = targetEl.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 16
    const gap = 20

    // Ensure target stays above blur for this step
    highlightTargets(targets)
    
    const cardRect = cardRef.current?.getBoundingClientRect()
    const estimatedCardWidth = cardRect?.width ?? (isMobile ? viewportWidth - padding * 2 : 384)
    const estimatedCardHeight = cardRect?.height ?? 420

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

    let position: CardPosition = {}

    if (isMobile) {
      // Mobile: always at bottom with full width
      position = { bottom: padding, left: padding, right: padding }
    } else {
      // Desktop: position next to element, vertically centered on target
      const spaceRight = viewportWidth - targetRect.right
      const spaceLeft = targetRect.left
      const spaceBelow = viewportHeight - targetRect.bottom
      const spaceAbove = targetRect.top
      const targetCenterY = targetRect.top + targetRect.height / 2

      const topCentered = clamp(targetCenterY - estimatedCardHeight / 2, padding, viewportHeight - estimatedCardHeight - padding)

      // Prefer right side
      if (spaceRight >= estimatedCardWidth + gap) {
        position = {
          top: topCentered,
          left: targetRect.right + gap,
        }
      }
      // Try left side
      else if (spaceLeft >= estimatedCardWidth + gap) {
        position = {
          top: topCentered,
          right: viewportWidth - targetRect.left + gap,
        }
      }
      // Try below (align left, clamp horizontally if needed)
      else if (spaceBelow >= estimatedCardHeight + gap) {
        const left = clamp(targetRect.left, padding, viewportWidth - estimatedCardWidth - padding)
        position = {
          top: targetRect.bottom + gap,
          left,
        }
      }
      // Try above
      else if (spaceAbove >= estimatedCardHeight + gap) {
        const left = clamp(targetRect.left, padding, viewportWidth - estimatedCardWidth - padding)
        position = {
          bottom: viewportHeight - targetRect.top + gap,
          left,
        }
      }
      // Fallback: center
      else {
        position = {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }
      }
    }

    setCardPosition(position)

    // Scroll element into view if needed
    setTimeout(() => {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
    }, 50)
  }, [isOpen, stepIndex, steps, stepTargets, isMobile])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || authLoading) return
    if (user) {
      setDismissed(true)
      return
    }
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const isDismissed = stored === "true"
    setDismissed(isDismissed)
    // Pornește automat ghidul
    if (!isDismissed) {
      setIsOpen(true)
      setStepIndex(0)
    }
  }, [authLoading, mounted, user])

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true")
    }
    // Ensure scroll is restored before closing
    if (typeof document !== "undefined") {
      document.body.style.overflow = ""
    }
    setDismissed(true)
    setIsOpen(false)
  }

  const handleOpenGuide = () => {
    setIsOpen(true)
    setStepIndex(0)
  }

  const handleNext = () => {
    if (stepIndex === steps.length - 1) {
      handleSkip()
      return
    }
    setStepIndex((idx) => Math.min(idx + 1, steps.length - 1))
  }

  const handlePrev = () => {
    setStepIndex((idx) => Math.max(0, idx - 1))
  }

  // Block/unblock scroll when guide opens/closes
  useEffect(() => {
    if (typeof document === "undefined") return

    if (isOpen) {
      // Block scroll when guide is open
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        // Restore scroll when guide closes
        document.body.style.overflow = originalOverflow
      }
    } else {
      // Ensure scroll is enabled when guide is closed
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Pulse highlight when step changes and guide is open
  useEffect(() => {
    if (!isOpen) return
    const stepId = steps[stepIndex]?.id
    if (!stepId) return
    const targets = stepTargets[stepId] || []
    if (targets.length === 0) return
    highlightTargets(targets)
  }, [isOpen, stepIndex])

  // Calculate card position when step changes or window resizes
  useEffect(() => {
    if (!isOpen) return
    
    // Initial calculation
    calculateCardPosition()

    // Recalculate after card is mounted (for accurate positioning)
    const recalculateTimeout = setTimeout(() => {
      if (cardRef.current && typeof document !== "undefined") {
        calculateCardPosition()
      }
    }, 150)

    const handleResize = () => {
      calculateCardPosition()
    }

    let scrollFrame: number | null = null
    const handleScroll = () => {
      // Throttle scroll events
      if (scrollFrame !== null) return
      scrollFrame = window.requestAnimationFrame(() => {
        calculateCardPosition()
        scrollFrame = null
      })
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleScroll, true)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleScroll, true)
      clearTimeout(recalculateTimeout)
      if (scrollFrame !== null) {
        cancelAnimationFrame(scrollFrame)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stepIndex])

  if (!mounted || authLoading || dismissed || !isOpen) {
    return null
  }

  const currentStep = steps[stepIndex]

  // Build position styles from cardPosition state
  const positionStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    ...(cardPosition.top !== undefined && { top: typeof cardPosition.top === "string" ? cardPosition.top : `${cardPosition.top}px` }),
    ...(cardPosition.bottom !== undefined && { bottom: typeof cardPosition.bottom === "string" ? cardPosition.bottom : `${cardPosition.bottom}px` }),
    ...(cardPosition.left !== undefined && { left: typeof cardPosition.left === "string" ? cardPosition.left : `${cardPosition.left}px` }),
    ...(cardPosition.right !== undefined && { right: typeof cardPosition.right === "string" ? cardPosition.right : `${cardPosition.right}px` }),
    ...(cardPosition.transform && { transform: cardPosition.transform }),
  }

  return (
    <>
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        onClick={(e) => {
          // Prevent closing on overlay click, only allow explicit skip
          e.stopPropagation()
        }}
      />
      
      {/* Guide card */}
      <div 
        ref={cardRef}
        style={positionStyle}
        className={cn(
          "max-w-sm w-full",
          isMobile && "max-w-[calc(100vw-2rem)]"
        )}
      >
        <Card className="border-white/20 bg-[#0f0f0f]/98 text-white shadow-2xl backdrop-blur-md">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  Ghid catalog
                </div>
                <p className="text-base font-semibold text-white">
                  Folosește catalogul în 5 pași rapizi
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="text-white/60 hover:text-white hover:bg-white/10"
                aria-label="Închide ghidul"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50">
                <span>Pas {stepIndex + 1} din {steps.length}</span>
                <div className="flex items-center gap-1">
                  {steps.map((step, idx) => (
                    <span
                      key={step.id}
                      className={cn(
                        "h-1.5 w-6 rounded-full bg-white/15 transition-all",
                        idx === stepIndex && "bg-white/80"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {currentStep.accent === "filters" && <Filter className="h-4 w-4 text-emerald-300" />}
                  {currentStep.accent === "search" && <Search className="h-4 w-4 text-sky-300" />}
                  {currentStep.accent === "open" && <MousePointerClick className="h-4 w-4 text-amber-300" />}
                  <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                </div>
                <p className="text-sm text-white/70">{currentStep.description}</p>
              </div>

              <ul className="space-y-2 text-sm text-white/75">
                {currentStep.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {(currentStep.accent === "filters" && onOpenFilters) && (
                <Button
                  variant="secondary"
                  className="w-full justify-center rounded-full bg-white text-black hover:bg-white/90"
                  onClick={onOpenFilters}
                >
                  Deschide filtrele
                </Button>
              )}

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={stepIndex === 0}
                  className="rounded-full border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-40"
                >
                  Înapoi
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="rounded-full bg-white text-black hover:bg-white/90"
                >
                  {stepIndex === steps.length - 1 ? "Închide ghidul" : "Următorul pas"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <style jsx global>{`
        .guide-glow-anim {
          animation: guideGlowPulse 1.05s ease-out;
          z-index: 9999 !important;
          position: relative;
        }
        .guide-highlight-active {
          position: relative;
          z-index: 10000 !important;
          isolation: isolate;
          filter: none !important;
        }
        @keyframes guideGlowPulse {
          0% { box-shadow: 0 0 0 0 rgba(94, 234, 212, 0.0); }
          25% { box-shadow: 0 0 0 10px rgba(94, 234, 212, 0.30); }
          60% { box-shadow: 0 0 0 6px rgba(94, 234, 212, 0.18); }
          100% { box-shadow: 0 0 0 0 rgba(94, 234, 212, 0.0); }
        }
      `}</style>
    </>
  )
}


