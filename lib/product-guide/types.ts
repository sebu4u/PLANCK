import type { UserType } from "@/lib/user-types"

export type ProductGuideAnchorId = "subject-switcher" | "create-path" | "pregatiri-nav"

export type ProductGuideTipKind = "soft" | "spotlight" | "nudge"

export type ProductGuideStepId =
  | "elev-home-subject"
  | "elev-pregatire-cta"
  | "elev-invata-trasee"
  | "elev-exerseaza"
  | "elev-probleme"
  | "elev-pregatire"
  | "elev-create-path"
  | "parent-home"
  | "parent-teme"
  | "parent-abonament"
  | "teacher-home"
  | "teacher-classrooms"
  | "teacher-teme"
  | "teacher-resurse"

export type ProductGuideFlags = {
  visitedLearningPathItem?: boolean
}

export type ProductGuideProgress = {
  seen: ProductGuideStepId[]
  flags: ProductGuideFlags
}

export type ProductGuideStep = {
  id: ProductGuideStepId
  userType: UserType
  kind: ProductGuideTipKind
  anchorId?: ProductGuideAnchorId
  title: string
  body: string
  href?: string
  /** `bottom` parks the tip above the mobile nav instead of under a top-of-screen anchor. */
  tipPlacement?: "auto" | "bottom"
  /** Delay before showing, after the step becomes eligible. */
  showDelayMs?: number
  /** Skip this step when the bottom nav is not on screen (desktop). */
  viewport?: "mobile"
  /** Ordered prerequisites that must already be in `seen`. */
  requires: ProductGuideStepId[]
  /** Extra flags that must be true before this step can show. */
  requiresFlags?: (keyof ProductGuideFlags)[]
  match: (pathname: string) => boolean
}
