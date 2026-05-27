import { supabase } from "@/lib/supabaseClient"
import type {
  FlashcardSessionPayload,
  LearningPathFlashcardOfferParams,
} from "@/lib/learning-path-flashcard-types"

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function authFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken()
  if (!token) throw new Error("Unauthorized")
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  return response
}

export async function checkFlashcardOfferEligibility(itemId: string): Promise<boolean> {
  const response = await authFetch(
    `/api/learning-path/flashcards/offer-eligibility?itemId=${encodeURIComponent(itemId)}`
  )
  if (!response.ok) return false
  const data = (await response.json()) as { eligible?: boolean }
  return Boolean(data.eligible)
}

export async function skipFlashcardOffer(itemId: string): Promise<void> {
  const response = await authFetch("/api/learning-path/flashcards/offer/skip", {
    method: "POST",
    body: JSON.stringify({ itemId }),
  })
  if (!response.ok) {
    throw new Error("Failed to skip flashcard offer")
  }
}

export async function generateFlashcards(
  params: LearningPathFlashcardOfferParams
): Promise<FlashcardSessionPayload> {
  const response = await authFetch("/api/learning-path/flashcards/generate", {
    method: "POST",
    body: JSON.stringify(params),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Generarea a eșuat")
  }
  return data as FlashcardSessionPayload
}

export async function assessFlashcard(
  sessionId: string,
  flashcardId: string,
  knew: boolean
): Promise<void> {
  const response = await authFetch(
    `/api/learning-path/flashcards/session/${encodeURIComponent(sessionId)}/assess`,
    {
      method: "POST",
      body: JSON.stringify({ flashcardId, knew }),
    }
  )
  if (!response.ok) {
    throw new Error("Failed to assess flashcard")
  }
}

export async function completeFlashcardSession(sessionId: string): Promise<void> {
  const response = await authFetch(
    `/api/learning-path/flashcards/session/${encodeURIComponent(sessionId)}/complete`,
    { method: "POST" }
  )
  if (!response.ok) {
    throw new Error("Failed to complete session")
  }
}

export async function assessDeckFlashcard(flashcardId: string, knew: boolean): Promise<void> {
  const response = await authFetch("/api/learning-path/flashcards/deck/assess", {
    method: "POST",
    body: JSON.stringify({ flashcardId, knew }),
  })
  if (!response.ok) {
    throw new Error("Failed to assess flashcard")
  }
}

export async function fetchFlashcardDeck() {
  const response = await authFetch("/api/learning-path/flashcards/deck")
  if (!response.ok) {
    throw new Error("Failed to fetch deck")
  }
  return response.json()
}
