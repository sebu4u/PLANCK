import { NextRequest, NextResponse } from 'next/server'
import { getAllGrades } from '@/lib/supabase-physics'
import { DEFAULT_CURSURI_SUBJECT, isCursuriSubjectId } from '@/lib/cursuri-subjects'

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get('subject')?.trim() || DEFAULT_CURSURI_SUBJECT
    const subject = isCursuriSubjectId(raw) ? raw : DEFAULT_CURSURI_SUBJECT
    const grades = await getAllGrades(subject)
    return NextResponse.json(grades, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error in grades API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}
