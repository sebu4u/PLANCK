export interface FizicaLeaderboardEntry {
  id: string
  rank: number
  name: string
  elo: number
  isUser: boolean
}

export const FIZICA_LEADERBOARD_SIZE = 20
export const FIZICA_USER_START_RANK = 15
export const FIZICA_USER_CLIMB_POSITIONS = 4
export const FIZICA_USER_END_RANK = FIZICA_USER_START_RANK - FIZICA_USER_CLIMB_POSITIONS

const PLACEHOLDER_NAMES = [
  "Alexandra D.",
  "Andrei M.",
  "Bianca R.",
  "Călin T.",
  "Daria S.",
  "Eduard P.",
  "Florina L.",
  "Gabriel N.",
  "Horia V.",
  "Ioana C.",
  "Laura B.",
  "Mihai F.",
  "Nicoleta G.",
  "Oana H.",
  "Paul I.",
  "Raluca J.",
  "Sorin K.",
  "Teodora A.",
  "Vlad E.",
]

export function buildInitialFizicaLeaderboard(
  userName: string,
  userElo: number,
): FizicaLeaderboardEntry[] {
  let nameIndex = 0
  const entries: FizicaLeaderboardEntry[] = []

  for (let rank = 1; rank <= FIZICA_LEADERBOARD_SIZE; rank++) {
    if (rank === FIZICA_USER_START_RANK) {
      entries.push({
        id: "user",
        rank,
        name: userName,
        elo: userElo,
        isUser: true,
      })
      continue
    }

    const offset =
      rank < FIZICA_USER_START_RANK
        ? (FIZICA_LEADERBOARD_SIZE - rank + 1) * 14
        : (FIZICA_USER_START_RANK - rank) * 11 - 24
    const elo = Math.max(120, userElo + offset + (rank % 4) * 3)

    entries.push({
      id: `placeholder-${rank}`,
      rank,
      name: PLACEHOLDER_NAMES[nameIndex] ?? `Elev ${rank}`,
      elo,
      isUser: false,
    })
    nameIndex += 1
  }

  return entries.sort((a, b) => a.rank - b.rank)
}

export function applyFizicaLeaderboardClimb(
  entries: FizicaLeaderboardEntry[],
): FizicaLeaderboardEntry[] {
  const user = entries.find((entry) => entry.isUser)
  if (!user) return entries

  const oldRank = user.rank
  const newRank = FIZICA_USER_END_RANK

  return entries
    .map((entry) => {
      if (entry.isUser) {
        return { ...entry, rank: newRank }
      }
      if (entry.rank >= newRank && entry.rank < oldRank) {
        return { ...entry, rank: entry.rank + 1 }
      }
      return entry
    })
    .sort((a, b) => a.rank - b.rank)
}
