import { LANDING_TEACHERS, type LandingTeacher } from "@/lib/landing-teachers"
import { PLANCK_WEEK_TEACHER_VIDEOS } from "@/lib/planck-week"
import { WORKSHOP_SUBJECT_LABELS, type WorkshopSubject } from "@/lib/pregatire/types"

export const PLANCK_WEEK_LANDING_SLUGS = [
  "fizica",
  "matematica",
  "informatica",
  "biologie",
  "chimie",
] as const

export type PlanckWeekLandingSlug = (typeof PLANCK_WEEK_LANDING_SLUGS)[number]

export type PlanckWeekSubjectLanding = {
  slug: PlanckWeekLandingSlug
  subject: WorkshopSubject
  teacherId: string
  headline: string
  subhead: string
  sessionPromise: string
  whyTeacher: string
  whyHour: { title: string; body: string }[]
  benefits: { title: string; body: string }[]
  faq: { id: string; question: string; answer: string }[]
  cta: string
  seoTitle: string
  seoDescription: string
}

const SHARED_FAQ_TAIL = [
  {
    id: "gratuit",
    question: "E chiar gratuit?",
    answer: "Da. Îți faci cont, rezervi locul, stai ora. Fără card, fără abonament pornit din umbră.",
  },
  {
    id: "inregistrare",
    question: "Dacă nu pot intra live?",
    answer: "Ședința rămâne înregistrată pe platformă. O poți relua când vrei.",
  },
] as const

