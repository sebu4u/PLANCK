export interface FakeSolveProblem {
  id: string
  title: string
}

export interface FakeSolveNotification {
  username: string
  problem: FakeSolveProblem
  message: string
  avatarInitial: string
}

export const FAKE_SOLVE_USERNAMES = [
  "astroMax",
  "ionelQ",
  "lunaBit",
  "noraX",
  "vladIon",
  "teoRay",
  "miraLab",
  "cosmoDan",
  "raduFlux",
  "anaVolt",
  "leoAtom",
  "emaQuark",
  "tudorG",
  "irisPhi",
  "dariaK",
  "alexWave",
  "mateiX",
  "saraPi",
  "robiN",
  "maraSun",
  "andiOrb",
  "ioanaV",
  "raresQ",
  "elenaZ",
  "dinuLab",
  "cristiP",
  "oanaRay",
  "mikiFlux",
  "natiStar",
  "bogdanV",
  "davidIon",
  "laraX",
  "stefanQ",
  "biaAtom",
  "cataPi",
  "ericSun",
  "monaK",
  "tomaLab",
  "iuliaV",
  "denisRay",
  "alexisQ",
  "roxyWave",
  "mihneaZ",
  "sofiaX",
  "dragosP",
  "carlaIon",
  "paulOrb",
  "doraBit",
  "ediFlux",
  "irinaQ",
  "marcVolt",
  "taniaPi",
  "lucasK",
  "alinaRay",
  "viviAtom",
  "sebiX",
  "raisaSun",
  "horiaLab",
  "ninaOrb",
  "flaviuQ",
  "adaWave",
  "teodoraV",
  "rayanIon",
  "simiStar",
  "victorP",
  "amiraZ",
  "mihaiBit",
  "inaFlux",
  "danutQ",
  "selenaX",
  "adiAtom",
  "roxanaV",
  "calinRay",
  "liviaPi",
  "sorinOrb",
  "marioK",
  "eliaSun",
  "raluVolt",
  "nicolasQ",
  "ioanWave",
  "dariaX",
  "emaStar",
  "valiIon",
  "tibiLab",
  "alexiaP",
  "noahFlux",
  "mariaQ",
  "razvanZ",
  "lucaAtom",
  "sashaV",
  "biancaRay",
  "filipPi",
  "tessaOrb",
  "andreiK",
  "carinaSun",
  "robiVolt",
  "ilincaQ",
  "petruWave",
  "zaraIon",
  "nikoLab",
] as const

export const FAKE_SOLVE_MESSAGE_TEMPLATES = [
  "{{username}} tocmai a rezolvat problema #{{problemId}}.",
  "{{username}} a terminat problema #{{problemId}}.",
  "{{username}} a bifat rapid problema #{{problemId}}.",
  "{{username}} a găsit soluția la problema #{{problemId}}.",
  "{{username}} a trecut de problema #{{problemId}}.",
  "{{username}} a rezolvat acum problema #{{problemId}}.",
  "{{username}} a închis problema #{{problemId}}.",
  "{{username}} a dus la capăt problema #{{problemId}}.",
] as const

function getRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function getFakeSolveAvatarInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || "U"
}

export function buildFakeSolveNotification(problems: readonly FakeSolveProblem[]): FakeSolveNotification | null {
  if (!problems.length) return null

  const username = getRandomItem(FAKE_SOLVE_USERNAMES)
  const problem = getRandomItem(problems)
  const template = getRandomItem(FAKE_SOLVE_MESSAGE_TEMPLATES)

  return {
    username,
    problem,
    avatarInitial: getFakeSolveAvatarInitial(username),
    message: template
      .replace("{{username}}", username)
      .replace("{{problemId}}", problem.id),
  }
}
