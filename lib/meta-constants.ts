export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1082544554271149"
export const META_CURRENCY = "RON"

export function metaEventId(event: string, unique: string): string {
  return `${event}_${unique}`
}
