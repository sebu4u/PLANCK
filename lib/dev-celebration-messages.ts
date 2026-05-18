export type DevCelebrationMessage = {
  label: string
  headline: string
  body: string
}

export const DEV_CELEBRATION_MESSAGES: DevCelebrationMessage[] = [
  {
    label: "Felicitări",
    headline: "Super treabă!",
    body: "Fiecare item adăugat face platforma mai utilă pentru sute de elevi.",
  },
  {
    label: "Bravo",
    headline: "Continuă așa!",
    body: "Contribuția ta contează — educația devine mai bună pas cu pas.",
  },
  {
    label: "Mulțumim",
    headline: "Ești grozav!",
    body: "Echipa PLANCK apreciază efortul tău. Mai mult conținut = mai mulți elevi ajutați.",
  },
  {
    label: "Impresionant",
    headline: "Muncă de calitate!",
    body: "Exact genul de conținut care face diferența în sala de clasă.",
  },
  {
    label: "Fantastic",
    headline: "Keep going!",
    body: "Un pas în plus spre o platformă completă. Elevii vor avea de câștigat.",
  },
  {
    label: "Excelent",
    headline: "On fire!",
    body: "Construiești ceva valoros — fiecare problemă sau lecție nouă e o victorie.",
  },
  {
    label: "Respect",
    headline: "Așa se face!",
    body: "Dedicarea ta aduce conținut proaspăt pe PLANCK. Mulțumim!",
  },
  {
    label: "Wow",
    headline: "Ești o forță!",
    body: "Platforma crește datorită oamenilor ca tine. Nu te opri acum.",
  },
  {
    label: "Top",
    headline: "Contribuție valoroasă!",
    body: "Fiecare detaliu pe care îl adaugi ajută elevii să învețe mai bine.",
  },
  {
    label: "Legendă",
    headline: "Misiune îndeplinită!",
    body: "Dev-ul care livrează conținut e dev-ul care schimbă jocul.",
  },
]

export function pickRandomDevCelebrationMessage(): DevCelebrationMessage {
  const index = Math.floor(Math.random() * DEV_CELEBRATION_MESSAGES.length)
  return DEV_CELEBRATION_MESSAGES[index] ?? DEV_CELEBRATION_MESSAGES[0]
}
