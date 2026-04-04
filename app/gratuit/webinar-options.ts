export const WEBINAR_CLASA_OPTIONS = [
  "Clasa a X-a",
  "Clasa a XI-a",
  "Clasa a XII-a",
] as const

export const WEBINAR_NOTA_OPTIONS = [
  "Vreau doar să trec (5+)",
  "Țintesc 7-8",
  "Țintesc 9 sau 10",
  "Încă nu știu clar",
] as const

export const WEBINAR_METODA_OPTIONS = [
  "Nu mă pregătesc (sau foarte puțin)",
  "Singur cu culegeri și manuale",
  "Cu meditații particulare",
  "Cu YouTube și resurse gratuite online",
  "Alt fel / combinat",
] as const

export type WebinarLeadActionState = {
  error: string | null
  fieldErrors?: Partial<Record<string, string>>
}
