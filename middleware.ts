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

    // Refresh cookies if the access token is expired. This middleware does not
    // authorize routes — it only keeps the SSR cookie session alive.
    // `getSession()` does that locally and only hits Auth when a refresh is due.
    // `getUser()` would add an HTTP roundtrip to Supabase on every navigation.
    await supabase.auth.getSession()

    // Belt-and-suspenders: never cache middleware responses that may carry refreshed auth cookies.
    if (!response.headers.get('Cache-Control')) {
        response.headers.set('Cache-Control', 'private, no-store')
    }

    return response
}

function hasSupabaseAuthCookie(request: NextRequest) {
    return request.cookies.getAll().some(({ name }) => name.includes('-auth-token'))
}

export async function middleware(request: NextRequest) {
    // Anonymous traffic has nothing to refresh — skip the Supabase client entirely.
    if (!hasSupabaseAuthCookie(request)) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
    /*
     * Match all request paths except:
     * - `$` — homepage `/` (static/ISR; auth redirect is client-side)
     * - api/stripe/webhook (Stripe must hit raw webhook route directly)
     * - Public read-only APIs (cached; no session refresh needed)
     * - ISR catalog/marketing pages (client fetches auth state when needed)
     * - sitemap.xml / robots.txt (bot crawl; no session)
     * - _next/static, _next/image, favicon, static images
     *
     * Note: `api/user/marketing-emails` is intentionally NOT excluded. It uses
     * the cookie client (`@/lib/supabase/server`) whose `setAll` silently
     * depends on the middleware session refresh — skipping it here breaks it.
     * See AGENTS.md → planck-performance skill.
     */
         '/((?!$|insight(?:/|$)|pricing(?:/|$)|despre(?:/|$)|blog(?:/|$)|landing(?:/|$)|planck-week(?:/|$)|contact(?:/|$)|login(?:/|$)|register(?:/|$)|castiga(?:/|$)|shop(?:/|$)|sitemap\\.xml|robots\\.txt|api/stripe/webhook|api/stripe/checkout|api/stripe/sync|api/stripe/portal|api/search(?:/|$)|api/physics(?:/|$)|api/admin(?:/|$)|api/insight(?:/|$)|api/dev(?:/|$)|api/coding-problems(?:/|$)|api/run(?:/|$)|api/run-interactive(?:/|$)|api/mailerlite/webhook(?:/|$)|probleme(?:/|$)|informatica/probleme(?:/|$)|matematica/probleme(?:/|$)|invata(?:/|$)|cursuri(?:/|$)|exerseaza(?:/|$)|simulari-bac(?:/|$)|grile(?:/|$)|biologie/grile(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
