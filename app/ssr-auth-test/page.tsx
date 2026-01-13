import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SSRAuthTestPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login?next=/ssr-auth-test')
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
            <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
                <h1 className="mb-4 text-2xl font-bold">SSR Auth Verification</h1>
                <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    ✅ Authenticated on server
                </div>
                <div className="space-y-2 text-sm">
                    <p>
                        <span className="font-semibold">Email:</span> {user.email}
                    </p>
                    <p>
                        <span className="font-semibold">User ID:</span> {user.id}
                    </p>
                    <p>
                        <span className="font-semibold">Last Sign In:</span>{' '}
                        {new Date(user.last_sign_in_at!).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    )
}
