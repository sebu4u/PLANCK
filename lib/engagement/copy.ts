export interface UserEngagementSegment {
  streak?: number | null
  solvedTotal?: number | null
  plan?: string | null
  firstName?: string | null
}

export function getProgressCopy(completedCount?: number) {
  if (!completedCount || completedCount <= 1) {
    return {
      title: "Progres salvat",
      description: "Ai mai făcut un pas. Continuă cât ai momentum.",
    }
  }

  return {
    title: `${completedCount} pași finalizați azi`,
    description: "Ritmul ăsta construiește rezultate reale.",
  }
}

export function getStreakCopy(segment: UserEngagementSegment) {
  const streak = segment.streak ?? 0
  if (streak >= 7) {
    return {
      title: `Nu rupe seria de ${streak} zile`,
      description: "Rezolvă o problemă scurtă acum și păstrează avantajul.",
    }
  }

  if (streak >= 2) {
    return {
      title: `Seria ta: ${streak} zile`,
      description: "Încă o activitate azi și seria rămâne vie.",
    }
  }

  return {
    title: "Construiește prima ta serie",
    description: "Un exercițiu scurt azi îți pornește obiceiul.",
  }
}

export function getSocialProofCopy(activeUsers: number, solvedTotal?: number | null) {
  if (solvedTotal && solvedTotal >= 50) {
    return {
      title: "Ești într-un grup avansat",
      description: `${activeUsers} utilizatori învață acum pe PLANCK. Rămâi în ritm cu ei.`,
    }
  }

  return {
    title: "Nu ești singur aici",
    description: `${activeUsers} utilizatori învață sau rezolvă probleme chiar acum.`,
  }
}

export function getHintCopy(surface: "invata" | "ide" | "poll") {
  if (surface === "ide") {
    return {
      title: "Te-ai blocat în cod?",
      description: "Deschide Insight și cere un indiciu fără să-ți dea soluția completă.",
    }
  }

  if (surface === "poll") {
    return {
      title: "Vrei un indiciu?",
      description: "Reia ideea principală din întrebare și elimină variantele care nu se potrivesc.",
    }
  }

  return {
    title: "Vrei un indiciu?",
    description: "Începe prin a scrie datele problemei și relația care le leagă.",
  }
}

export function getMomentumCopy() {
  return {
    title: "Încă una?",
    description: "Ai intrat în ritm. Următorul pas durează mai puțin decât pare.",
  }
}

