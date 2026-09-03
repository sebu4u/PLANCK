"use client"

import { motion } from "framer-motion"
import { BookOpen, ListChecks, Play, Trophy, Video } from "lucide-react"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

export const WELCOME_DEMO_VIDEO_ID = "QBTWRag_3Ls"

const PATH_NODES = [
  { label: "Video", icon: Video },
  { label: "Grilă", icon: ListChecks },
  { label: "Problemă", icon: BookOpen },
  { label: "Test", icon: Trophy },
] as const

const WEEK_DAYS = [
  { day: "Lu", date: 8, event: null },
  { day: "Ma", date: 9, event: { title: "Fizică BAC", color: "#7c3aed" } },
  { day: "Mi", date: 10, event: null },
  { day: "Jo", date: 11, event: { title: "Mate live", color: "#2563eb" } },
  { day: "Vi", date: 12, event: null },
  { day: "Sâ", date: 13, event: { title: "Info", color: "#059669" } },
  { day: "Du", date: 14, event: null },
] as const

export function AnimatedWords({
  text,
  className,
  delay = 0,
}: {
  text: string
  className?: string
  delay?: number
}) {
  const words = text.split(" ")

  return (
    <h2 className={cn("text-balance", className)}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="mr-[0.28em] inline-block last:mr-0"
          initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + index * 0.055, duration: 0.42, ease: EASE }}
        >
          {word}
        </motion.span>
      ))}
    </h2>
  )
}

export function WelcomeProblemVideoMock() {
  return (
    <div className="mx-auto grid w-full max-w-lg grid-cols-1 items-stretch gap-3 sm:max-w-2xl md:grid-cols-2 md:gap-4">
      <motion.article
        initial={{ opacity: 0, x: -18, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.28)] sm:p-4"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
            Mediu
          </span>
          <span className="rounded-full border border-black/10 bg-[#f5f4f2] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2c2f33]/75">
            Clasa a 11-a
          </span>
        </div>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-[#2c2f33]/90 sm:text-[15px]">
          Un corp de masă{" "}
          <span className="font-black text-[#111111]">m = 2 kg</span> este aruncat
          vertical în sus cu viteza{" "}
          <span className="font-black text-[#111111]">v₀ = 10 m/s</span>. Neglijând
          rezistența aerului, determinați înălțimea maximă.
        </p>
      </motion.article>

      <motion.div
        initial={{ opacity: 0, x: 18, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
        className="relative aspect-video overflow-hidden rounded-2xl bg-gray-100 shadow-[0_12px_32px_-14px_rgba(15,23,42,0.35)] ring-1 ring-black/5"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${WELCOME_DEMO_VIDEO_ID}/maxresdefault.jpg`}
          alt=""
          className="h-full w-full object-cover"
          onError={(event) => {
            const target = event.target as HTMLImageElement
            target.src = `https://i.ytimg.com/vi/${WELCOME_DEMO_VIDEO_ID}/hqdefault.jpg`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.28, type: "spring", stiffness: 420, damping: 18 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
          >
            <Play className="h-5 w-5 fill-[#be185d] text-[#be185d]" aria-hidden />
          </motion.span>
        </div>
      </motion.div>
    </div>
  )
}

export function WelcomePathMock() {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center px-1 sm:max-w-lg">
      {PATH_NODES.map((node, index) => {
        const Icon = node.icon
        return (
          <div key={node.label} className="flex min-w-0 flex-1 items-center last:flex-none">
            {index > 0 ? (
              <motion.div
                className="mx-1 h-[3px] flex-1 origin-left rounded-full bg-gradient-to-r from-[#cd83db] to-[#8f91f1] sm:mx-2"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: index * 0.22, duration: 0.35, ease: EASE }}
              />
            ) : null}
            <motion.div
              className="flex shrink-0 flex-col items-center"
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.22 + 0.08,
                type: "spring",
                stiffness: 380,
                damping: 16,
              }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_22px_-10px_rgba(190,24,93,0.55)] ring-1 ring-[#be185d]/15 sm:h-12 sm:w-12">
                <Icon className="h-5 w-5 text-[#be185d]" strokeWidth={2.1} />
              </span>
              <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2c2f33]/70 sm:text-[11px]">
                {node.label}
              </span>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

export function WelcomeCalendarMock() {
  const events = WEEK_DAYS.filter((day) => day.event)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.28)] sm:p-4"
    >
      <p className="mb-2 text-center text-sm font-semibold capitalize text-[#111827]">
        Septembrie 2026
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-[#9ca3af] sm:text-[11px]">
        {WEEK_DAYS.map((cell) => (
          <div key={`label-${cell.day}`}>{cell.day}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((cell, index) => (
          <motion.div
            key={cell.date}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 + index * 0.05, duration: 0.28, ease: EASE }}
            className={cn(
              "flex min-h-[42px] flex-col items-center rounded-lg py-1.5 text-sm",
              cell.event ? "bg-[#f8f5ff]" : "bg-transparent",
            )}
          >
            <span className="leading-none text-[#111827]">{cell.date}</span>
            {cell.event ? (
              <span
                className="mt-1.5 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: cell.event.color }}
              />
            ) : (
              <span className="mt-1.5 h-1.5" />
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {events.map((cell, index) =>
          cell.event ? (
            <motion.div
              key={cell.event.title}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + index * 0.12, duration: 0.35, ease: EASE }}
              className="flex items-center gap-2 rounded-xl bg-[#fafafa] px-2.5 py-1.5"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: cell.event.color }}
              />
              <span className="text-xs font-semibold text-[#111827]">{cell.event.title}</span>
              <span className="ml-auto text-[11px] text-[#6b7280]">
                {cell.day} {cell.date}
              </span>
            </motion.div>
          ) : null,
        )}
      </div>
    </motion.div>
  )
}
