import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithToken } from '@/lib/supabaseServer'
import { isJwtExpired } from '@/lib/auth-validate'

export async function POST(request: NextRequest) {
    try {
        // Get access token from Authorization header
        const authHeader = request.headers.get('authorization') || ''
        const tokenMatch = authHeader.match(/^Bearer (.+)$/i)

        if (!tokenMatch) {
            return NextResponse.json(
                { error: 'Trebuie să fii autentificat pentru a te înscrie' },
                { status: 401 }
            )
        }

        const accessToken = tokenMatch[1]

        if (isJwtExpired(accessToken)) {
            return NextResponse.json(
                { error: 'Sesiune expirată. Te rugăm să te autentifici din nou.' },
                { status: 401 }
            )
        }

        const supabase = createServerClientWithToken(accessToken)

        // Get authenticated user
        const { data: userData, error: authError } = await supabase.auth.getUser()

        if (authError || !userData?.user) {
            return NextResponse.json(
                { error: 'Trebuie să fii autentificat pentru a te înscrie' },
                { status: 401 }
            )
        }

        const user = userData.user

        // Parse request body
        const body = await request.json()
        const { full_name, school, grade } = body

        // Validate required fields
        if (!full_name || !school || !grade) {
            return NextResponse.json(
                { error: 'Toate câmpurile sunt obligatorii' },
                { status: 400 }
            )
        }

        // Validate grade
        const validGrades = ['IX', 'X', 'XI', 'XII']
        if (!validGrades.includes(grade)) {
            return NextResponse.json(
                { error: 'Clasa selectată nu este validă' },
                { status: 400 }
            )
        }

        // Check if already registered
        const { data: existing } = await supabase
            .from('contest_registrations')
            .select('contest_code')
            .eq('user_id', user.id)
            .single()

        if (existing) {
            return NextResponse.json({
                success: true,
                already_registered: true,
                contest_code: existing.contest_code,
                message: 'Ești deja înscris la concurs'
            })
        }

        // Generate unique contest code
        const { data: codeData, error: codeError } = await supabase
            .rpc('generate_contest_code')

        if (codeError) {
            console.error('Error generating contest code:', codeError)
            return NextResponse.json(
                { error: 'Eroare la generarea codului de concurs' },
                { status: 500 }
            )
        }

        const contest_code = codeData as string

        // Insert registration
        const { data: registration, error: insertError } = await supabase
            .from('contest_registrations')
            .insert({
                user_id: user.id,
                full_name: full_name.trim(),
                school: school.trim(),
                grade,
                contest_code
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error inserting registration:', insertError)

            // Handle unique constraint violation (user already registered)
            if (insertError.code === '23505') {
                return NextResponse.json(
                    { error: 'Ești deja înscris la concurs' },
                    { status: 409 }
                )
            }

            return NextResponse.json(
                { error: 'Eroare la înregistrare. Te rugăm să încerci din nou.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            contest_code: registration.contest_code,
            message: 'Te-ai înscris cu succes la concurs!'
        })

    } catch (error) {
        console.error('Contest registration error:', error)
        return NextResponse.json(
            { error: 'Eroare internă. Te rugăm să încerci din nou.' },
            { status: 500 }
        )
    }
}
