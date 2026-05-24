import {
  PLATFORM_DESCRIPTION,
  PLATFORM_SITE_URL,
  LEARNING_PATHS_DESCRIPTION,
  LEARNING_PATHS_TITLE,
  PLANCKCODE_DESCRIPTION,
  QUIZ_COUNT,
  VIDEO_SOLUTIONS_COUNT,
  TEACHER_VERIFICATION,
  TESTIMONIALS_LABEL,
  FAQ_ITEMS,
} from '@/lib/platform-marketing'

// Structured data for SEO optimization
export const generateStructuredData = (type: string, data: Record<string, unknown>) => {
  const baseData = {
    "@context": "https://schema.org",
    "@type": type,
  }

  return {
    ...baseData,
    ...data,
  }
}

// Organization structured data
export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Planck Academy",
  "url": PLATFORM_SITE_URL,
  "logo": "https://i.ibb.co/DHgVg7gr/Untitled-design-4.png",
  "description": PLATFORM_DESCRIPTION,
  "educationalLevel": "High school",
  "teaches": ["Physics", "Mathematics", "Computer Science", "Biology"],
  "hasPart": [
    {
      "@type": "LearningResource",
      "name": "Trasee de învățare",
      "description": LEARNING_PATHS_DESCRIPTION,
      "url": `${PLATFORM_SITE_URL}/invata`,
    },
    {
      "@type": "LearningResource",
      "name": "Grile rezolvate",
      "description": `Peste ${QUIZ_COUNT} grile rezolvate pentru clasele 9–12. ${TEACHER_VERIFICATION}.`,
      "url": `${PLATFORM_SITE_URL}/grile`,
    },
    {
      "@type": "LearningResource",
      "name": "Planck Insight",
      "description": "Asistent AI pentru toate materiile din trasee — ghidare socratică pas cu pas.",
      "url": `${PLATFORM_SITE_URL}/insight`,
    },
    {
      "@type": "LearningResource",
      "name": "Planck Sketch",
      "description": "Whiteboard colaborativ online, gratuit și fără cont, pentru grafice matematice și explicații vizuale.",
      "url": `${PLATFORM_SITE_URL}/sketch`,
    },
    {
      "@type": "LearningResource",
      "name": "Planck Code",
      "description": PLANCKCODE_DESCRIPTION,
      "url": `${PLATFORM_SITE_URL}/planckcode`,
    },
  ],
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "RO"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "contact@planck.academy"
  },
  "sameAs": [
    "https://facebook.com/planck",
    "https://instagram.com/planck",
    "https://youtube.com/planck"
  ]
}

// Course structured data
export const courseStructuredData = (courseData: {
  title: string
  description: string
  level?: string
  totalDuration?: string
  price?: string | number
}) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "name": courseData.title,
  "description": courseData.description,
  "provider": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy",
    "url": PLATFORM_SITE_URL
  },
  "educationalLevel": courseData.level,
  "timeRequired": courseData.totalDuration,
  "coursePrerequisites": "Cunoștințe de bază de matematică",
  "educationalCredentialAwarded": "Certificat de participare",
  "offers": {
    "@type": "Offer",
    "price": courseData.price,
    "priceCurrency": "RON",
    "availability": "https://schema.org/InStock"
  }
})

// WebSite structured data
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Planck Academy",
  "url": PLATFORM_SITE_URL,
  "description": PLATFORM_DESCRIPTION,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${PLATFORM_SITE_URL}/probleme?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
}

// Learning paths hub structured data for /invata
export const learningPathsHubStructuredData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": LEARNING_PATHS_TITLE,
  "description": LEARNING_PATHS_DESCRIPTION,
  "url": `${PLATFORM_SITE_URL}/invata`,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Trasee de învățare Planck Academy",
      "url": `${PLATFORM_SITE_URL}/invata`,
    },
  ],
}

