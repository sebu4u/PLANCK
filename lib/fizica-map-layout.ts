import type { FizicaLessonStatus, FizicaLessonType } from "@/lib/invata-fizica-config"
import {
  FIZICA_CROSS_SIDE_GAP,
  FIZICA_MAP_MIN_HEIGHT,
  FIZICA_SAME_SIDE_GAP,
} from "@/lib/invata-fizica-config"

export interface FizicaMapLessonLayoutInput {
  id: string
  title: string
  type: FizicaLessonType
  durationMinutes: number
  status: FizicaLessonStatus
  href: string | null
  orderIndex: number
}

export interface FizicaMapLessonLayout extends FizicaMapLessonLayoutInput {
  cardPosition: "above" | "below"
  xPercent: number
  y: number
}

const LEFT_X_FIRST = 38
const LEFT_X = 28
const RIGHT_X = 72
const START_Y = 32
/** Gap when moving from the 2nd lesson of a pair to the 1st of the next pair on the other side. */
const PAIR_TRANSITION_GAP = 20

function isLeftSide(index: number): boolean {
  if (index === 0) return true
  const pairNumber = Math.floor((index - 1) / 2)
  return pairNumber % 2 === 1
}

function getXPercent(index: number, isLeft: boolean): number {
  if (isLeft) return index === 0 ? LEFT_X_FIRST : LEFT_X
  return RIGHT_X
}

function getCardPosition(index: number): "above" | "below" {
  if (index === 0) return "below"
  const positionInPair = (index - 1) % 2
  return positionInPair === 0 ? "above" : "below"
}

function getVerticalGap(prevIndex: number, prevIsLeft: boolean, currIsLeft: boolean): number {
  if (prevIsLeft === currIsLeft) return FIZICA_SAME_SIDE_GAP
  if (prevIndex === 0) return FIZICA_CROSS_SIDE_GAP

  const prevPositionInPair = (prevIndex - 1) % 2
  if (prevPositionInPair === 1) return PAIR_TRANSITION_GAP

  return FIZICA_CROSS_SIDE_GAP
}

export function buildFizicaMapLessonLayouts(
  lessons: FizicaMapLessonLayoutInput[],
): FizicaMapLessonLayout[] {
  const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex)
  const layouts: FizicaMapLessonLayout[] = []

  for (let index = 0; index < sorted.length; index++) {
    const lesson = sorted[index]
    const isLeft = isLeftSide(index)
    const xPercent = getXPercent(index, isLeft)
    const cardPosition = getCardPosition(index)

    let y = START_Y
    if (index > 0) {
      const prevLayout = layouts[index - 1]
      const prevIsLeft = isLeftSide(index - 1)
      y = prevLayout.y + getVerticalGap(index - 1, prevIsLeft, isLeft)
    }

    layouts.push({
      ...lesson,
      cardPosition,
      xPercent,
      y,
    })
  }

  return layouts
}

export function computeFizicaMapMinHeight(lessons: FizicaMapLessonLayout[]): number {
  if (lessons.length === 0) return FIZICA_MAP_MIN_HEIGHT
  const last = lessons[lessons.length - 1]
  return Math.max(FIZICA_MAP_MIN_HEIGHT, last.y + 320)
}
