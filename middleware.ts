import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware is disabled - redirect logic is handled client-side in the homepage
// to avoid issues with Supabase cookie detection in middleware
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}

