function getStorageKey(userId: string) {
  return `planck:dashboard:rank-leaderboard-revealed:${userId}`
}

export function getRankLeaderboardRevealed(userId: string): boolean {
  if (typeof window === "undefined") return false

  try {
    return window.localStorage.getItem(getStorageKey(userId)) === "true"
  } catch {
    return false
  }
}

export function setRankLeaderboardRevealed(userId: string) {
  try {
    window.localStorage.setItem(getStorageKey(userId), "true")
  } catch {
    // The reveal remains available in this session if browser storage is unavailable.
  }
}
