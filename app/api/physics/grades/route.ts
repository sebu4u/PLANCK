import { NextResponse } from 'next/server'
import { getAllGrades } from '@/lib/supabase-physics'

export async function GET() {
  try {
    const grades = await getAllGrades()
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
