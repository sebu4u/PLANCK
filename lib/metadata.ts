import { Metadata } from 'next'

// Base metadata configuration
export const baseMetadata: Metadata = {
  title: {
    default: "Planck Academy",
    template: "%s – Planck Academy"
  },
  description: "Planck este o platformă educațională de fizică și informatică pentru liceu, bazată pe AI, care îi învață pe elevi să gândească prin probleme explicate pas cu pas, cursuri interactive și un mediu complet de programare.",
  keywords: "fizică, educație, liceu, cursuri video, probleme fizică, mecanică, optică, termodinamică, electricitate",
  authors: [{ name: "Planck Team" }],
  creator: "Planck Academy",
  publisher: "Planck Academy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.planck.academy'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: 'https://www.planck.academy',
    siteName: 'Planck Academy',
    title: 'Planck Academy',
    description: 'Planck este o platformă educațională de fizică și informatică pentru liceu, bazată pe AI, care îi învață pe elevi să gândească prin probleme explicate pas cu pas, cursuri interactive și un mediu complet de programare.',
    images: [
      {
        url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
        width: 1200,
        height: 630,
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planck Academy',
    description: 'Planck este o platformă educațională de fizică și informatică pentru liceu, bazată pe AI, care îi învață pe elevi să gândească prin probleme explicate pas cu pas, cursuri interactive și un mediu complet de programare.',
    images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
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
    title: "Planck Code Editor - C++ Compiler in Browser",
    description: "Launch the Planck C++ IDE. Write, compile, and debug code instantly in your browser. Features intelligent autocompletion, real-time error checking, and AI assistance.",
    keywords: "online c++ compiler, browser ide, coding environment, c++ editor, programming tool",
    openGraph: {
      title: "Planck Code Editor",
      description: "Full-featured C++ IDE in your browser.",
      url: 'https://www.planck.academy/planckcode/ide',
    },
  },
  home: {
    title: {
      absolute: "Cursuri de Fizică și Informatică pentru Liceu – Planck Academy"
    },
    description: "Planck este o platformă educațională de fizică și informatică pentru liceu, bazată pe AI, care îi învață pe elevi să gândească prin probleme explicate pas cu pas, cursuri interactive și un mediu complet de programare.",
    keywords: "fizică liceu, cursuri fizică, probleme fizică, învățare interactivă, educație fizică, clasa 9, clasa 10",
    openGraph: {
      title: "Cursuri de Fizică și Informatică pentru Liceu – Planck Academy",
      description: "Planck este o platformă educațională de fizică și informatică pentru liceu, bazată pe AI, care îi învață pe elevi să gândească prin probleme explicate pas cu pas, cursuri interactive și un mediu complet de programare.",
    },
    twitter: {
      title: "Cursuri de Fizică și Informatică pentru Liceu – Planck Academy",
      description: "Planck este o platformă educațională de fizică și informatică pentru liceu, bazată pe AI, care îi învață pe elevi să gândească prin probleme explicate pas cu pas, cursuri interactive și un mediu complet de programare.",
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
  },

  courses: {
    title: "Cursuri de Fizică",
    description: "Descoperă cursurile complete de fizică pentru liceu. Videoclipuri HD, explicații detaliate și exerciții practice pentru clasa a 9-a și a 10-a.",
    keywords: "cursuri fizică liceu, videoclipuri fizică, lecții fizică, exerciții fizică, clasa 9 fizică, clasa 10 fizică",
    openGraph: {
      title: "Cursuri de Fizică",
      description: "Cursuri complete de fizică cu videoclipuri HD și explicații detaliate.",
    },
  },

  // Pagina lecțiilor (cursuri -> lectii)
  "physics-lessons": {
    title: "Lecții de Fizică Structurate pe Clase și Capitole",
    description: "Parcurge lecțiile de fizică pentru clasa a 9-a și a 10-a, structurate pe capitole, cu explicații clare și exemple practice.",
    keywords: "lecții fizică, lecții clasa 9, lecții clasa 10, capitole fizică, conținut educațional fizică",
    alternates: {
      canonical: '/cursuri',
    },
    openGraph: {
      title: "Lecții de Fizică Structurate pe Clase și Capitole",
      description: "Lecții de fizică pentru liceu, organizate pe capitole cu explicații și exemple.",
      url: 'https://www.planck.academy/cursuri',
      type: 'website',
      images: [
        {
          url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
          width: 1200,
          height: 630,
          alt: 'Lecții de Fizică – Planck Academy',
        },
      ],
    },
    twitter: {
      title: "Lecții de Fizică",
      description: "Lecții structurate pe capitole pentru clasa a 9-a și a 10-a.",
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  problems: {
    title: "Probleme de Fizică - Grilă & Rezolvări Complete | PLANCK",
    description: "Cea mai mare colecție de probleme de fizică pentru liceu. Pregătire pentru BAC, admitere medicină și politehnică. Mecanică, Termodinamică, Electricitate și Optică.",
    keywords: "probleme fizica, bacalaureat fizica, admitere medicina fizica, teste grila fizica, exercitii fizica rezolvate, culegere fizica online",
    openGraph: {
      title: "Probleme de Fizică - Pregătire Performantă",
      description: "Exersează cu sute de probleme de fizică explicate. Pregătire pentru examene și concursuri.",
    },
  },

  about: {
    title: "Despre PLANCK - Echipa și Misiunea Noastră",
    description: "Află despre echipa PLANCK și misiunea noastră de a face fizica accesibilă și captivantă pentru toți liceenii.",
    keywords: "despre planck, echipa planck, misiune planck, educație fizică, platformă educațională",
    openGraph: {
      title: "Despre PLANCK - Echipa și Misiunea Noastră",
      description: "Află despre echipa PLANCK și misiunea noastră educațională.",
    },
  },

  contact: {
    title: "Contact - PLANCK",
    description: "Contactează echipa PLANCK pentru întrebări, suport tehnic sau colaborări. Suntem aici să te ajutăm!",
    keywords: "contact planck, suport planck, întrebări planck, ajutor fizică",
    openGraph: {
      title: "Contact - PLANCK",
      description: "Contactează echipa PLANCK pentru suport și întrebări.",
    },
  },

  login: {
    title: "Autentificare - PLANCK",
    description: "Autentifică-te în contul tău PLANCK pentru a accesa cursurile și problemele de fizică.",
    keywords: "autentificare planck, login planck, cont planck, acces cursuri",
    openGraph: {
      title: "Autentificare - PLANCK",
      description: "Autentifică-te pentru a accesa cursurile PLANCK.",
    },
  },

  register: {
    title: "Înregistrare - PLANCK",
    description: "Creează-ți contul PLANCK gratuit și începe să înveți fizica prin cursuri interactive și probleme captivante.",
    keywords: "înregistrare planck, cont nou planck, înscriere planck, gratuit",
    openGraph: {
      title: "Înregistrare - PLANCK",
      description: "Creează-ți contul gratuit pentru a accesa cursurile PLANCK.",
    },
  },

  profile: {
    title: "Profil - PLANCK",
    description: "Gestionează-ți profilul PLANCK, vezi progresul și personalizează-ți experiența de învățare.",
    keywords: "profil planck, progres fizică, statistici planck, cont personal",
    openGraph: {
      title: "Profil - PLANCK",
      description: "Gestionează-ți profilul și progresul în învățarea fizicii.",
    },
  },

  help: {
    title: "Ajutor - PLANCK",
    description: "Ghid complet pentru utilizarea platformei PLANCK. Află cum să navighezi prin cursuri și probleme.",
    keywords: "ajutor planck, ghid planck, tutorial planck, suport utilizatori",
    openGraph: {
      title: "Ajutor - PLANCK",
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
    title: "Fizică Clasa a 9-a - Cursuri și Probleme | PLANCK",
    description: "Cursuri complete de fizică pentru clasa a 9-a. Videoclipuri interactive, probleme practice și explicații detaliate pentru toate capitolele.",
    keywords: "fizică clasa 9, cursuri clasa 9, probleme clasa 9, mecanică, optică, termodinamică",
    openGraph: {
      title: "Fizică Clasa a 9-a - Cursuri și Probleme",
      description: "Cursuri complete de fizică pentru clasa a 9-a cu videoclipuri interactive.",
    },
  },

  "class-10": {
    title: "Fizică Clasa a 10-a - Cursuri și Probleme | PLANCK",
    description: "Cursuri complete de fizică pentru clasa a 10-a. Videoclipuri interactive, probleme practice și explicații detaliate pentru toate capitolele.",
    keywords: "fizică clasa 10, cursuri clasa 10, probleme clasa 10, electricitate, magnetism, undele",
    openGraph: {
      title: "Fizică Clasa a 10-a - Cursuri și Probleme",
      description: "Cursuri complete de fizică pentru clasa a 10-a cu videoclipuri interactive.",
    },
  },

  "coming-soon": {
    title: "În Curând - Cursuri Noi | PLANCK",
    description: "Cursuri noi de fizică în pregătire. Fii primul care află când vor fi disponibile cursurile pentru clasele superioare.",
    keywords: "cursuri noi fizică, în curând, clasa 11, clasa 12, fizică avansată",
    openGraph: {
      title: "În Curând - Cursuri Noi | PLANCK",
      description: "Cursuri noi de fizică în pregătire pentru clasele superioare.",
    },
  },

  insight: {
    title: "Planck Insight - AI Assistant pentru Fizică | PLANCK",
    description: "Planck Insight este asistentul tău AI inteligent pentru învățarea fizicii. Obține explicații detaliate, rezolvă probleme și înțelege concepte complexe cu ajutorul inteligenței artificiale.",
    keywords: "AI fizică, asistent AI, învățare fizică, chat AI, explicatii fizică, Planck Insight, inteligență artificială educație",
    alternates: {
      canonical: '/insight',
    },
    openGraph: {
      title: "Planck Insight - AI Assistant pentru Fizică",
      description: "Asistentul tău AI inteligent pentru învățarea fizicii cu explicații detaliate și rezolvări de probleme.",
      url: 'https://www.planck.academy/insight',
      type: 'website',
      images: [
        {
          url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
          width: 1200,
          height: 630,
          alt: 'Planck Insight - AI Assistant pentru Fizică',
        },
      ],
    },
    twitter: {
      title: "Planck Insight - AI Assistant pentru Fizică",
      description: "Asistentul tău AI inteligent pentru învățarea fizicii cu explicații detaliate.",
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  sketch: {
    title: "Whiteboard Online Gratuit pentru Elevi – Planck Sketch",
    description: "Planck Sketch este un whiteboard colaborativ online, gratuit și fără cont, pentru desen, grafice matematice și explicații vizuale, accesibil printr-un singur click.",
    keywords: "math whiteboard, online graphing calculator, interactive geometry, physics simulation, collaborative whiteboard, sketchpad, mathematics education",
    alternates: {
      canonical: '/sketch',
    },
    openGraph: {
      title: "Whiteboard Online Gratuit pentru Elevi – Planck Sketch",
      description: "Planck Sketch este un whiteboard colaborativ online, gratuit și fără cont, pentru desen, grafice matematice și explicații vizuale, accesibil printr-un singur click.",
      url: 'https://www.planck.academy/sketch',
      type: 'website',
      images: [
        {
          url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
          width: 1200,
          height: 630,
          alt: 'Planck Sketch - Whiteboard Interactiv',
        },
      ],
    },
    twitter: {
      title: "Whiteboard Online Gratuit pentru Elevi – Planck Sketch",
      description: "Planck Sketch este un whiteboard colaborativ online, gratuit și fără cont, pentru desen, grafice matematice și explicații vizuale, accesibil printr-un singur click.",
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  planckcode: {
    title: "Mediu de Programare pentru Liceu cu AI – Planck Code",
    description: "Planck Code este un mediu online de programare pentru liceu, cu IDE și online judge integrate, unde un AI Agent generează, corectează și explică codul direct în editor.",
    keywords: "C++ online IDE, competitive programming, online judge, informatica liceu, olimpiada informatica, bacalaureat informatica, learn C++, coding editor",
    alternates: {
      canonical: '/planckcode',
    },
    openGraph: {
      title: "Mediu de Programare pentru Liceu cu AI – Planck Code",
      description: "Planck Code este un mediu online de programare pentru liceu, cu IDE și online judge integrate, unde un AI Agent generează, corectează și explică codul direct în editor.",
      url: 'https://www.planck.academy/planckcode',
      type: 'website',
      images: [
        {
          url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
          width: 1200,
          height: 630,
          alt: 'Planck Code - IDE & Online Judge',
        },
      ],
    },
    twitter: {
      title: "Mediu de Programare pentru Liceu cu AI – Planck Code",
      description: "Planck Code este un mediu online de programare pentru liceu, cu IDE și online judge integrate, unde un AI Agent generează, corectează și explică codul direct în editor.",
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  pricing: {
    title: "Prețuri și Planuri - PLANCK",
    description: "Alege planul perfect pentru tine sau pentru școala ta. Planuri flexibile pentru elevi individuali și instituții educaționale. Începe gratuit sau alege Plus sau Pro pentru funcții avansate.",
    keywords: "prețuri planck, planuri planck, abonament planck, preț planck, planuri educaționale, planuri școli, planuri elevi",
    alternates: {
      canonical: '/pricing',
    },
    openGraph: {
      title: "Prețuri și Planuri - PLANCK",
      description: "Alege planul perfect pentru tine sau pentru școala ta. Planuri flexibile pentru elevi și instituții educaționale.",
      url: 'https://www.planck.academy/pricing',
      type: 'website',
      images: [
        {
          url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
          width: 1200,
          height: 630,
          alt: 'PLANCK - Prețuri și Planuri',
        },
      ],
    },
    twitter: {
      title: "Prețuri și Planuri - PLANCK",
      description: "Alege planul perfect pentru tine sau pentru școala ta. Planuri flexibile pentru elevi și instituții.",
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },

  "bac-simulations": {
    title: "Simulări BAC Fizică - Subiecte și Variante | PLANCK",
    description: "Pregătește-te pentru BAC cu subiecte oficiale și modele de simulare. Vizualizează și descarcă subiectele de bacalaureat din anii anteriori.",
    keywords: "simulari bac fizica, subiecte bac fizica, bacalaureat fizica, variante bac, modele bac, examen bac fizica",
    alternates: {
      canonical: '/simulari-bac',
    },
    openGraph: {
      title: "Simulări BAC Fizică - Subiecte și Variante | PLANCK",
      description: "Pregătește-te pentru BAC cu subiecte oficiale și modele de simulare din anii anteriori.",
      url: 'https://www.planck.academy/simulari-bac',
      type: 'website',
      images: [
        {
          url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
          width: 1200,
          height: 630,
          alt: 'Simulări BAC Fizică – Planck Academy',
        },
      ],
    },
    twitter: {
      title: "Simulări BAC Fizică - Subiecte și Variante",
      description: "Pregătește-te pentru BAC cu subiecte oficiale și modele de simulare.",
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
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
