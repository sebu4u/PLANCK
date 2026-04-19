"use client"

/**
 * Exemplu: afișează email când ești autentificat și butonul de login când nu.
 * Poți copia pattern-ul în navbar sau pagini.
 */
import { LoginButton } from "@/components/LoginButton"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

export function AuthUserEmailExample() {
  const { user, loading } = useAuth()
  const { toast } = useToast()

  if (loading) {
    return (
      <div className="h-10 w-full max-w-sm animate-pulse rounded-md bg-muted/40" aria-hidden />
    )
  }

  if (user?.email) {
    return (
      <p
        className="animate-in fade-in duration-300 text-sm text-foreground"
        suppressHydrationWarning
      >
        {user.email}
      </p>
    )
  }

  return (
    <div className="w-full max-w-sm animate-in fade-in duration-300">
      <LoginButton
        onError={(msg) =>
          toast({
            title: "Autentificare",
            description: msg,
            variant: "destructive",
          })
        }
      />
    </div>
  )
}
