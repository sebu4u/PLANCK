import { createClient } from "@supabase/supabase-js"

export type FizicaHubCardType = "pregatire" | "simulare"

export interface FizicaHubCard {
  id: string
  order_index: number
  card_type: FizicaHubCardType
  nume: string
  tema: string
  tema_culoare: string
  data: string
  image_url: string
}

export interface FizicaHubCardsData {
  preparations: FizicaHubCard[]
  nextSimulation: FizicaHubCard | null
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

export function formatFizicaSimulationDate(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateIso
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export async function fetchFizicaHubCards(): Promise<FizicaHubCardsData> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { preparations: [], nextSimulation: null }
  }

  try {
    const { data, error } = await supabase
      .from("fizica_hub_cards")
      .select("id, order_index, card_type, nume, tema, tema_culoare, data, image_url")
      .eq("is_active", true)
      .order("order_index", { ascending: true })

    if (error || !data) {
      return { preparations: [], nextSimulation: null }
    }

    const cards = data as FizicaHubCard[]
    const preparations = cards.filter((card) => card.card_type === "pregatire").slice(0, 3)
    const nextSimulation = cards.find((card) => card.card_type === "simulare") ?? null

    return { preparations, nextSimulation }
  } catch {
    return { preparations: [], nextSimulation: null }
  }
}

/** @deprecated Folosește fetchFizicaHubCards */
export async function fetchFizicaSimulations(): Promise<{
  cards: FizicaHubCard[]
  nextSimulation: FizicaHubCard | null
}> {
  const { preparations, nextSimulation } = await fetchFizicaHubCards()
  return { cards: preparations, nextSimulation }
}

export type FizicaSimulationCard = FizicaHubCard
export type FizicaSimulationsData = FizicaHubCardsData
