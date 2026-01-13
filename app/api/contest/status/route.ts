import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithToken } from '@/lib/supabaseServer'
import { isJwtExpired } from '@/lib/auth-validate'

export async function GET(request: NextRequest) {
    try {
        // Get access token from Authorization header
        const authHeader = request.headers.get('authorization') || ''
        const tokenMatch = authHeader.match(/^Bearer (.+)$/i)

        if (!tokenMatch) {
            return NextResponse.json(
                { error: 'Neautentificat', registered: false },
                { status: 401 }
            )
        }

        const accessToken = tokenMatch[1]

        if (isJwtExpired(accessToken)) {
            return NextResponse.json(
                { error: 'Sesiune expirată', registered: false },
                { status: 401 }
            )
        }

        const supabase = createServerClientWithToken(accessToken)

        // Get authenticated user
        const { data: userData, error: authError } = await supabase.auth.getUser()

        if (authError || !userData?.user) {
            return NextResponse.json(
                { error: 'Neautentificat', registered: false },
                { status: 401 }
            )
        }

        // Get registration status
        const { data: registration, error } = await supabase
            .from('contest_registrations')
            .select('*')
            .eq('user_id', userData.user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned (not registered)
            console.error('Error fetching registration:', error)
            return NextResponse.json(
                { error: 'Eroare la verificarea înscrierii' },
                { status: 500 }
            )
        }

        if (!registration) {
            return NextResponse.json({
                registered: false
            })
        }

        return NextResponse.json({
            registered: true,
            registration: {
                full_name: registration.full_name,
                school: registration.school,
                grade: registration.grade,
                contest_code: registration.contest_code,
                registered_at: registration.registered_at
            }
        })

    } catch (error) {
        console.error('Contest status error:', error)
        return NextResponse.json(
            { error: 'Eroare internă' },
            { status: 500 }
        )
    }
}
