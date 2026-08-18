const ALLOWED_CHECKOUT_PATHS = ["/pricing", "/pregatire", "/rezerva"] as const

export type AllowedCheckoutPath = (typeof ALLOWED_CHECKOUT_PATHS)[number]

function isAllowedCheckoutPath(pathname: string): pathname is AllowedCheckoutPath {
  return (ALLOWED_CHECKOUT_PATHS as readonly string[]).includes(pathname)
}

/** Returns a same-origin app path if it is an allowed checkout return URL. */
export function parseAllowedCheckoutPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return null
  }

  try {
    const url = new URL(value, "https://planck.local")
    if (url.username || url.password || url.hash) return null
    if (!isAllowedCheckoutPath(url.pathname)) return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export function buildCheckoutSuccessUrl(siteUrl: string, path: string): string {
  const url = new URL(path, `${siteUrl.replace(/\/$/, "")}/`)
  url.searchParams.set("checkout", "success")
  url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}")
  return url.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}")
}

export function buildCheckoutCancelUrl(siteUrl: string, path: string): string {
  const url = new URL(path, `${siteUrl.replace(/\/$/, "")}/`)
  url.searchParams.set("checkout", "canceled")
  return url.toString()
}
