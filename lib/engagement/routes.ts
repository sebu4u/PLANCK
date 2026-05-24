export function isLearningPathItemRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return /^\/invata\/[^/]+\/[^/]+\/\d+/.test(pathname)
}
