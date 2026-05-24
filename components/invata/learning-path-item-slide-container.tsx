"use client"

import { AnimatePresence, motion } from "framer-motion"
export type LearningPathSlideDirection = "forward" | "backward"

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

interface LearningPathItemSlideContainerProps {
  itemKey: string
  direction: LearningPathSlideDirection
  children: React.ReactNode
}

export function LearningPathItemSlideContainer({
  itemKey,
  direction,
  children,
}: LearningPathItemSlideContainerProps) {
  return (
    <div className="relative w-full overflow-x-clip">
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.div
          key={itemKey}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.34,
            ease: SLIDE_EASE,
            opacity: { duration: 0.28, ease: "easeOut" },
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
