import { NextResponse } from 'next/server'
import { getGradeById, getGradeWithChapters } from '@/lib/supabase-physics'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeChapters = searchParams.get('includeChapters') === 'true'
    const { id } = await params
    
    if (includeChapters) {
      const { grade, chapters } = await getGradeWithChapters(id)
      return NextResponse.json({ grade, chapters })
    } else {
      const grade = await getGradeById(id)
      return NextResponse.json(grade)
    }
  } catch (error) {
    console.error('Error in grade API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grade' },
      { status: 500 }
    )
  }
}
