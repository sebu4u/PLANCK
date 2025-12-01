import { Metadata } from 'next'

// Base metadata configuration
export const baseMetadata: Metadata = {
  title: {
    default: "PLANCK - Platforma Educațională de Fizică",
    template: "%s | PLANCK"
  },
  description: "Învață fizica prin cursuri video interactive și probleme captivante. Cursuri pentru clasa a 9-a și a 10-a.",
  keywords: "fizică, educație, liceu, cursuri video, probleme fizică, mecanică, optică, termodinamică, electricitate",
  authors: [{ name: "PLANCK Team" }],
  creator: "PLANCK",
  publisher: "PLANCK",
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
    siteName: 'PLANCK',
    title: 'PLANCK - Platforma Educațională de Fizică',
    description: 'Învață fizica prin cursuri video interactive și probleme captivante. Cursuri pentru clasa a 9-a și a 10-a.',
    images: [
      {
        url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
        width: 1200,
        height: 630,
        alt: 'PLANCK - Platforma Educațională de Fizică',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLANCK - Platforma Educațională de Fizică',
    description: 'Învață fizica prin cursuri video interactive și probleme captivante. Cursuri pentru clasa a 9-a și a 10-a.',
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
  // Google verification done via DNS on Namecheap
  // verification: {
  //   google: 'your-google-verification-code',
  // },
}

// Page-specific metadata configurations
export const pageMetadata: Record<string, Metadata> = {
  home: {
    title: "PLANCK - Platforma Educațională de Fizică",
    description: "Explorează universul fizicii prin cursuri interactive și probleme captivante. Cursuri complete pentru clasa a 9-a și a 10-a cu videoclipuri HD și exerciții practice.",
    keywords: "fizică liceu, cursuri fizică, probleme fizică, învățare interactivă, educație fizică, clasa 9, clasa 10",
    openGraph: {
      title: "PLANCK - Platforma Educațională de Fizică",
      description: "Explorează universul fizicii prin cursuri interactive și probleme captivante.",
    },
  },
  
  courses: {
    title: "Cursuri de Fizică - PLANCK",
    description: "Descoperă cursurile complete de fizică pentru liceu. Videoclipuri HD, explicații detaliate și exerciții practice pentru clasa a 9-a și a 10-a.",
    keywords: "cursuri fizică liceu, videoclipuri fizică, lecții fizică, exerciții fizică, clasa 9 fizică, clasa 10 fizică",
    openGraph: {
      title: "Cursuri de Fizică - PLANCK",
      description: "Cursuri complete de fizică cu videoclipuri HD și explicații detaliate.",
    },
  },

  // Pagina lecțiilor (cursuri -> lectii)
  "physics-lessons": {
    title: "Lecții de Fizică Structurate pe Clase și Capitole | PLANCK",
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
          alt: 'PLANCK - Lecții de Fizică',
        },
      ],
    },
    twitter: {
      title: "Lecții de Fizică - PLANCK",
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
    title: "Probleme de Fizică - PLANCK",
    description: "Rezolvă probleme de fizică interactive și captivante. Exerciții practice pentru toate capitolele de fizică din liceu.",
    keywords: "probleme fizică, exerciții fizică, rezolvări fizică, probleme liceu, fizică practică",
    openGraph: {
      title: "Probleme de Fizică - PLANCK",
      description: "Probleme interactive și captivante pentru învățarea fizicii.",
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
    title: "Planck Sketch - Whiteboard Interactiv pentru Matematică | PLANCK",
    description: "Planck Sketch este un whiteboard interactiv pentru matematică și fizică. Desenează, scrie ecuații, vizualizează grafice și colaborează în timp real cu alții.",
    keywords: "whiteboard matematică, sketch fizică, ecuații grafice, colaborare timp real, Planck Sketch, whiteboard online, desen matematică",
    alternates: {
      canonical: '/sketch',
    },
    openGraph: {
      title: "Planck Sketch - Whiteboard Interactiv pentru Matematică",
      description: "Whiteboard interactiv pentru matematică și fizică cu colaborare în timp real și vizualizare de grafice.",
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
      title: "Planck Sketch - Whiteboard Interactiv pentru Matematică",
      description: "Whiteboard interactiv pentru matematică și fizică cu colaborare în timp real.",
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  },
  
  planckcode: {
    title: "Planck Code - IDE Online și Online Judge pentru C++ | PLANCK",
    description: "Planck Code este un IDE online integrat cu Online Judge pentru programare competitivă. Învață C++, rezolvă probleme și concurează cu alți elevi. Perfect pentru olimpiade și hackathoane.",
    keywords: "IDE online, online judge, programare competitivă, C++ liceu, olimpiade informatică, Planck Code, editor cod online, programare C++",
    alternates: {
      canonical: '/planckcode',
    },
    openGraph: {
      title: "Planck Code - IDE Online și Online Judge pentru C++",
      description: "IDE online integrat cu Online Judge pentru programare competitivă și învățare C++. Perfect pentru olimpiade.",
      url: 'https://www.planck.academy/planckcode',
      type: 'website',
      images: [
        {
          url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
          width: 1200,
          height: 630,
          alt: 'Planck Code - IDE Online și Online Judge',
        },
      ],
    },
    twitter: {
      title: "Planck Code - IDE Online și Online Judge pentru C++",
      description: "IDE online integrat cu Online Judge pentru programare competitivă și învățare C++.",
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
