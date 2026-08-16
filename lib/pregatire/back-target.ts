export type PregatireBackTarget = "/exerseaza" | "/dashboard"

const STORAGE_KEY = "planck-pregatire-back"

export function setPregatireBackTarget(target: PregatireBackTarget) {
  try {
    sessionStorage.setItem(STORAGE_KEY, target)
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function getPregatireBackTarget(): PregatireBackTarget {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored === "/exerseaza" || stored === "/dashboard") return stored
  } catch {
    // Ignore.
  }
  return "/dashboard"
}
