import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This proxy is disabled - redirect logic is handled client-side in the homepage
// to avoid issues with Supabase cookie detection in proxy
export async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}



