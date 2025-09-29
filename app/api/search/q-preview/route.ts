import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { slugify } from '@/lib/slug'

type Result = {
  type: 'problem' | 'lesson'
  id: string
  title: string
  url: string
}

const escapeIlike = (value: string) => value.replace(/[%_]/g, (match) => `\\${match}`)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] as Result[] }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30',
        },
      })
    }

    const pattern = `%${escapeIlike(q)}%`

    const [lessonsRes, problemsRes] = await Promise.all([
      supabase
        .from('lessons')
        .select('id, title, is_active')
        .eq('is_active', true)
        .ilike('title', pattern)
        .order('order_index', { ascending: true })
        .limit(6),
      supabase
        .from('problems')
        .select('id, title')
        .or(`title.ilike.${pattern},id.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(6),
    ])

    const results: Result[] = []

    if (!lessonsRes.error && lessonsRes.data) {
      for (const lesson of lessonsRes.data as any[]) {
        results.push({
          type: 'lesson',
          id: lesson.id,
          title: lesson.title,
          url: `/cursuri/${slugify(lesson.title)}`,
        })
      }
    }

    if (!problemsRes.error && problemsRes.data) {
      for (const problem of problemsRes.data as any[]) {
        results.push({
          type: 'problem',
          id: problem.id,
          title: problem.title,
          url: `/probleme/${problem.id}`,
        })
      }
    }

    const unique = new Map<string, Result>()
    for (const r of results) {
      if (!unique.has(r.url)) unique.set(r.url, r)
    }

    const ordered = Array.from(unique.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'lesson' ? -1 : 1
      return a.title.localeCompare(b.title)
    })

    return NextResponse.json({ results: ordered }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30',
      },
    })
  } catch (error) {
    console.error('Search preview error:', error)
    return NextResponse.json({ results: [] as Result[] }, { status: 200 })
  }
}


