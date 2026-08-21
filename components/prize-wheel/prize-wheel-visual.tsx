"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import {
  PRIZE_WHEEL_SEGMENT_ANGLE,
  PRIZE_WHEEL_SEGMENTS,
} from "@/lib/prize-wheel/types"

type PrizeWheelTone = "violet" | "rose"

type PrizeWheelVisualProps = {
  rotation: number
  spinning: boolean
  className?: string
  size?: number
  showLabels?: boolean
  showPointer?: boolean
  tone?: PrizeWheelTone
}

const ROSE_PALETTE = {
  prize: "#e85a8c",
  prizeAlt: "#f07aa8",
  spin: "#fde8f0",
  spinText: "#9d1757",
  hub: "#e85a8c",
  pointer: "#e85a8c",
} as const

function segmentAppearance(
  segment: (typeof PRIZE_WHEEL_SEGMENTS)[number],
  tone: PrizeWheelTone,
) {
  if (tone !== "rose") {
    return { fill: segment.color, text: segment.textColor }
  }
  if (segment.result === "spin_again") {
    return { fill: ROSE_PALETTE.spin, text: ROSE_PALETTE.spinText }
  }
  return {
    fill: segment.color === "#6E5CEB" ? ROSE_PALETTE.prizeAlt : ROSE_PALETTE.prize,
    text: "#ffffff",
  }
}

const VIEW = 200
const CX = 100
const CY = 100
const OUTER_R = 96
const HUB_R = 26
const LABEL_R = 62

function degToRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180
}

function polar(radius: number, deg: number) {
  const rad = degToRad(deg)
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  }
}

function slicePath(startDeg: number, endDeg: number) {
  const start = polar(OUTER_R, startDeg)
  const end = polar(OUTER_R, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${CX} ${CY}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    "Z",
  ].join(" ")
}

export function PrizeWheelVisual({
  rotation,
  spinning,
  className,
  size = 320,
  showLabels = true,
  showPointer = true,
  tone = "violet",
}: PrizeWheelVisualProps) {
  const hubFill = tone === "rose" ? ROSE_PALETTE.hub : "#5B47D6"
  const pointerFill = tone === "rose" ? ROSE_PALETTE.pointer : "#5B47D6"

  return (
    <div className={cn("relative mx-auto", className)} style={{ width: size, height: size }}>
      {showPointer ? (
        <div
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[2px]"
          aria-hidden
        >
          <div
            className={cn(
              "h-0 w-0 border-l-[11px] border-r-[11px] border-t-[18px] border-l-transparent border-r-transparent",
              tone === "rose"
                ? "drop-shadow-[0_2px_3px_rgba(232,90,140,0.35)]"
                : "drop-shadow-[0_2px_3px_rgba(91,71,214,0.35)]",
            )}
            style={{ borderTopColor: pointerFill }}
          />
        </div>
      ) : null}

      <motion.div
        className="h-full w-full"
        animate={{ rotate: rotation }}
        transition={
          spinning
            ? { duration: 4.4, ease: [0.12, 0.8, 0.16, 1] }
            : { duration: 0 }
        }
      >
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          width="100%"
          height="100%"
          className={cn(
            "overflow-visible",
            tone === "rose"
              ? "drop-shadow-[0_16px_40px_rgba(232,90,140,0.22)]"
              : "drop-shadow-[0_16px_40px_rgba(91,71,214,0.22)]",
          )}
          role="img"
          aria-label="Roata cu premii"
        >
          <circle cx={CX} cy={CY} r={OUTER_R + 3} fill="#ffffff" />

          {PRIZE_WHEEL_SEGMENTS.map((segment, index) => {
            const start = index * PRIZE_WHEEL_SEGMENT_ANGLE
            const end = start + PRIZE_WHEEL_SEGMENT_ANGLE
            const mid = start + PRIZE_WHEEL_SEGMENT_ANGLE / 2
            const label = polar(LABEL_R, mid)
            const upsideDown = mid > 90 && mid < 270
            const textRotate = upsideDown ? mid + 180 : mid
            const appearance = segmentAppearance(segment, tone)

            return (
              <g key={`${segment.result}-${index}`}>
                <path d={slicePath(start, end)} fill={appearance.fill} />
                {showLabels ? (
                  <g transform={`translate(${label.x} ${label.y}) rotate(${textRotate})`}>
                    {segment.lines.map((line, lineIndex) => (
                      <text
                        key={line}
                        x={0}
                        y={lineIndex === 0 ? -6.5 : 7}
                        fill={appearance.text}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          letterSpacing: "0.01em",
                          fontFamily: "inherit",
                        }}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                ) : null}
              </g>
            )
          })}

          {PRIZE_WHEEL_SEGMENTS.map((_, index) => {
            const edge = polar(OUTER_R, index * PRIZE_WHEEL_SEGMENT_ANGLE)
            return (
              <line
                key={`divider-${index}`}
                x1={CX}
                y1={CY}
                x2={edge.x}
                y2={edge.y}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            )
          })}

          <circle cx={CX} cy={CY} r={showLabels ? HUB_R : HUB_R * 0.72} fill="#ffffff" />
          <circle
            cx={CX}
            cy={CY}
            r={showLabels ? HUB_R - 3 : HUB_R * 0.72 - 2}
            fill={hubFill}
          />
          {showLabels ? (
            <text
              x={CX}
              y={CY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontFamily: "inherit",
              }}
            >
              Planck
            </text>
          ) : null}
        </svg>
      </motion.div>
    </div>
  )
}
