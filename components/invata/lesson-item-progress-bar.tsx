import { resolveLearningPathChapterAccentColor } from "@/lib/learning-path-chapter-theme"
import { cn } from "@/lib/utils"

interface LessonItemProgressBarProps {
  completed: number
  total: number
  className?: string
}

interface LessonHubSquareCardProgressBarProps extends LessonItemProgressBarProps {
  accentColor?: string | null
}

export function getLessonItemProgressPercent(completed: number, total: number): number {
  const safeTotal = Math.max(total, 0)
  const safeCompleted = Math.max(0, Math.min(completed, safeTotal > 0 ? safeTotal : completed))
  return safeTotal > 0
    ? Math.round((safeCompleted / safeTotal) * 100)
    : safeCompleted > 0
      ? 100
      : 0
}

export function LessonItemProgressBar({ completed, total, className }: LessonItemProgressBarProps) {
  const percent = getLessonItemProgressPercent(completed, total)

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progres lecție: ${percent}%`}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[#ececec]", className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-300"
        style={{ width: `${percent}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

/** Inset progress bar for square lesson cards on the /invata desktop hub. */
export function LessonHubSquareCardProgressBar({
  completed,
  total,
  accentColor,
  className,
}: LessonHubSquareCardProgressBarProps) {
  const percent = getLessonItemProgressPercent(completed, total)
  const fillColor = resolveLearningPathChapterAccentColor(accentColor)

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progres lecție: ${percent}%`}
      className={cn(
        "pointer-events-none absolute bottom-3 left-3 right-3 z-[2] h-1 overflow-hidden rounded-full bg-[#ececec] sm:bottom-3.5 sm:left-3.5 sm:right-3.5",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${percent}%`, backgroundColor: fillColor }}
        aria-hidden="true"
      />
    </div>
  )
}
