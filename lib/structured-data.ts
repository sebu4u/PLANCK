// Structured data for SEO optimization
export const generateStructuredData = (type: string, data: any) => {
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
  "name": "PLANCK",
  "url": "https://planck.ro",
  "logo": "https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png",
  "description": "Platforma educațională de fizică pentru liceu cu cursuri video interactive și probleme captivante.",
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
export const courseStructuredData = (courseData: any) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "name": courseData.title,
  "description": courseData.description,
  "provider": {
    "@type": "EducationalOrganization",
    "name": "PLANCK",
    "url": "https://planck.ro"
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
  "name": "PLANCK - Platforma Educațională de Fizică",
  "url": "https://planck.ro",
  "description": "Învață fizica prin cursuri video interactive și probleme captivante. Cursuri pentru clasa a 9-a și a 10-a.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://planck.ro/probleme?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}

// BreadcrumbList structured data
export const breadcrumbStructuredData = (breadcrumbs: Array<{name: string, url: string}>) => ({
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
export const faqStructuredData = (faqs: Array<{question: string, answer: string}>) => ({
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
})

// Article structured data
export const articleStructuredData = (articleData: any) => ({
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
    "name": "PLANCK",
    "logo": {
      "@type": "ImageObject",
      "url": "https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png"
    }
  },
  "datePublished": articleData.publishedDate,
  "dateModified": articleData.modifiedDate
})
