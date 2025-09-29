import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { slugify } from '@/lib/slug'

type SearchResult = {
  type: 'problem' | 'lesson'
  id: string
  title: string
  url: string
  extra?: Record<string, any>
}

const escapeIlike = (value: string) => value.replace(/[%_]/g, (match) => `\\${match}`)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const limitParam = parseInt(searchParams.get('limit') || '8', 10)
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Math.min(Math.max(limitParam, 1), 20)
    const offset = Math.max(offsetParam, 0)

    if (!q) {
      return NextResponse.json({ results: [] as SearchResult[], hasMore: false }, { headers: { 'Cache-Control': 'public, s-maxage=60' } })
    }

    const qLower = q.toLowerCase()
    const pattern = `%${escapeIlike(q)}%`
    const fetchCount = Math.min(offset + limit + 10, 100)

    const [problemsRes, lessonsRes] = await Promise.all([
      supabase
        .from('problems')
        .select('id, title, tags')
        .or(
          `title.ilike.${pattern},id.ilike.${pattern}`
        )
        .order('created_at', { ascending: false })
        .limit(fetchCount),
      supabase
        .from('lessons')
        .select('id, title, is_active')
        .eq('is_active', true)
        .ilike('title', pattern)
        .order('order_index', { ascending: true })
        .limit(fetchCount),
    ])

    const results: SearchResult[] = []

    if (!problemsRes.error && problemsRes.data) {
      for (const p of problemsRes.data as any[]) {
        const tagsArray = Array.isArray(p.tags)
          ? p.tags
          : typeof p.tags === 'string' && p.tags
          ? [p.tags]
          : []
        const hay = `${p.title || ''} ${p.id || ''} ${tagsArray.join(' ')}`.toLowerCase()
        if (hay.includes(qLower)) {
          results.push({ type: 'problem', id: p.id, title: p.title, url: `/probleme/${p.id}` })
        }
      }
    }

    if (!lessonsRes.error && lessonsRes.data) {
      for (const l of lessonsRes.data as any[]) {
        const hay = `${l.title}`.toLowerCase()
        if (hay.includes(qLower)) {
          results.push({ type: 'lesson', id: l.id, title: l.title, url: `/cursuri/${slugify(l.title)}` })
        }
      }
    }

    // Deduplicate by url and sort: lessons first, then problems; alphabetical inside type
    const unique = new Map<string, SearchResult>()
    for (const r of results) {
      if (!unique.has(r.url)) unique.set(r.url, r)
    }

    const sortedResults = Array.from(unique.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'lesson' ? -1 : 1
      return a.title.localeCompare(b.title)
    })

    const slicedResults = sortedResults.slice(offset, offset + limit)
    const hasMore = offset + slicedResults.length < sortedResults.length

    return NextResponse.json({ results: slicedResults, hasMore }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}


