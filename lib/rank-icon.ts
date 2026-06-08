/** Rank badge image under `/public/ranks`; keep in sync with profil / dashboard UI. */
export function getRankIconPath(rankName: string): string {
  const rankLower = rankName.toLowerCase()
  if (rankLower.includes("bronze")) return "/ranks/bronze.webp"
  if (rankLower.includes("silver")) return "/ranks/silver.webp"
  if (rankLower.includes("gold")) return "/ranks/gold.webp"
  if (rankLower.includes("platinum")) return "/ranks/platinum.webp"
  if (rankLower.includes("diamond")) return "/ranks/diamond.webp"
  if (rankLower.includes("masters")) return "/ranks/master.webp"
  if (rankLower.includes("ascendant")) return "/ranks/ascendant.webp"
  if (rankLower.includes("singularity")) return "/ranks/singularity.webp"
  return "/ranks/bronze.webp"
}
