"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type Point = { x: number; y: number }

type TrailSegment = {
  d: string
  completed: boolean
  from: Point
  to: Point
  fromColor: string
  toColor: string
}

function buildCurvePath(from: Point, to: Point): string {
  const dy = to.y - from.y
  const cpOffset = Math.max(dy * 0.42, 28)
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + cpOffset}, ${to.x} ${to.y - cpOffset}, ${to.x} ${to.y}`
}

interface LearningPathTrailProps {
  children: ReactNode
  className?: string
  /** Re-render paths when layout/content changes. */
  layoutKey?: string | number
}

export function LearningPathTrail({ children, className, layoutKey }: LearningPathTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [segments, setSegments] = useState<TrailSegment[]>([])
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })

  const updatePaths = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const anchors = Array.from(container.querySelectorAll<HTMLElement>('[data-learning-path-anchor="circle"]'))
    const containerRect = container.getBoundingClientRect()
    setSvgSize({ width: containerRect.width, height: containerRect.height })

    if (anchors.length < 2) {
      setSegments([])
      return
    }

    const points = anchors.map((el) => {
      const rect = el.getBoundingClientRect()
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
        completed: el.dataset.trailCompleted === "true",
        fromColor: el.dataset.trailStrokeFrom ?? "#c4c4c4",
        toColor: el.dataset.trailStrokeTo ?? el.dataset.trailStrokeFrom ?? "#c4c4c4",
      }
    })

    const nextSegments: TrailSegment[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i]
      const to = points[i + 1]
      nextSegments.push({
        d: buildCurvePath(from, to),
        completed: from.completed && to.completed,
        from: { x: from.x, y: from.y },
        to: { x: to.x, y: to.y },
        fromColor: from.fromColor,
        toColor: to.fromColor,
      })
    }
    setSegments(nextSegments)
  }, [])

  useEffect(() => {
    updatePaths()
    const raf = window.requestAnimationFrame(updatePaths)

    const container = containerRef.current
    if (!container) return () => window.cancelAnimationFrame(raf)

    const resizeObserver = new ResizeObserver(() => updatePaths())
    resizeObserver.observe(container)

    window.addEventListener("resize", updatePaths)
    window.addEventListener("scroll", updatePaths, { passive: true })

    return () => {
      window.cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      window.removeEventListener("resize", updatePaths)
      window.removeEventListener("scroll", updatePaths)
    }
  }, [updatePaths, layoutKey])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {svgSize.width > 0 && svgSize.height > 0 ? (
        <svg
          className="pointer-events-none absolute inset-0 z-0 overflow-visible"
          width={svgSize.width}
          height={svgSize.height}
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
          aria-hidden
        >
          <defs>
            {segments.map((segment, index) =>
              segment.completed ? (
                <linearGradient
                  key={index}
                  id={`learning-path-trail-segment-${index}`}
                  gradientUnits="userSpaceOnUse"
                  x1={segment.from.x}
                  y1={segment.from.y}
                  x2={segment.to.x}
                  y2={segment.to.y}
                >
                  <stop offset="0%" stopColor={segment.fromColor} />
                  <stop offset="100%" stopColor={segment.toColor} />
                </linearGradient>
              ) : null
            )}
          </defs>
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.d}
              fill="none"
              stroke={segment.completed ? `url(#learning-path-trail-segment-${index})` : "#c4c4c4"}
              strokeWidth={5}
              strokeLinecap="round"
            />
          ))}
        </svg>
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
