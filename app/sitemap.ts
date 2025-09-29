import { MetadataRoute } from 'next'
import { 
  getAllGrades, 
  getChaptersByGradeId, 
  getLessonSummariesByChapterId 
} from '@/lib/supabase-physics'
import { slugify } from '@/lib/slug'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.planck.academy'
  
  // Get all lessons for dynamic sitemap
  const grades = await getAllGrades()
  const allLessons: Array<{ title: string; id: string; updated_at: string }> = []
  
  for (const grade of grades) {
    const chapters = await getChaptersByGradeId(grade.id)
    for (const chapter of chapters) {
      const lessons = await getLessonSummariesByChapterId(chapter.id)
      allLessons.push(...lessons.map(l => ({
        title: l.title,
        id: l.id,
        updated_at: new Date().toISOString()
      })))
    }
  }
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Paginated problems pages (first 10)
    ...Array.from({ length: 10 }, (_, i) => ({
      url: `${baseUrl}/probleme/pagina/${i + 1}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7 as const,
    })),
    {
      url: `${baseUrl}/cursuri`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/probleme`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/despre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/ajutor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/termeni`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Dynamic lesson URLs
    ...allLessons.map(lesson => ({
      url: `${baseUrl}/cursuri/${slugify(lesson.title)}`,
      lastModified: new Date(lesson.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
