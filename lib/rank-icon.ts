/** Rank badge image under `/public/ranks`; keep in sync with profil / dashboard UI. */
export function getRankIconPath(rankName: string): string {
  const rankLower = rankName.toLowerCase()
  if (rankLower.includes("bronze")) return "/ranks/bronze.png"
  if (rankLower.includes("silver")) return "/ranks/silver.png"
  if (rankLower.includes("gold")) return "/ranks/gold.png"
  if (rankLower.includes("platinum")) return "/ranks/platinum.png"
  if (rankLower.includes("diamond")) return "/ranks/diamond.png"
  if (rankLower.includes("masters")) return "/ranks/masters.png"
  if (rankLower.includes("ascendant")) return "/ranks/ascendant.png"
  if (rankLower.includes("singularity")) return "/ranks/singularity.png"
  return "/ranks/bronze.png"
}
