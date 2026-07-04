export function isPlanckCodeShellRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  if (pathname.startsWith("/planckcode")) return true
  return isInformaticaProblemDetailRoute(pathname)
}

export function isInformaticaProblemeRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === "/informatica/probleme" || pathname.startsWith("/informatica/probleme/")
}

export function isInformaticaProblemDetailRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return /^\/informatica\/probleme\/[^/]+$/.test(pathname)
}

/** Routes where the IDE runs full-screen (not floating). */
export function isPlanckIdeOriginRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  if (pathname === "/planckcode/ide") return true
  return isInformaticaProblemDetailRoute(pathname)
}
