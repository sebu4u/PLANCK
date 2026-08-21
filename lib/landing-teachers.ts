import type { WorkshopSubject } from "@/lib/pregatire/types"

export type LandingTeacher = {
  id: string
  name: string
  /** Full Instagram URL, @handle, or omit until there is a profile. */
  instagram?: string
  /** Essential bio, max ~60 words. Used as the full text (e.g. hover). */
  description: string
  /** Copy shown on the card, max ~30 words. */
  cardDescription: string
  subjects: WorkshopSubject[]
  /** Extra labels shown before subjects, e.g. Fondator. */
  roles?: string[]
  /**
   * Optional photo under `public/images/team/` (or similar).
   * Leave unset until the file exists — Next will not import missing files.
   */
  imageSrc?: string
  /** CSS object-position for the crop. Default is center. */
  imagePosition?: string
}

export function landingInstagramHandle(instagram?: string): string | null {
  const value = instagram?.trim()
  if (!value) return null

  if (/^https?:\/\//i.test(value)) {
    try {
      const path = new URL(value).pathname.replace(/\/+$/, "")
      const username = path.split("/").filter(Boolean)[0]
      return username ? `@${decodeURIComponent(username)}` : null
    } catch {
      return null
    }
  }

  return value.startsWith("@") ? value : `@${value}`
}

export function landingInstagramHref(instagram?: string): string | null {
  const value = instagram?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value

  const handle = landingInstagramHandle(value)
  if (!handle) return null
  return `https://www.instagram.com/${encodeURIComponent(handle.slice(1))}/`
}

