"use client"

import { type CSSProperties, type ComponentType, useLayoutEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, CalendarDays, Gift, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  hasSeenPregatireIntro,
  writeSeenPregatireIntro,
} from "@/lib/pregatire-hub-tab"
import { getLearningPathChapterTheme } from "@/lib/learning-path-chapter-theme"

const BURGER_BREAKPOINT = 948
const theme = getLearningPathChapterTheme("#7c3aed")

const HIGHLIGHTS = [
  {
    icon: CalendarDays,
    text: "Pregătiri săptămânale, gândite special pentru BAC.",
  },
  {
    icon: Users,
    text: "Grupe mici, ca să poți pune întrebări și să ții pasul.",
  },
  {
    icon: Gift,
    text: "Prima pregătire e gratuită — alege sesiunea care ți se potrivește.",
  },
] as const

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.18 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 320 },
  },
}

const startButtonStyle = {
  "--lp-accent-light": theme.accentLight,
  "--lp-accent": theme.accent,
  "--lp-accent-dark": theme.accentDark,
  "--start-glow-tint": theme.buttonGlowTint,
  backgroundImage: "linear-gradient(to right, var(--lp-accent-light), var(--lp-accent))",
} as CSSProperties

function useIsMobile() {
  const [mobile, setMobile] = useState<boolean | null>(null)
  useLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BURGER_BREAKPOINT - 1}px)`)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return mobile
}

function IntroBody({
  Title,
  Description,
  onDismiss,
}: {
  Title: ComponentType<{ className?: string; children?: React.ReactNode }>
  Description: ComponentType<{ className?: string; children?: React.ReactNode }>
  onDismiss: () => void
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={listVariants}
      className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-5 sm:px-6"
    >
      <motion.p
        variants={fadeUp}
        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: theme.accent }}
      >
        Meditații PLANCK
      </motion.p>
      <motion.div variants={fadeUp}>
        <Title className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">
          Pregătiri săptămânale pentru BAC
        </Title>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Description className="mt-2 text-[15px] leading-relaxed text-[#6b7280]">
          Înscrie-te la meditații live, cu profesori care te pregătesc punctual pentru examen.
          Grupele sunt mici — și poți alege prima pregătire gratuit.
        </Description>
      </motion.div>

      <ul className="mt-5 space-y-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon
          return (
            <motion.li key={item.text} variants={fadeUp} className="flex items-start gap-3">
              <span
                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: theme.accent }}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <p className="pt-1 text-sm leading-snug text-[#374151]">{item.text}</p>
            </motion.li>
          )
        })}
      </ul>

      <motion.button
        variants={fadeUp}
        type="button"
        onClick={onDismiss}
        className="dashboard-start-glow mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_var(--lp-accent-dark)] transition-[transform,box-shadow] active:translate-y-0.5 active:shadow-[0_2px_0_var(--lp-accent-dark)]"
        style={startButtonStyle}
      >
        <span className="relative z-[1] inline-flex items-center justify-center gap-2">
          Vreau să mă înscriu
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </motion.button>
    </motion.div>
  )
}

export function PregatireIntroCard() {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    if (isMobile === null) return
    if (!hasSeenPregatireIntro()) setOpen(true)
  }, [isMobile])

  const dismiss = () => {
    writeSeenPregatireIntro()
    setOpen(false)
  }

  const onOpenChange = (next: boolean) => {
    if (!next) dismiss()
  }

  if (isMobile === null) return null

  const inner = (
    <IntroBody
      Title={isMobile ? SheetTitle : DialogTitle}
      Description={isMobile ? SheetDescription : DialogDescription}
      onDismiss={dismiss}
    />
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          hideClose
          overlayClassName="!z-[450] bg-black/30"
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="!z-[451] flex flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border-x border-t bg-white p-0 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] outline-none focus:outline-none focus-visible:outline-none focus:ring-0"
          style={{ borderColor: theme.accentMutedBorder }}
        >
          <div className="flex justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-[#d1d5db]" aria-hidden />
          </div>
          {inner}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        overlayClassName="!z-[450] bg-black/40"
        className="z-[451] w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden rounded-3xl border bg-white p-0 shadow-[0_20px_50px_rgba(124,58,237,0.16)] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 sm:rounded-3xl"
        style={{ borderColor: theme.accentMutedBorder }}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {inner}
      </DialogContent>
    </Dialog>
  )
}
