/** Safe in-app path from `redirect` / `next` query params. Rejects protocol-relative URLs. */
export function sanitizeInternalPath(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback
  }
  return value
}

export function authRedirectFromSearchParams(
  searchParams: { get: (key: string) => string | null },
  fallback = "/dashboard",
): string {
  return sanitizeInternalPath(
    searchParams.get("redirect") ?? searchParams.get("next"),
    fallback,
  )
}

export function loginPath(redirectTo: string): string {
  return `/login?redirect=${encodeURIComponent(redirectTo)}`
}
