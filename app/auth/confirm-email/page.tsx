import Link from "next/link"
import { redirect } from "next/navigation"

import { confirmEmailWithToken } from "@/lib/email-verification-server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) {
    return <ConfirmEmailResult message="Link invalid. Cere un email nou din dashboard." />
  }

  const result = await confirmEmailWithToken(token)
  if (result.ok) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    redirect(user ? "/dashboard" : "/login")
  }

  return <ConfirmEmailResult message={result.error} />
}

function ConfirmEmailResult({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#ececf1] bg-white p-8 text-center shadow-[0_30px_70px_-40px_rgba(18,20,28,0.5)]">
        <h1 className="text-2xl font-semibold text-[#0f1115]">Nu am putut confirma emailul</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#666a73]">{message}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2a2a2a] px-6 text-sm font-semibold text-[#f5f4f2]"
        >
          Mergi la dashboard
        </Link>
      </div>
    </div>
  )
}