export const learningPathChapterStructuredData = (chapter: {
  title: string
  description?: string | null
  slug: string
}) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "name": chapter.title,
  "description": chapter.description || `Capitol din traseele Planck Academy: ${chapter.title}`,
  "url": `${PLATFORM_SITE_URL}/invata/${chapter.slug}`,
  "provider": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy",
    "url": PLATFORM_SITE_URL,
  },
  "educationalLevel": "High school",
  "isAccessibleForFree": false,
})

// BreadcrumbList structured data
export const breadcrumbStructuredData = (breadcrumbs: Array<{ name: string, url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": breadcrumb.name,
    "item": breadcrumb.url
  }))
})

// FAQ structured data
export function faqStructuredData(faqs: Array<{ question: string, answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

// FAQ structured data — uses shared FAQ_ITEMS from platform-marketing
export const homepageFaqStructuredData = faqStructuredData(
  FAQ_ITEMS.map((item) => ({ question: item.question, answer: item.answer }))
)

// Article structured data
export const articleStructuredData = (articleData: {
  title: string
  description: string
  image?: string
  author: string
  publishedDate?: string
  modifiedDate?: string
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": articleData.title,
  "description": articleData.description,
  "image": articleData.image,
  "author": {
    "@type": "Person",
    "name": articleData.author
  },
  "publisher": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy",
    "logo": {
      "@type": "ImageObject",
      "url": "https://i.ibb.co/DHgVg7gr/Untitled-design-4.png"
    }
  },
  "datePublished": articleData.publishedDate,
  "dateModified": articleData.modifiedDate
})

// AboutPage structured data for /despre
export const aboutPageStructuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "Despre PLANCK – Trasee, Grile, Video și Echipa Noastră",
  "description": `Planck Academy te ajută să obții nota dorită la clasă, BAC sau admitere. ${QUIZ_COUNT} grile, ${VIDEO_SOLUTIONS_COUNT} soluții video, ${TESTIMONIALS_LABEL}. ${TEACHER_VERIFICATION}.`,
  "url": `${PLATFORM_SITE_URL}/despre`,
  "mainEntity": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy",
    "url": PLATFORM_SITE_URL,
    "description": PLATFORM_DESCRIPTION,
    "foundingDate": "2024",
    "founder": [
      {
        "@type": "Person",
        "name": "Mițurcă Sebastian",
        "jobTitle": "Co-fondator & Dezvoltator"
      },
      {
        "@type": "Person",
        "name": "Avram Marina",
        "jobTitle": "Co-fondator & Content Creator"
      }
    ],
    "teaches": ["Physics", "Mathematics", "Computer Science", "Biology"],
    "educationalLevel": "High school"
  }
}

// Learning Resource Structured Data for Planck Sketch
export const sketchResourceStructuredData = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "Planck Sketch",
  "description": "Whiteboard colaborativ online, gratuit și fără cont, pentru desen, grafice matematice și explicații vizuale — complementar traseelor Planck.",
  "learningResourceType": "Interactive Resource",
  "educationalLevel": "High school",
  "isAccessibleForFree": true,
  "url": `${PLATFORM_SITE_URL}/sketch`,
  "author": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy"
  }
}

// Learning Resource Structured Data for Planck Code
export const planckCodeResourceStructuredData = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "Planck Code",
  "description": PLANCKCODE_DESCRIPTION,
  "learningResourceType": "Programming Environment",
  "educationalLevel": "High school",
  "isAccessibleForFree": true,
  "url": `${PLATFORM_SITE_URL}/planckcode`,
  "author": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy"
  }
}

// Grile catalog structured data
export const grileCatalogStructuredData = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": `Teste Grilă Liceu – ${QUIZ_COUNT} Grile Rezolvate`,
  "description": `Peste ${QUIZ_COUNT} grile rezolvate pentru clasele 9–12. ${TEACHER_VERIFICATION}.`,
  "learningResourceType": "Quiz",
  "educationalLevel": "High school",
  "url": `${PLATFORM_SITE_URL}/grile`,
  "author": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy"
  }
}
