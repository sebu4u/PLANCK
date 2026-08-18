"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import {
  PRIZE_WHEEL_SEGMENT_ANGLE,
  PRIZE_WHEEL_SEGMENTS,
} from "@/lib/prize-wheel/types"

type PrizeWheelVisualProps = {
  rotation: number
  spinning: boolean
  className?: string
  size?: number
  showLabels?: boolean
  showPointer?: boolean
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
}: PrizeWheelVisualProps) {
  return (
    <div className={cn("relative mx-auto", className)} style={{ width: size, height: size }}>
      {showPointer ? (
        <div
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[2px]"
          aria-hidden
        >
          <div className="h-0 w-0 border-l-[11px] border-r-[11px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#5B47D6] drop-shadow-[0_2px_3px_rgba(91,71,214,0.35)]" />
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
          className="overflow-visible drop-shadow-[0_16px_40px_rgba(91,71,214,0.22)]"
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

            return (
              <g key={`${segment.result}-${index}`}>
                <path d={slicePath(start, end)} fill={segment.color} />
                {showLabels ? (
                  <g transform={`translate(${label.x} ${label.y}) rotate(${textRotate})`}>
                    {segment.lines.map((line, lineIndex) => (
                      <text
                        key={line}
                        x={0}
                        y={lineIndex === 0 ? -6.5 : 7}
                        fill={segment.textColor}
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
            fill="#5B47D6"
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
