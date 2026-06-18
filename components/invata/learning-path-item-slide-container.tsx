"use client"

import { AnimatePresence, motion } from "framer-motion"
export type LearningPathSlideDirection = "forward" | "backward"
export type LearningPathItemEntryAnimation = "slide" | "rise" | "none"

const SLIDE_EASE = [0.32, 0.72, 0, 1] as const

const slideVariants = {
  enter: (direction: LearningPathSlideDirection) => ({
    x: direction === "forward" ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: LearningPathSlideDirection) => ({
    x: direction === "forward" ? "-100%" : "100%",
    opacity: 0,
  }),
}

const riseVariants = {
  enter: {
    y: 36,
    opacity: 0,
  },
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (direction: LearningPathSlideDirection) => ({
    x: direction === "forward" ? "-100%" : "100%",
    opacity: 0,
  }),
}

interface LearningPathItemSlideContainerProps {
  itemKey: string
  direction: LearningPathSlideDirection
  children: React.ReactNode
  allowOverflowX?: boolean
  entryAnimation?: LearningPathItemEntryAnimation
}

export function LearningPathItemSlideContainer({
  itemKey,
  direction,
  children,
  allowOverflowX = false,
  entryAnimation = "slide",
}: LearningPathItemSlideContainerProps) {
  const variants = entryAnimation === "rise" ? riseVariants : slideVariants
  const skipEnterAnimation = entryAnimation === "none"

  return (
    <div className={allowOverflowX ? "relative w-full overflow-x-visible" : "relative w-full overflow-x-clip"}>
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.div
          key={itemKey}
          custom={direction}
          variants={variants}
          initial={skipEnterAnimation ? false : "enter"}
          animate="center"
          exit="exit"
          transition={{
            duration: entryAnimation === "rise" ? 0.52 : 0.34,
            ease: SLIDE_EASE,
            opacity: { duration: entryAnimation === "rise" ? 0.44 : 0.28, ease: "easeOut" },
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
