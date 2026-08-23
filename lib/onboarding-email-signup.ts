import { supabase } from "@/lib/supabaseClient"
import { fireSendConfirmationEmail } from "@/lib/email-confirmation-client"
import { isAlreadyRegisteredError } from "@/lib/email-verification"

export async function signUpWithEmailPassword(
  email: string,
  password: string,
): Promise<
  | { ok: true }
  | { ok: false; alreadyRegistered?: boolean; noSession?: boolean; message: string }
> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      return {
        ok: false,
        alreadyRegistered: true,
        message: "Ai deja un cont. Autentifică-te din Login.",
      }
    }
    return { ok: false, message: error.message }
  }

  if (!data.session) {
    return {
      ok: false,
      noSession: true,
      message: "Contul a fost creat, dar nu te-am putut conecta automat. Încearcă din Login.",
    }
  }

  fireSendConfirmationEmail(data.session.access_token)
  return { ok: true }
}