export const PLANCK_WEEK_SUBJECT_LANDINGS: Record<PlanckWeekLandingSlug, PlanckWeekSubjectLanding> = {
  fizica: {
    slug: "fizica",
    subject: "fizica",
    teacherId: "miturca-sebastian",
    headline: "Meditație GRATUITĂ de Fizică pentru BAC",
    subhead:
      "Joi, 10 septembrie, ora 20:00. O sesiune live, interactivă, în care rezolvăm împreună probleme de BAC.",
    sessionPromise:
      "Într-o oră pleci cu o metodă clară de atacat problemele, nu cu încă un set de notițe pe care nu le folosești.",
    whyTeacher:
      "Sebastian e fondatorul PLANCK și olimpic național la fizică, cu ani de medalii și calificare spre Olimpiada Internațională. Predă cum rezolvă el, nu cum arată un manual.",
    whyHour: [
      {
        title: "Vezi metoda, nu doar răspunsul",
        body: "Urmărești cum un olimpic desface o problemă: ce citește prima dată, ce ignoră, unde greșesc de obicei elevii.",
      },
      {
        title: "Poți întreba pe loc",
        body: "Nu e un webinar înregistrat pe mute. Dacă te-ai blocat la un pas, spui și primești răspuns în ședință.",
      },
      {
        title: "Rămâne și după oră",
        body: "Live-ul se înregistrează. Reluezi fragmentul unde s-a rupt firul, fără să ceri altcuiva să-ți reexplice.",
      },
    ],
    benefits: [
      {
        title: "0 lei, fără card",
        body: "Rezervi locul cu email. Nu ți se cere plată ca să vezi dacă ți se potrivește predarea.",
      },
      {
        title: "Pentru notă, BAC și olimpiadă",
        body: "Același stil de gândire te ajută la clasă și la examene — nu e un show de formule grele de dragul greului.",
      },
      {
        title: "Locuri limitate",
        body: "Grupul e ținut mic ca întrebările să nu se piardă în chat.",
      },
    ],
    faq: [
      {
        id: "cine",
        question: "Cine predă fizica?",
        answer:
          "Miturca Sebastian, fondator PLANCK Academy și olimpic național la fizică. Organizează Concursul Național PLANCK și pregătește elevi pentru olimpiadă.",
      },
      ...SHARED_FAQ_TAIL,
    ],
    cta: "REZERVĂ-ȚI LOCUL GRATUIT",
    seoTitle: "Meditație GRATUITĂ de Fizică pentru BAC — Planck Week",
    seoDescription:
      "Meditație live de fizică pentru BAC. Joi, 10 septembrie, ora 20:00. Gratuit, pentru clasele IX–XII.",
  },
  matematica: {
    slug: "matematica",
    subject: "mate",
    teacherId: "pavel-andrei",
    headline: "O oră de mate live cu cine a pregătit 100+ elevi de BAC. Gratuit.",
    subhead:
      "Andrei a construit cursurile de matematică de pe PLANCK. În 60 de minute vezi cum se atacă un subiect, pas cu pas.",
    sessionPromise:
      "Nu stai să copiezi rezolvarea. Pleci cu un mod de a începe orice problemă de tipul ăla, inclusiv când enunțul pare gol.",
    whyTeacher:
      "Andrei e de la primele zile ale platformei. A făcut de la zero cursurile de mate și rezolvările video. Predă de peste 2 ani; au lucrat cu el peste 100 de elevi doar pentru Bacalaureat.",
    whyHour: [
      {
        title: "De la enunț la primii 2 pași",
        body: "Majoritatea se blochează la început. Andrei arată ce cauți în text și ce scrii în primele 30 de secunde.",
      },
      {
        title: "Greșelile de BAC, pe față",
        body: "Vezi unde se pierd puncte pe subiecte reale — nu pe exerciții inventate ca să arate frumos.",
      },
      {
        title: "O oră, apoi tu decizi",
        body: "Dacă ți se potrivește stilul, continui. Dacă nu, n-ai plătit nimic și n-ai semnat nimic.",
      },
    ],
    benefits: [
      {
        title: "0 lei, fără card",
        body: "Înscrierea e un cont. Nu ți se cere cardul ca să rezervi locul.",
      },
      {
        title: "Live + înregistrare",
        body: "Intri acum. Dacă ratezi un pas, îl reiei de pe platformă.",
      },
      {
        title: "Grup mic",
        body: "Locurile sunt limitate ca Andrei să poată răspunde, nu doar să predea în gol.",
      },
    ],
    faq: [
      {
        id: "cine",
        question: "Cine predă matematica?",
        answer:
          "Pavel Andrei. A construit cursurile de matematică PLANCK și rezolvările video. Peste 2 ani de predare și 100+ elevi pregătiți pentru BAC.",
      },
      ...SHARED_FAQ_TAIL,
    ],
    cta: "Rezervă ora de Matematică →",
    seoTitle: "Meditație live Matematică gratuită — Planck Week",
    seoDescription:
      "O oră de matematică live cu Pavel Andrei. 10–14 septembrie. Gratuit, fără card.",
  },
  informatica: {
    slug: "informatica",
    subject: "info",
    teacherId: "briana-bucur",
    headline: "O oră de informatică live cu olimpică națională. Gratuit.",
    subhead:
      "Briana explică calm, până un algoritm greu devine o idee pe care o poți scrie. 60 de minute, fără card.",
    sessionPromise:
      "Pleci cu o idee de rezolvare pe care o poți implementa singur, nu cu un cod copiat pe care nu-l înțelegi a doua zi.",
    whyTeacher:
      "Briana e olimpică națională la informatică și la Inteligență Artificială, cu Premiul 1 național. A fost baza catalogului de probleme de informatică de pe PLANCK.",
    whyHour: [
      {
        title: "De la problemă la idee, nu la copy-paste",
        body: "Vezi cum se citește un enunț de info și cum se alege structura — înainte să se scrie un rând de cod.",
      },
      {
        title: "Explicații pentru blocaje reale",
        body: "Dacă te-ai împotmolit la vectori, complexitate sau o buclă, întrebi. Nu aștepți o săptămână după un comentariu.",
      },
      {
        title: "Stil calm, pentru orice nivel",
        body: "Nu e un show de olimpiadă. E o oră în care un concept greu trebuie să rămână clar.",
      },
    ],
    benefits: [
      {
        title: "0 lei, fără card",
        body: "Rezervi cu email. Vezi dacă ți se potrivește predarea înainte să plătești ceva.",
      },
      {
        title: "Live + înregistrare",
        body: "Participi live. Reluezi partea cu implementarea dacă ai nevoie de o a doua privire.",
      },
      {
        title: "Locuri limitate",
        body: "Grup mic, ca întrebările de debug să nu se piardă.",
      },
    ],
    faq: [
      {
        id: "cine",
        question: "Cine predă informatica?",
        answer:
          "Briana Bucur, olimpică națională la informatică și IA (Premiul 1). A construit catalogul de probleme de informatică al platformei.",
      },
      ...SHARED_FAQ_TAIL,
    ],
    cta: "Rezervă ora de Informatică →",
    seoTitle: "Meditație live Informatică gratuită — Planck Week",
    seoDescription:
      "O oră de informatică live cu Briana Bucur, olimpică națională. 10–14 septembrie. Gratuit, fără card.",
  },
  biologie: {
    slug: "biologie",
    subject: "biologie",
    teacherId: "diana",
    headline: "O oră de biologie live, de la cineva care e în clasa a 12-a acum. Gratuit.",
    subhead:
      "Diana știe presiunea BAC-ului. Anatomie și strategie de subiect, fără panică. 60 de minute.",
    sessionPromise:
      "Pleci cu un mod de a învăța un capitol dens — ce merită ținut minte pentru notă și ce e zgomot.",
    whyTeacher:
      "Diana e în clasa a 12-a, cu 3 calificări consecutive la Naționala de Biologie și practică în spitale. Predă anatomia pentru nota 10 și strategiile de olimpic pe subiecte de BAC.",
    whyHour: [
      {
        title: "Anatomie ca să rămână, nu să se uite",
        body: "Nu e dictare din manual. Vezi cum leagă structura de funcție, ca să poți explica a doua zi, nu doar recita.",
      },
      {
        title: "Strategie de BAC, din interior",
        body: "E în a 12-a. Știe ce se cere pe subiect acum — nu ce se cerea acum 10 ani.",
      },
      {
        title: "Întrebi ce te blochează la clasă",
        body: "Un capitol pe care l-ai tot tot citit și tot nu s-a așezat? Asta e ora în care îl desfaci.",
      },
    ],
    benefits: [
      {
        title: "0 lei, fără card",
        body: "Înscrierea e un cont. Niciun abonament pornit automat.",
      },
      {
        title: "Live + înregistrare",
        body: "Intri live. Schemele și explicațiile rămân pe platformă.",
      },
      {
        title: "Grup mic",
        body: "Locuri limitate, ca fiecare nelămurire de anatomie să poată fi lămurită.",
      },
    ],
    faq: [
      {
        id: "cine",
        question: "Cine predă biologia?",
        answer:
          "Diana Rotaru, clasa a 12-a, 3 calificări la Naționala de Biologie. Predă anatomia pentru BAC și strategiile de olimpic, fără panică.",
      },
      ...SHARED_FAQ_TAIL,
    ],
    cta: "Rezervă ora de Biologie →",
    seoTitle: "Meditație live Biologie gratuită — Planck Week",
    seoDescription:
      "O oră de biologie live cu Diana Rotaru. 10–14 septembrie. Gratuit, fără card.",
  },
  chimie: {
    slug: "chimie",
    subject: "chimie",
    teacherId: "denisa",
    headline: "O oră de chimie live, până lucrurile complicate par simple. Gratuit.",
    subhead:
      "Denisa a luat Premiul I la Naționala de Chimie. În 60 de minute desfaci un capitol pe care l-ai tot tot citit și tot nu s-a așezat.",
    sessionPromise:
      "Pleci cu o schemă pe care o poți reface singur — reacții, calcule, de ce iese un produs și nu altul.",
    whyTeacher:
      "Denisa e în clasa a 11-a la CN B.P. Hasdeu. Premiul II în a 8-a, Premiul I în a 9-a la Olimpiada de Chimie, Mențiune MEC în a 10-a și a 11-a, plus calificare internațională la Științele Pământului.",
    whyHour: [
      {
        title: "De la rețetă la înțeles",
        body: "Nu memorezi 20 de reacții. Vezi de ce se întâmplă una și cum recunoști tiparul în următoarea.",
      },
      {
        title: "Calcule fără panică",
        body: "Stoechiometria se rupe de obicei la un pas. Îl facem încet, pe problemă, până iese și la tine.",
      },
      {
        title: "O oră ca test de predare",
        body: "Dacă ți se pare clar, ai găsit profesorul. Dacă nu, n-ai plătit nimic.",
      },
    ],
    benefits: [
      {
        title: "0 lei, fără card",
        body: "Rezervi locul cu email. Fără plată ca să „deblochezi” ședința.",
      },
      {
        title: "Live + înregistrare",
        body: "Participi. Apoi reiei schema de pe platformă când faci temele.",
      },
      {
        title: "Locuri limitate",
        body: "Grup mic, ca întrebările de chimie să nu rămână în aer.",
      },
    ],
    faq: [
      {
        id: "cine",
        question: "Cine predă chimia?",
        answer:
          "Denisa Banu. Premiul I la Naționala de Chimie (clasa a 9-a) și calificare internațională la Științele Pământului. Explică până lucrurile complicate par simple.",
      },
      ...SHARED_FAQ_TAIL,
    ],
    cta: "Rezervă ora de Chimie →",
    seoTitle: "Meditație live Chimie gratuită — Planck Week",
    seoDescription:
      "O oră de chimie live cu Denisa Banu, olimpică națională. 10–14 septembrie. Gratuit, fără card.",
  },
}

export function isPlanckWeekLandingSlug(value: unknown): value is PlanckWeekLandingSlug {
  return typeof value === "string" && (PLANCK_WEEK_LANDING_SLUGS as readonly string[]).includes(value)
}

export function getPlanckWeekSubjectLanding(slug: string): PlanckWeekSubjectLanding | null {
  if (!isPlanckWeekLandingSlug(slug)) return null
  return PLANCK_WEEK_SUBJECT_LANDINGS[slug]
}

export function getPlanckWeekLandingTeacher(landing: PlanckWeekSubjectLanding): LandingTeacher | undefined {
  return LANDING_TEACHERS.find((teacher) => teacher.id === landing.teacherId)
}

export function getPlanckWeekLandingVideoUrl(landing: PlanckWeekSubjectLanding): string | null {
  const video = PLANCK_WEEK_TEACHER_VIDEOS.find((item) => item.teacherId === landing.teacherId)
  return video?.youtubeUrl ?? null
}

export function getPlanckWeekSubjectLandingPath(slug: PlanckWeekLandingSlug): string {
  return `/planck-week/${slug}`
}
