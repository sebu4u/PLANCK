import { NextResponse } from 'next/server'
import { getChapterById, getChapterWithLessons } from '@/lib/supabase-physics'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeLessons = searchParams.get('includeLessons') === 'true'
    const { id } = await params
    
    if (includeLessons) {
      const { chapter, lessons } = await getChapterWithLessons(id)
      return NextResponse.json({ chapter, lessons })
    } else {
      const chapter = await getChapterById(id)
      return NextResponse.json(chapter)
    }
  } catch (error) {
    console.error('Error in chapter API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    )
  }
}
