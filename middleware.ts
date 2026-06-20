import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet, headers) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                    Object.entries(headers).forEach(([key, value]) =>
                        response.headers.set(key, value)
                    )
                },
            },
        }
    )

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    await supabase.auth.getUser()

    // Belt-and-suspenders: never cache middleware responses that may carry refreshed auth cookies.
    if (!response.headers.get('Cache-Control')) {
        response.headers.set('Cache-Control', 'private, no-store')
    }

    return response
}

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api/stripe/webhook (Stripe must hit raw webhook route directly)
         * - Public read-only APIs (cached; no session refresh needed)
         * - ISR catalog/marketing pages (client fetches auth state when needed)
         * - _next/static, _next/image, favicon, static images
         */
        '/((?!api/stripe/webhook|api/search(?:/|$)|api/physics(?:/|$)|probleme(?:/|$)|informatica/probleme(?:/|$)|matematica/probleme(?:/|$)|invata(?:/|$)|cursuri(?:/|$)|exerseaza(?:/|$)|simulari-bac(?:/|$)|grile(?:/|$)|biologie/grile(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
