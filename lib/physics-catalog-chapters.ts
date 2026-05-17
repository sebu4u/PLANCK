/** Capitole oficiale catalog fizică — sursă unică pentru UI și validare server (dev). */
export const CATALOG_CLASS_OPTIONS = ["a 9-a", "a 10-a", "a 11-a", "a 12-a"] as const

export const CATALOG_CHAPTER_OPTIONS: Record<(typeof CATALOG_CLASS_OPTIONS)[number], string[]> = {
  "a 9-a": [
    "Miscarea rectilinie si uniforma a punctului material",
    "Miscarea rectilinie uniform variata",
    "Miscarea punctului material sub actiunea greutatii",
    "Principiile mecanicii",
    "Forta de frecare",
    "Forta elastica",
    "Legea atractiei universale",
    "Miscarea circular uniforma",
    "Lucrul mecanic si puterea mecanica",
    "Energia mecanica",
    "Impulsul punctului material",
    "Ciocniri plastice si elastice",
    "Elemente de statica",
    "Principiile opticii geometrice",
    "Lentile",
    "Instrumente optice",
    "Probleme diverse.",
  ],
  "a 10-a": [
    "Legea gazului ideal",
    "Lucrul mecanic si energia interna",
    "Principiul 1 al termodinamicii",
    "Principiul 2 al termodinamicii",
    "Calorimetrie",
    "Electrostatica",
    "Rezistenta electrica. Legea lui Ohm",
    "Gruparea rezistoarelor",
    "Legile lui Kirchhoff",
    "Energia si puterea electrica",
    "magnetism",
    "probleme diverse.",
  ],
  "a 11-a": [
    "Oscilații mecanice. Pendul gravitațional",
    "Unde mecanice",
    "circuite de curent alternativ",
    "Circuite serie de curent alternativ",
    "Circuite paralele de curent alternativ",
    "Circuite mixte de curent alternativ",
    "Circuit oscilant. Antena",
    "Prisma optică. Dispersia luminii",
    "Interferența luminii. Dispozitivul Young",
    "Dispozitive interferenționale",
    "Interferența localizată",
    "Difracția luminii",
    "Polarizarea luminii",
    "probleme diverse",
  ],
  "a 12-a": [
    "Efectul fotoelectric extern",
    "Efectul Compton",
    "Modelul atomic",
    "Atomul cu mai mulți electroni. Raze X",
    "Proprietățile generale ale nucleului atomic",
    "Reacții nucleare",
    "Radiații nucleare",
    "Particule elementare",
    "probleme diverse",
  ],
}

const physicsCategorySet = new Set<string>()
for (const cls of CATALOG_CLASS_OPTIONS) {
  for (const ch of CATALOG_CHAPTER_OPTIONS[cls]) {
    physicsCategorySet.add(ch)
  }
}

export function isPhysicsCatalogCategory(category: string): boolean {
  return physicsCategorySet.has(category.trim())
}

export function allPhysicsCatalogCategories(): string[] {
  return Array.from(physicsCategorySet)
}
