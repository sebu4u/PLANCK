import { Metadata } from 'next'
import {
  PLATFORM_DESCRIPTION,
  PLATFORM_KEYWORDS,
  PLATFORM_SITE_URL,
  PLATFORM_TAGLINE,
  HOME_TITLE,
  LEARNING_PATHS_DESCRIPTION,
  LEARNING_PATHS_TITLE,
  INSIGHT_DESCRIPTION,
  PLANCKCODE_DESCRIPTION,
  QUIZ_COUNT,
  VIDEO_SOLUTIONS_COUNT,
  TEACHER_VERIFICATION,
  TESTIMONIALS_LABEL,
} from '@/lib/platform-marketing'

const OG_IMAGE = 'https://i.ibb.co/DHgVg7gr/Untitled-design-4.png'

// Base metadata configuration
export const baseMetadata: Metadata = {
  title: {
    default: `Planck Academy – ${PLATFORM_TAGLINE}`,
    template: "%s – Planck Academy"
  },
  description: PLATFORM_DESCRIPTION,
  keywords: PLATFORM_KEYWORDS,
  authors: [{ name: "Planck Team" }],
  creator: "Planck Academy",
  publisher: "Planck Academy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(PLATFORM_SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: PLATFORM_SITE_URL,
    siteName: 'Planck Academy',
    title: `Planck Academy – ${PLATFORM_TAGLINE}`,
    description: PLATFORM_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Planck Academy – ${PLATFORM_TAGLINE}`,
    description: PLATFORM_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Page-specific metadata configurations
export const pageMetadata: Record<string, Metadata> = {
  "planckcode-ide": {
    title: "PlanckCode IDE – C++ & Python Online în Browser",
    description: "IDE online C++ și Python cu compilator integrat: scrii, compilezi și rulezi cod direct în browser, cu autocompletare, erori în timp real și asistent AI.",
    keywords: "C++ compiler online, Python IDE online, compilator C++ online, IDE C++ online, Python in browser, editor C++ online, browser IDE, coding environment",
    alternates: {
      canonical: '/planckcode/ide',
    },
    openGraph: {
      title: "PlanckCode IDE – C++ & Python Online",
      description: "IDE online C++ și Python în browser: scrii, compilezi și rulezi instant, cu feedback și asistent AI.",
      url: `${PLATFORM_SITE_URL}/planckcode/ide`,
    },
    twitter: {
      title: "PlanckCode IDE – C++ & Python Online în Browser",
      description: "IDE online C++ și Python cu compilator integrat: scrii, compilezi și rulezi cod direct în browser, cu autocompletare și asistent AI.",
    },
  },
  home: {
    title: {
      absolute: `${HOME_TITLE} | Planck Academy`
    },
    description: PLATFORM_DESCRIPTION,
    keywords: PLATFORM_KEYWORDS,
    openGraph: {
      title: `${HOME_TITLE} | Planck Academy`,
      description: PLATFORM_DESCRIPTION,
    },
    twitter: {
      title: `${HOME_TITLE} | Planck Academy`,
      description: PLATFORM_DESCRIPTION,
      images: [OG_IMAGE],
      card: 'summary_large_image',
    },
  },

  courses: {
    title: "Cursuri Video – Integrate în Traseele Planck",
    description: "Lecții video HD integrate în traseele de învățare Planck Academy. Fizică, matematică și informatică pentru clasele 9–12, cu explicații clare pentru notă la clasă, BAC și admitere.",
    keywords: "cursuri liceu, lecții video liceu, trasee invatare, fizică liceu, clasa 9, clasa 10, clasa 11, clasa 12",
    openGraph: {
      title: "Cursuri Video – Integrate în Traseele Planck",
      description: "Lecții video HD pentru liceu, integrate în traseele de învățare Planck Academy.",
    },
  },

  "physics-lessons": {
    title: "Lecții de Fizică – Trasee și Capitole Structurate",
    description: "Lecții de fizică pentru clasele 9–12, structurate pe capitole și integrate în traseele Planck. Explicații clare, exemple practice și pregătire pentru BAC și admitere.",
    keywords: "lecții fizică, lecții clasa 9, lecții clasa 10, capitole fizică, trasee invatare fizica, bac fizica",
    alternates: {
      canonical: '/cursuri',
    },
    openGraph: {
      title: "Lecții de Fizică – Trasee și Capitole Structurate",
      description: "Lecții de fizică pentru liceu, integrate în traseele Planck Academy.",
      url: `${PLATFORM_SITE_URL}/cursuri`,
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Lecții de Fizică – Planck Academy',
        },
      ],
    },
    twitter: {
      title: "Lecții de Fizică – Planck Academy",
      description: "Lecții structurate pe capitole, integrate în traseele de învățare.",
      images: [OG_IMAGE],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  "learning-paths": {
    title: LEARNING_PATHS_TITLE,
    description: LEARNING_PATHS_DESCRIPTION,
    keywords: "trasee invatare, learning paths liceu, invata, capitole, lectii, clasa 9 10 11 12, bac, admitere, planck academy",
    alternates: {
      canonical: "/invata",
    },
    openGraph: {
      title: `${LEARNING_PATHS_TITLE} | Planck Academy`,
      description: LEARNING_PATHS_DESCRIPTION,
      url: `${PLATFORM_SITE_URL}/invata`,
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Trasee de învățare – Planck Academy",
        },
      ],
    },
    twitter: {
      title: LEARNING_PATHS_TITLE,
      description: LEARNING_PATHS_DESCRIPTION,
      images: [OG_IMAGE],
      card: "summary_large_image",
    },
  },

  exerseaza: {
    title: "Exersează – Probleme, Grile, Teste și Flashcard | PLANCK",
    description:
      "Alege cum vrei să exersezi: catalog de probleme, grile, teste și flashcard-uri personalizate din traseele de învățare.",
    keywords:
      "exerseaza planck, probleme liceu, grile fizica, flashcard invatare, teste liceu, catalog probleme",
    alternates: {
      canonical: "/exerseaza",
    },
    openGraph: {
      title: "Exersează – Probleme, Grile, Teste și Flashcard",
      description:
        "Hub central pentru exerciții: probleme, grile, teste și flashcard-uri pe Planck Academy.",
      url: `${PLATFORM_SITE_URL}/exerseaza`,
    },
    twitter: {
      title: "Exersează – Probleme, Grile, Teste și Flashcard",
      description:
        "Alege modul de exersare potrivit: probleme, grile, teste sau flashcard-uri.",
    },
  },

  invataFizica: {
    title: "Învață Fizică – Harta Lecțiilor | PLANCK",
    description:
      "Parcurge lecțiile de fizică pas cu pas pe harta interactivă. Traseu structurat pentru liceu, de la mecanică la termodinamică.",
    keywords:
      "invata fizica, lectii fizica liceu, harta lectii, traseu invatare fizica, planck academy",
    alternates: {
      canonical: "/invata/fizica",
    },
    openGraph: {
      title: "Învață Fizică – Harta Lecțiilor",
      description:
        "Harta lecțiilor de fizică pe Planck Academy: parcurge capitolele în ordine, lecție cu lecție.",
      url: `${PLATFORM_SITE_URL}/invata/fizica`,
    },
    twitter: {
      title: "Învață Fizică – Harta Lecțiilor",
      description:
        "Parcurge lecțiile de fizică pe harta interactivă Planck Academy.",
    },
  },

  invataMate: {
    title: "Învață Matematică – Harta Lecțiilor | PLANCK",
    description:
      "Parcurge lecțiile de matematică pas cu pas pe harta interactivă. Traseu structurat pentru liceu, de la algebră la analiză.",
    keywords:
      "invata matematica, lectii matematica liceu, harta lectii mate, traseu invatare matematica, planck academy",
    alternates: {
      canonical: "/invata/mate",
    },
    openGraph: {
      title: "Învață Matematică – Harta Lecțiilor",
      description:
        "Harta lecțiilor de matematică pe Planck Academy: parcurge capitolele în ordine, lecție cu lecție.",
      url: `${PLATFORM_SITE_URL}/invata/mate`,
    },
    twitter: {
      title: "Învață Matematică – Harta Lecțiilor",
      description:
        "Parcurge lecțiile de matematică pe harta interactivă Planck Academy.",
    },
  },

  invataInfo: {
    title: "Învață Informatică – Harta Lecțiilor | PLANCK",
    description:
      "Parcurge lecțiile de informatică pas cu pas pe harta interactivă. Traseu structurat pentru liceu, de la algoritmi la programare.",
    keywords:
      "invata informatica, lectii informatica liceu, harta lectii info, traseu invatare informatica, planck academy",
    alternates: {
      canonical: "/invata/info",
    },
    openGraph: {
      title: "Învață Informatică – Harta Lecțiilor",
      description:
        "Harta lecțiilor de informatică pe Planck Academy: parcurge capitolele în ordine, lecție cu lecție.",
      url: `${PLATFORM_SITE_URL}/invata/info`,
    },
    twitter: {
      title: "Învață Informatică – Harta Lecțiilor",
      description:
        "Parcurge lecțiile de informatică pe harta interactivă Planck Academy.",
    },
  },

  problems: {
    title: "Probleme Rezolvate Video & Catalog – BAC, Admitere, Clasă | PLANCK",
    description: `Peste ${VIDEO_SOLUTIONS_COUNT} probleme cu soluții video explicate și catalog complet pentru liceu. Pregătire pentru BAC, admitere medicină și politehnică. ${TEACHER_VERIFICATION}.`,
    keywords: "probleme fizica, probleme rezolvate video, bacalaureat fizica, admitere medicina fizica, teste grila fizica, exercitii fizica rezolvate, culegere fizica online",
    openGraph: {
      title: "Probleme Rezolvate Video – Pregătire BAC și Admitere",
      description: `Peste ${VIDEO_SOLUTIONS_COUNT} soluții video explicate. Catalog complet pentru examene și clasă.`,
    },
  },

  about: {
    title: { absolute: "Despre Planck — Echipa și Misiunea Noastră" },
    description: `Planck Academy te ajută să obții nota dorită la clasă, BAC sau admitere. Trasee de învățare 9–12, ${QUIZ_COUNT} grile, ${VIDEO_SOLUTIONS_COUNT} soluții video, ${TESTIMONIALS_LABEL}. ${TEACHER_VERIFICATION}.`,
    keywords: "despre planck, echipa planck, trasee invatare, grile liceu, Insight AI, PlanckCode, Planck Sketch, Raptor1, platformă educațională, IDE C++ Python online",
    alternates: {
      canonical: '/despre',
    },
    openGraph: {
      title: "Despre Planck — Echipa și Misiunea Noastră",
      description: `Platformă pentru nota dorită la clasă, BAC și admitere. Trasee complete, ${QUIZ_COUNT} grile, Insight AI, PlanckCode și Planck Sketch.`,
      url: `${PLATFORM_SITE_URL}/despre`,
    },
    twitter: {
      title: "Despre Planck — Echipa și Misiunea Noastră",
      description: `Planck Academy – trasee de învățare, ${QUIZ_COUNT} grile, ${VIDEO_SOLUTIONS_COUNT} soluții video, ${TEACHER_VERIFICATION}.`,
    },
  },

  contact: {
    title: { absolute: "Contact | Planck" },
    description: "Contactează echipa PLANCK pentru întrebări, suport tehnic sau colaborări. Suntem aici să te ajutăm!",
    keywords: "contact planck, suport planck, întrebări planck, ajutor liceu",
    openGraph: {
      title: "Contact | Planck",
      description: "Contactează echipa PLANCK pentru suport și întrebări.",
    },
  },

  login: {
    title: "Autentificare - PLANCK",
    description: "Autentifică-te în contul tău PLANCK pentru a accesa traseele de învățare, grilele și problemele video.",
    keywords: "autentificare planck, login planck, cont planck, acces trasee invatare",
    openGraph: {
      title: "Autentificare - PLANCK",
      description: "Autentifică-te pentru a accesa traseele și conținutul PLANCK.",
    },
  },

  register: {
    title: "Înregistrare - PLANCK",
    description: "Creează-ți contul PLANCK gratuit și începe traseele de învățare pentru nota dorită la clasă, BAC sau admitere.",
    keywords: "înregistrare planck, cont nou planck, înscriere planck, gratuit, trasee invatare",
    openGraph: {
      title: "Înregistrare - PLANCK",
      description: "Creează-ți contul gratuit și accesează traseele de învățare PLANCK.",
    },
  },

  profile: {
    title: "Profil - PLANCK",
    description: "Gestionează-ți profilul PLANCK, vezi progresul în trasee și personalizează-ți experiența de învățare.",
    keywords: "profil planck, progres invatare, statistici planck, cont personal",
    openGraph: {
      title: "Profil - PLANCK",
      description: "Gestionează-ți profilul și progresul în traseele de învățare.",
    },
  },

  help: {
    title: { absolute: "Ajutor | Planck" },
    description: "Ghid complet pentru utilizarea platformei PLANCK. Află cum să navighezi prin trasee, grile și probleme video.",
    keywords: "ajutor planck, ghid planck, tutorial planck, suport utilizatori, trasee invatare",
    openGraph: {
      title: "Ajutor | Planck",
      description: "Ghid complet pentru utilizarea platformei PLANCK.",
    },
  },

  terms: {
    title: "Termeni și Condiții - PLANCK",
    description: "Termenii și condițiile de utilizare a platformei PLANCK. Citește cu atenție înainte de a utiliza serviciile noastre.",
    keywords: "termeni condiții planck, utilizare planck, drepturi planck, obligații utilizatori",
    openGraph: {
      title: "Termeni și Condiții - PLANCK",
      description: "Termenii și condițiile de utilizare a platformei PLANCK.",
    },
  },

  privacy: {
    title: "Politica de Confidențialitate - PLANCK",
    description: "Politica noastră de confidențialitate explică cum colectăm, utilizăm și protejăm datele tale personale.",
    keywords: "confidențialitate planck, date personale, protecție date, gdpr",
    openGraph: {
      title: "Politica de Confidențialitate - PLANCK",
      description: "Cum protejăm datele tale personale pe platforma PLANCK.",
    },
  },

  "class-9": {
    title: "Fizică Clasa a 9-a - Trasee, Cursuri și Probleme | PLANCK",
    description: "Trasee de învățare și cursuri complete de fizică pentru clasa a 9-a. Videoclipuri, grile și probleme practice pentru nota dorită.",
    keywords: "fizică clasa 9, trasee clasa 9, cursuri clasa 9, probleme clasa 9, mecanică, optică, termodinamică",
    openGraph: {
      title: "Fizică Clasa a 9-a - Trasee și Cursuri",
      description: "Trasee și cursuri complete de fizică pentru clasa a 9-a.",
    },
  },

  "class-10": {
    title: "Fizică Clasa a 10-a - Trasee, Cursuri și Probleme | PLANCK",
    description: "Trasee de învățare și cursuri complete de fizică pentru clasa a 10-a. Videoclipuri, grile și probleme pentru BAC și clasă.",
    keywords: "fizică clasa 10, trasee clasa 10, cursuri clasa 10, probleme clasa 10, electricitate, magnetism, undele",
    openGraph: {
      title: "Fizică Clasa a 10-a - Trasee și Cursuri",
      description: "Trasee și cursuri complete de fizică pentru clasa a 10-a.",
    },
  },

  "coming-soon": {
    title: "În Curând - Trasee Noi | PLANCK",
    description: "Trasee de învățare noi în pregătire. Fii primul care află când vor fi disponibile capitolele pentru clasele superioare.",
    keywords: "trasee noi, în curând, clasa 11, clasa 12, invatare liceu",
    openGraph: {
      title: "În Curând - Trasee Noi | PLANCK",
      description: "Trasee de învățare noi în pregătire pentru clasele superioare.",
    },
  },

  insight: {
    title: "Planck Insight - AI Assistant pentru Toate Materiile | PLANCK",
    description: INSIGHT_DESCRIPTION,
    keywords: "AI educatie, asistent AI, invatare liceu, chat AI, Planck Insight, inteligență artificială educație, trasee invatare, bac, admitere",
    alternates: {
      canonical: '/insight',
    },
    openGraph: {
      title: "Planck Insight - AI Assistant pentru Toate Materiile",
      description: INSIGHT_DESCRIPTION,
      url: `${PLATFORM_SITE_URL}/insight`,
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Planck Insight - AI Assistant',
        },
      ],
    },
    twitter: {
      title: "Planck Insight - AI Assistant pentru Toate Materiile",
      description: INSIGHT_DESCRIPTION,
      images: [OG_IMAGE],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  sketch: {
    title: "Whiteboard Online Gratuit pentru Elevi – Planck Sketch",
    description: "Planck Sketch este un whiteboard colaborativ online, gratuit și fără cont, pentru desen, grafice matematice și explicații vizuale — complementar traseelor Planck.",
    keywords: "math whiteboard, online graphing calculator, interactive geometry, physics simulation, collaborative whiteboard, sketchpad, mathematics education",
    alternates: {
      canonical: '/sketch',
    },
    openGraph: {
      title: "Whiteboard Online Gratuit pentru Elevi – Planck Sketch",
      description: "Whiteboard colaborativ online, gratuit și fără cont, pentru grafice matematice și explicații vizuale.",
      url: `${PLATFORM_SITE_URL}/sketch`,
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Planck Sketch - Whiteboard Interactiv',
        },
      ],
    },
    twitter: {
      title: "Whiteboard Online Gratuit pentru Elevi – Planck Sketch",
      description: "Whiteboard colaborativ online, gratuit și fără cont, pentru desen și grafice matematice.",
      images: [OG_IMAGE],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  planckcode: {
    title: { absolute: "PlanckCode: IDE Online C++ & Python | Planck" },
    description: PLANCKCODE_DESCRIPTION,
    keywords: "C++, Python, C++ compiler online, Python IDE online, compilator C++ online, IDE C++ online, online judge, competitive programming, informatica liceu, bac informatica",
    alternates: {
      canonical: '/planckcode',
    },
    openGraph: {
      title: "PlanckCode: IDE Online C++ & Python | Planck",
      description: PLANCKCODE_DESCRIPTION,
      url: `${PLATFORM_SITE_URL}/planckcode`,
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Planck Code - IDE C++ & Python',
        },
      ],
    },
    twitter: {
      title: "PlanckCode: IDE Online C++ & Python | Planck",
      description: PLANCKCODE_DESCRIPTION,
      images: [OG_IMAGE],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  pricing: {
    title: "Deblochează trasee complete și note mai mari – PLANCK",
    description: "Deblochează trasee de învățare complete, Insight AI și PlanckCode. Planuri flexibile Free, Plus și Pro pentru elevi și școli.",
    keywords: "prețuri planck, planuri planck, abonament planck, trasee invatare, planuri educaționale, planuri școli",
    alternates: {
      canonical: '/pricing',
    },
    openGraph: {
      title: "Deblochează trasee complete și note mai mari – PLANCK",
      description: "Planuri flexibile pentru trasee complete, Insight AI și PlanckCode.",
      url: `${PLATFORM_SITE_URL}/pricing`,
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'PLANCK - Prețuri și Planuri',
        },
      ],
    },
    twitter: {
      title: "Deblochează trasee complete – PLANCK",
      description: "Planuri flexibile pentru trasee, Insight și PlanckCode.",
      images: [OG_IMAGE],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  "bac-simulations": {
    title: "Simulări BAC – Subiecte și Variante | PLANCK",
    description: "Pregătește-te pentru BAC cu simulări oficiale, integrate în traseele Planck. Subiecte și variante din anii anteriori pentru nota dorită.",
    keywords: "simulari bac, subiecte bac, bacalaureat, variante bac, modele bac, examen bac, trasee invatare bac",
    alternates: {
      canonical: '/simulari-bac',
    },
    openGraph: {
      title: "Simulări BAC – Subiecte și Variante | PLANCK",
      description: "Simulări BAC integrate în traseele Planck Academy.",
      url: `${PLATFORM_SITE_URL}/simulari-bac`,
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Simulări BAC – Planck Academy',
        },
      ],
    },
    twitter: {
      title: "Simulări BAC – Subiecte și Variante",
      description: "Pregătește-te pentru BAC cu simulări oficiale în traseele Planck.",
      images: [OG_IMAGE],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  gratuit: {
    title: "Ai nevoie de ajutor pentru nota dorită? – PLANCK",
    description:
      "Completează formularul să vedem cum te putem ajuta la clasă, BAC sau admitere. Îți ia sub 2 minute.",
    keywords: "webinar liceu, bac, admitere, planck academy, gratuit, ajutor invatare, trasee invatare",
    alternates: {
      canonical: "/gratuit",
    },
    openGraph: {
      title: "Ai nevoie de ajutor pentru nota dorită? – PLANCK",
      description:
        "Completează formularul să vedem cum te putem ajuta. Îți ia sub 2 minute.",
      url: `${PLATFORM_SITE_URL}/gratuit`,
    },
    twitter: {
      title: "Ai nevoie de ajutor pentru nota dorită? – PLANCK",
      description:
        "Completează formularul să vedem cum te putem ajuta. Îți ia sub 2 minute.",
    },
  },

  "math-problems": {
    title: "Probleme de Matematică – Catalog pentru Liceu | Planck Academy",
    description:
      "Probleme de matematică pentru liceu, pe clase și nivele de dificultate, integrate în traseele Planck. Enunțuri clare și resurse video opționale.",
    keywords:
      "matematică liceu, probleme matematică, clasa a 9-a, clasa a 10-a, algebră, geometrie, trasee invatare, planck academy",
    alternates: {
      canonical: "/matematica/probleme",
    },
    openGraph: {
      title: "Probleme de Matematică – Planck Academy",
      description:
        "Catalog de probleme structurate pentru pregătire la clasă, BAC și admitere.",
      url: `${PLATFORM_SITE_URL}/matematica/probleme`,
    },
    twitter: {
      title: "Catalog de Probleme de Matematică",
      description:
        "Probleme de matematică pentru liceu, integrate în traseele Planck.",
    },
  },

  "coding-problems": {
    title: "Probleme de Informatică – Catalog C++ & Python | Planck Academy",
    description:
      "Probleme de informatică pentru liceu, cu suport C++ și Python. Catalog filtrabil pe clasă și dificultate, integrat în traseele Planck și PlanckCode IDE.",
    keywords:
      "informatica liceu, probleme informatica, C++, Python, online judge, concurs informatica, trasee invatare, planck academy, bac informatica",
    alternates: {
      canonical: "/informatica/probleme",
    },
    openGraph: {
      title: "Probleme de Informatică – Planck Academy",
      description:
        "Catalog de probleme C++ și Python pentru liceu, concursuri și BAC.",
      url: `${PLATFORM_SITE_URL}/informatica/probleme`,
    },
    twitter: {
      title: "Probleme de Informatică – Planck Academy",
      description:
        "Probleme de informatică C++ și Python, integrate în traseele Planck.",
    },
  },

  grile: {
    title: `Teste Grilă Liceu – ${QUIZ_COUNT} Grile Rezolvate | Planck Academy`,
    description: `Peste ${QUIZ_COUNT} grile rezolvate pentru clasele 9–12. Teste grilă de fizică, matematică și informatică pentru pregătire BAC, admitere și notă la clasă. ${TEACHER_VERIFICATION}.`,
    keywords: "grile fizica, teste grila, grile liceu, bac grila, clasa 9 10 11 12, quiz fizica, grile matematica",
    alternates: {
      canonical: "/grile",
    },
    openGraph: {
      title: `Teste Grilă – ${QUIZ_COUNT} Grile Rezolvate`,
      description: `Peste ${QUIZ_COUNT} grile pentru clasele 9–12. Pregătire BAC, admitere și clasă.`,
      url: `${PLATFORM_SITE_URL}/grile`,
    },
    twitter: {
      title: `Teste Grilă – ${QUIZ_COUNT} Grile Rezolvate`,
      description: `Grile rezolvate pentru liceu, integrate în traseele Planck.`,
    },
  },

  "biologie-grile": {
    title: "Teste Grilă Biologie – Catalog Grile Liceu | Planck Academy",
    description:
      "Catalog de grile de biologie pentru clasele 9–12. Întrebări cu răspunsuri multiple, imagini și rezolvări video pentru pregătire la clasă și BAC.",
    keywords:
      "grile biologie, teste grila biologie, grile liceu biologie, bac biologie, clasa 9 10 11 12, quiz biologie",
    alternates: {
      canonical: "/biologie/grile",
    },
    openGraph: {
      title: "Teste Grilă Biologie – Catalog Grile Liceu",
      description: "Grile de biologie pentru liceu, cu răspunsuri multiple și rezolvări video.",
      url: `${PLATFORM_SITE_URL}/biologie/grile`,
    },
    twitter: {
      title: "Teste Grilă Biologie – Catalog Grile Liceu",
      description: "Grile de biologie integrate în traseele Planck.",
    },
  },

  "gratuit-confirmare": {
    title: "Înscriere confirmată – Webinar PLANCK",
    description:
      "O să te contactăm pentru mai multe detalii despre webinar!",
    alternates: {
      canonical: "/gratuit/confirmare",
    },
    openGraph: {
      title: "Înscriere confirmată – Webinar PLANCK",
      description:
        "O să te contactăm pentru mai multe detalii despre webinar!",
      url: `${PLATFORM_SITE_URL}/gratuit/confirmare`,
    },
    robots: {
      index: false,
      follow: true,
    },
  },
}

// Helper function to generate metadata for a specific page
export function generateMetadata(pageKey: string, customData?: Partial<Metadata>): Metadata {
  const pageMeta = pageMetadata[pageKey] || {}

  return {
    ...baseMetadata,
    ...pageMeta,
    ...customData,
    openGraph: {
      ...baseMetadata.openGraph,
      ...pageMeta.openGraph,
      ...customData?.openGraph,
    },
    twitter: {
      ...baseMetadata.twitter,
      ...pageMeta.twitter,
      ...customData?.twitter,
    },
  }
}
