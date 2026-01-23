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
  "name": "Planck Academy",
  "url": "https://www.planck.academy",
  "logo": "https://i.ibb.co/DHgVg7gr/Untitled-design-4.png",
  "description": "Planck este o platformă educațională de fizică și informatică pentru liceu, bazată pe AI, care îi învață pe elevi să gândească prin probleme explicate pas cu pas, cursuri interactive și un mediu complet de programare.",
  "educationalLevel": "High school",
  "teaches": ["Physics", "Computer Science"],
  "hasPart": [
    {
      "@type": "LearningResource",
      "name": "Planck Sketch",
      "description": "Planck Sketch este un whiteboard colaborativ online, gratuit și fără cont, pentru desen, grafice matematice și explicații vizuale, accesibil printr-un singur click."
    },
    {
      "@type": "LearningResource",
      "name": "Planck Code",
      "description": "Planck Code este un mediu online de programare pentru liceu, cu IDE și online judge integrate, unde un AI Agent generează, corectează și explică codul direct în editor."
    }
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
export const courseStructuredData = (courseData: any) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "name": courseData.title,
  "description": courseData.description,
  "provider": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy",
    "url": "https://www.planck.academy"
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
  "url": "https://www.planck.academy",
  "description": "Planck este o platformă educațională de fizică și informatică pentru liceu, bazată pe AI, care îi învață pe elevi să gândească prin probleme explicate pas cu pas, cursuri interactive și un mediu complet de programare.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.planck.academy/probleme?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}

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
export const faqStructuredData = (faqs: Array<{ question: string, answer: string }>) => ({
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
    "name": "Planck Academy",
    "logo": {
      "@type": "ImageObject",
      "url": "https://i.ibb.co/DHgVg7gr/Untitled-design-4.png"
    }
  },
  "datePublished": articleData.publishedDate,
  "dateModified": articleData.modifiedDate
})

// Learning Resource Structured Data for Planck Sketch
export const sketchResourceStructuredData = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "Planck Sketch",
  "description": "Planck Sketch este un whiteboard colaborativ online, gratuit și fără cont, pentru desen, grafice matematice și explicații vizuale, accesibil printr-un singur click.",
  "learningResourceType": "Interactive Resource",
  "educationalLevel": "High school",
  "isAccessibleForFree": true,
  "url": "https://www.planck.academy/sketch",
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
  "description": "Planck Code este un mediu online de programare pentru liceu, cu IDE și online judge integrate, unde un AI Agent generează, corectează și explică codul direct în editor.",
  "learningResourceType": "Programming Environment",
  "educationalLevel": "High school",
  "isAccessibleForFree": true,
  "url": "https://www.planck.academy/planckcode",
  "author": {
    "@type": "EducationalOrganization",
    "name": "Planck Academy"
  }
}
