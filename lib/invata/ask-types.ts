import type { PlanckResourceReference } from "@/lib/insight/agent/types"

export type InvataAskMessage = {
  role: "user" | "assistant"
  content: string
}

export type InvataAskRequest = {
  prompt: string
  messages?: InvataAskMessage[]
  excludeKeys?: string[]
}

export type InvataAskResponse = {
  message: string
  primary: PlanckResourceReference | null
  secondary: PlanckResourceReference | null
  intent: {
    subject: string
    topic: string | null
  }
}

export type InvataAskResources = {
  primary: PlanckResourceReference | null
  secondary: PlanckResourceReference | null
}

export type InvataAskStreamDeltaEvent = {
  type: "delta"
  content: string
}

export type InvataAskStreamDoneEvent = {
  type: "done"
  message: string
  primary: PlanckResourceReference | null
  secondary: PlanckResourceReference | null
  intent: {
    subject: string
    topic: string | null
  }
}

export type InvataAskStreamErrorEvent = {
  type: "error"
  error: string
}

export type InvataAskStreamEvent =
  | InvataAskStreamDeltaEvent
  | InvataAskStreamDoneEvent
  | InvataAskStreamErrorEvent
