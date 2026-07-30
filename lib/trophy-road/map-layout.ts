import {
  TROPHY_ROAD_MILESTONES,
  type TrophyRoadMilestone,
} from "@/lib/trophy-road/milestones"

export interface TrophyRoadMapLayout extends TrophyRoadMilestone {
  index: number
  cardPosition: "above" | "below"
  xPercent: number
  y: number
}

const LEFT_X_FIRST = 38
const LEFT_X = 28
const RIGHT_X = 72
const START_Y = 64
/** Vertical rhythm — roomy so cards/nodes don't crowd. */
const SAME_SIDE_GAP = 320
const CROSS_SIDE_GAP = 180
const PAIR_TRANSITION_GAP = 48
const MAP_MIN_HEIGHT = 720
const MAP_BOTTOM_PAD = 280

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
  if (prevIsLeft === currIsLeft) return SAME_SIDE_GAP
  if (prevIndex === 0) return CROSS_SIDE_GAP

  const prevPositionInPair = (prevIndex - 1) % 2
  if (prevPositionInPair === 1) return PAIR_TRANSITION_GAP

  return CROSS_SIDE_GAP
}

export function buildTrophyRoadMapLayouts(
  milestones: readonly TrophyRoadMilestone[] = TROPHY_ROAD_MILESTONES,
): TrophyRoadMapLayout[] {
  const layouts: TrophyRoadMapLayout[] = []

  for (let index = 0; index < milestones.length; index++) {
    const milestone = milestones[index]
    const isLeft = isLeftSide(index)
    const xPercent = getXPercent(index, isLeft)
    const cardPosition = getCardPosition(index)

    let y = START_Y
    if (index > 0) {
      const prev = layouts[index - 1]
      const prevIsLeft = isLeftSide(index - 1)
      y = prev.y + getVerticalGap(index - 1, prevIsLeft, isLeft)
    }

    layouts.push({
      ...milestone,
      index,
      cardPosition,
      xPercent,
      y,
    })
  }

  return layouts
}

export function computeTrophyRoadMapMinHeight(layouts: TrophyRoadMapLayout[]): number {
  if (layouts.length === 0) return MAP_MIN_HEIGHT
  const last = layouts[layouts.length - 1]
  return Math.max(MAP_MIN_HEIGHT, last.y + MAP_BOTTOM_PAD)
}

export function isMobileLeftSide(index: number): boolean {
  return index % 2 === 0
}
