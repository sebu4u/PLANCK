import { MetadataRoute } from 'next'
import {
  getAllGrades,
  getChaptersByGradeId
} from '@/lib/supabase-physics'
import { slugify } from '@/lib/slug'
import { supabase } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'

async function fetchPhysicsProblemsSitemapEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return []
  }

  const client = createClient(supabaseUrl, supabaseAnonKey)
  const pageSize = 1000
  const accumulated: Array<{ id: string; created_at: string }> = []

  for (;;) {
    const from = accumulated.length
    const to = from + pageSize - 1
    const { data, error } = await client
      .from('problems')
      .select('id, created_at')
      .order('id', { ascending: true })
      .range(from, to)

    if (error || !data?.length) {
      break
    }

    for (const row of data) {
      accumulated.push({
        id: String((row as { id: string }).id),
        created_at: (row as { created_at?: string | null }).created_at || new Date().toISOString(),
      })
    }

    if (data.length < pageSize) {
      break
    }
  }

  return accumulated.map((row) => ({
    url: `${baseUrl}/probleme/${encodeURIComponent(row.id)}`,
    lastModified: new Date(row.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.55 as const,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.planck.academy'

  const problemEntries = await fetchPhysicsProblemsSitemapEntries(baseUrl)

  // Get all lessons for dynamic sitemap with updated_at
  const grades = await getAllGrades()
  const allLessons: Array<{ title: string; id: string; updated_at: string }> = []

  for (const grade of grades) {
    const chapters = await getChaptersByGradeId(grade.id)
    for (const chapter of chapters) {
      // Fetch lessons with updated_at field directly from Supabase
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('id, title, updated_at')
        .eq('chapter_id', chapter.id)
        .eq('is_active', true)
        .order('order_index')

      if (!error && lessons) {
        allLessons.push(...lessons.map(l => ({
          title: l.title,
          id: l.id,
          updated_at: l.updated_at || new Date().toISOString()
        })))
      }
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
      url: `${baseUrl}/sketch`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/insight`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/planckcode`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/planckcode/ide`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
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
      url: `${baseUrl}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/termeni`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
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
    ...problemEntries,
  ]
}