export const LANDING_TEACHERS: LandingTeacher[] = [
  {
    id: "miturca-sebastian",
    name: "Miturca Sebastian",
    instagram: "https://www.instagram.com/planck.academy/",
    description:
      "Sebastian este fondatorul PLANCK Academy și olimpic național la fizică. A obținut ani la rând medalii la olimpiadele naționale și a participat la proba de calificare pentru Olimpiada Internațională de Fizică. Organizează Concursul Național de Fizică PLANCK 2026 și pregătește elevi pentru cele mai înalte niveluri ale olimpiadei.",
    cardDescription:
      "Fondator PLANCK Academy și olimpic național la fizică. Organizează Concursul Național PLANCK 2026 și pregătește elevi pentru olimpiadă.",
    subjects: ["fizica"],
    roles: ["Fondator"],
    imageSrc: "/images/team/sebi.jpg",
  },
  {
    id: "pavel-andrei",
    name: "Pavel Andrei",
    instagram: "https://www.instagram.com/p4vii__/",
    description:
      "Andrei a fost alături încă din primele zile ale platformei. A construit de la zero cursurile de matematică și rezolvările video la toate problemele. Cu peste 2 ani de predare, face matematica ușoară pentru orice elev — au lucrat cu el peste 100 de elevi doar pentru Bacalaureat.",
    cardDescription:
      "A construit cursurile de matematică și rezolvările video. Peste 2 ani de predare și 100+ elevi pregătiți pentru Bacalaureat.",
    subjects: ["mate"],
    imageSrc: "/images/team/Pavel.png",
  },
  {
    id: "victor-paun",
    name: "Victor Păun",
    instagram: "https://www.instagram.com/victor_.app/",
    description:
      "Victor e în clasa a 11-a la CN Mihai Viteazul. Pasionat de chimie din clasa a 7-a, în primul an de liceu a luat locul 1 la Olimpiada Națională. Își împărtășește metodele ca elevii să ajungă cea mai bună versiune a lor în ziua examenului.",
    cardDescription:
      "Clasa a 11-a, locul 1 la Olimpiada Națională de Chimie din primul an de liceu. Pregătește elevii pentru examen, nu doar pentru teorie.",
    subjects: ["chimie"],
    imageSrc: "/images/team/Victor.jpeg",
  },
  {
    id: "goicea-matei",
    name: "Goicea Matei",
    description:
      "Matei e în clasa a 11-a la CN Mihai Viteazul din Ploiești. În ultimii 2 ani a fost la Olimpiada Națională de Biologie, cu premii speciale, pe care le împarte și cu chimia. În gimnaziu nu învăța de plăcere; în liceu o profesoară i-a trezit curiozitatea. Acum vrea să-i ajute pe alții să-și descopere pasiunea.",
    cardDescription:
      "Clasa a 11-a, olimpic la biologie cu premii speciale și la chimie. Ajută elevii să descopere biologia de drag, nu din obligație.",
    subjects: ["biologie", "chimie"],
    imageSrc: "/images/team/Matei.jpeg",
  },
  {
    id: "denisa",
    name: "Denisa",
    instagram: "https://www.instagram.com/bnudenisa/",
    description:
      "Denisa e în clasa a 11-a la CN B.P. Hasdeu Buzău. La Olimpiada de Chimie a luat Premiul II în a 8-a, Premiul I în a 9-a și Mențiune MEC în a 10-a și a 11-a. La Științele Pământului a ajuns la națională trei ani la rând, cu Mențiune MEC, și s-a calificat la etapa internațională în clasa a 11-a.",
    cardDescription:
      "Premiul I la Naționala de Chimie (clasa a 9-a) și calificare internațională la Științele Pământului. Explică calm, până lucrurile complicate par simple.",
    subjects: ["chimie"],
    imageSrc: "/images/team/Denisa.jpeg",
  },
  {
    id: "alex-dragu",
    name: "Alex Dragu",
    instagram: "https://www.instagram.com/alex19dragu/",
    description:
      "Alex e olimpic cu bronz la matematică (clasele a 8-a și a 9-a) și la informatică (a 9-a). La First Tech Challenge a fost vicecampion mondial în 2024 ca Alliance Captain, campion la Maryland Tech Invitational și la Michiana Premier Event, plus Nație prin Educație Award la Naționalele din 2026.",
    cardDescription:
      "Bronz la olimpiadele de mate și informatică. Vicecampion mondial FTC 2024 (Alliance Captain) și campion la Maryland și Michiana.",
    subjects: ["mate"],
    imageSrc: "/images/team/Dragu.png",
  },
  {
    id: "stefan-rares",
    name: "Ștefan Rareș",
    instagram: "https://www.instagram.com/raresstef.sogr/",
    description:
      "Olimpic național 3 ani la rând la biologie și admis la UMFCD București, Rareș a predat biologia pentru sute de elevi de toate vârstele, de la clasa a 5-a până la clasa a 12-a.",
    cardDescription:
      "Olimpic național 3 ani la rând la biologie, admis la UMFCD. A predat sute de elevi, de la clasa a 5-a până la a 12-a.",
    subjects: ["biologie"],
    imageSrc: "/images/team/Rares.jpeg",
  },
  {
    id: "diana",
    name: "Diana",
    description:
      "Diana e în clasa a 12-a și cunoaște presiunea Bac-ului. După 3 calificări consecutive la Naționala de Biologie (Mențiune în a 11-a) și practică în spitale, predă anatomia pentru nota 10 și strategiile de olimpic cu care se abordează subiectele de Bac.",
    cardDescription:
      "Clasa a 12-a, 3 calificări la Naționala de Biologie. Predă anatomia pentru Bac și strategiile de olimpic, fără panică.",
    subjects: ["biologie"],
    imageSrc: "/images/team/diana.jpeg",
    imagePosition: "50% 22%",
  },
  {
    id: "briana-bucur",
    name: "Briana Bucur",
    instagram: "https://www.instagram.com/_briana.bm/",
    description:
      "Olimpică națională la informatică și la Inteligență Artificială, cu Premiul 1 național, Briana a fost baza catalogului de probleme de informatică al platformei. Acum ajută elevii să progreseze în toate ariile informaticii, cu un stil calm și explicații clare pentru orice concept dificil.",
    cardDescription:
      "Olimpică națională la informatică și IA (Premiul 1). A construit catalogul de probleme și explică calm orice concept dificil.",
    subjects: ["info"],
    imageSrc: "/images/team/Briana.jpeg",
    imagePosition: "50% 20%",
  },
  {
    id: "calin",
    name: "Călin",
    description: "",
    cardDescription: "",
    subjects: ["biologie"],
    imageSrc: "/images/team/calin.jpeg",
  },
  {
    id: "lucian-condrea",
    name: "Lucian Condrea",
    instagram: "https://www.instagram.com/lucian24.2/",
    description: "",
    cardDescription: "",
    subjects: ["info"],
  },
]
