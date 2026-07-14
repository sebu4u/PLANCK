/**
 * Single source of truth for platform positioning, SEO copy, and marketing stats.
 * Import from here — do not hardcode these values in components or metadata.
 */

export const PLATFORM_SITE_URL = "https://www.planck.academy"

export const PLATFORM_TAGLINE =
  "Ajutor pentru nota dorită la clasă, BAC sau admitere"

export const PLATFORM_DESCRIPTION =
  "Planck Academy te ajută să obții nota pe care o vrei la clasă, BAC sau admitere. Trasee de învățare complete pentru clasele 9–12, peste 10.000 de grile rezolvate, peste 800 de probleme explicate video, conținut verificat de profesori din toată țara și asistent AI Insight."

export const PLATFORM_DESCRIPTION_SHORT =
  "Trasee de învățare pentru clasele 9–12, grile, probleme video și AI — pentru nota dorită la clasă, BAC sau admitere."

export const PLATFORM_KEYWORDS =
  "nota bac, pregatire bac, admitere medicina, admitere politehnica, nota la clasa, trasee invatare, learning paths liceu, clasa 9 10 11 12, grile fizica, grile matematica, probleme rezolvate video, platforma educatie liceu romania, continut verificat profesori, fizica liceu, informatica liceu, matematica liceu"

export const QUIZ_COUNT = "10.000+"
export const QUIZ_COUNT_LABEL = `${QUIZ_COUNT} grile rezolvate`

export const VIDEO_SOLUTIONS_COUNT = "800+"
export const VIDEO_SOLUTIONS_LABEL = `${VIDEO_SOLUTIONS_COUNT} probleme rezolvate video`

export const TESTIMONIALS_COUNT = "100+"
export const TESTIMONIALS_LABEL = `${TESTIMONIALS_COUNT} testimoniale de la elevi, părinți și profesori`

export const LEARNING_PATHS_GRADES = "9–12"
export const LEARNING_PATHS_GRADES_LABEL = `Clasele ${LEARNING_PATHS_GRADES}`

export const LEARNING_PATHS_SUBJECTS = [
  "fizică",
  "matematică",
  "informatică",
  "biologie",
] as const

export const LEARNING_PATHS_SUBJECTS_LABEL = LEARNING_PATHS_SUBJECTS.join(", ")

export const TEACHER_VERIFICATION =
  "Conținut verificat de profesori din toată țara"

export const LEARNING_PATHS_TITLE =
  "Trasee de învățare liceu – Clasele 9–12, toată materia"

export const LEARNING_PATHS_DESCRIPTION =
  "Parcurge trasee structurate pe capitole, lecții și itemi (video, grile, probleme, teste) pentru fizică, matematică, informatică și biologie. Pregătire pentru notă la clasă, BAC, admitere și olimpiade."

export const HOME_TITLE = "Învață pentru BAC"

export const HOME_HERO_HEADLINE = "Obține nota pe care o vrei"

export const HOME_HERO_HEADLINE_GRADIENT = "explicată simplu."

export const HOME_HERO_SUBTITLE =
  "Învață cu un tutor AI care se adaptează ritmului tău."

export const HOME_HERO_SUBTITLE_MOBILE = "Învață cu un tutor AI personal."

export const PLANCKCODE_TITLE = "PlanckCode – IDE Online C++ & Python în Browser"

export const PLANCKCODE_DESCRIPTION =
  "PlanckCode este un IDE online C++ și Python cu compilator în browser și Online Judge: scrii, compilezi și rulezi cod rapid, cu feedback și asistență AI pentru liceu, BAC și concursuri."

export const INSIGHT_DESCRIPTION =
  "Planck Insight este asistentul tău AI pentru toate materiile din traseele Planck. Obține explicații pas cu pas, rezolvă probleme și înțelege concepte — ghidare socratică, nu răspunsuri directe."

export const PLATFORM_STATS = {
  activeUsers: "1.000+",
  quizCount: QUIZ_COUNT,
  videoSolutions: VIDEO_SOLUTIONS_COUNT,
  videoLessons: "200+",
  contentHours: "500+",
  testimonials: TESTIMONIALS_COUNT,
} as const

export const FAQ_ITEMS = [
  {
    id: "1",
    question: "Cum mă ajută traseele de învățare să iau nota dorită?",
    answer:
      "Traseele Planck acoperă toată materia de la clasa a IX-a până la a XII-a, structurate pas cu pas: lecții video, grile, probleme și teste. Parcurgi capitolele în ordinea potrivită pentru notă la clasă, BAC sau admitere.",
  },
  {
    id: "2",
    question: "Este PLANCK potrivit pentru pregătirea BAC-ului?",
    answer:
      "Da. Avem trasee dedicate, peste 10.000 de grile rezolvate, peste 800 de probleme explicate video și simulări BAC. Conținutul este verificat de profesori din toată țara.",
  },
  {
    id: "3",
    question: "Pot folosi platforma de pe telefon sau tabletă?",
    answer:
      "Da, PLANCK este optimizat pentru toate dispozitivele. Poți învăța oriunde te afli, fie că ești acasă sau în deplasare.",
  },
  {
    id: "4",
    question: "Ce se întâmplă dacă nu înțeleg o explicație?",
    answer:
      "AI-ul nostru, Insight, este disponibil să te ghideze pas cu pas prin orice problemă. Pune întrebări și vei primi explicații personalizate până când totul devine clar.",
  },
  {
    id: "5",
    question: "Conținutul este verificat?",
    answer:
      "Da. Materialele de pe PLANCK — trasee, grile, probleme video — sunt verificate de profesori din toată țara. Peste 100 de elevi, părinți și profesori au lăsat testimoniale pe platformă.",
  },
  {
    id: "6",
    question: "Pot cere o rambursare dacă nu sunt mulțumit?",
    answer:
      "Da, oferim garanție de rambursare în primele 14 zile. Dacă PLANCK nu este ceea ce căutai, îți returnăm banii fără întrebări.",
  },
] as const
