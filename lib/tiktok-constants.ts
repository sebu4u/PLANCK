export const TIKTOK_PIXEL_ID = "DA319UBC77UB27TRGQAG"
export const TIKTOK_CURRENCY = "RON"

export const TIKTOK_STANDARD_EVENTS = [
  "ViewContent",
  "AddToWishlist",
  "Search",
  "AddPaymentInfo",
  "AddToCart",
  "InitiateCheckout",
  "PlaceAnOrder",
  "CompleteRegistration",
  "Purchase",
  "Contact",
  "CustomizeProduct",
  "Download",
  "FindLocation",
  "SubmitApplication",
  "ApplicationApproval",
  "Schedule",
  "StartTrial",
  "SubmitForm",
  "Subscribe",
] as const

export type TikTokStandardEvent = (typeof TIKTOK_STANDARD_EVENTS)[number]

export function isTikTokStandardEvent(value: string): value is TikTokStandardEvent {
  return (TIKTOK_STANDARD_EVENTS as readonly string[]).includes(value)
}

export function tiktokEventId(event: string, unique: string): string {
  return `${event}_${unique}`
}
