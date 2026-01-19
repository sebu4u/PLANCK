'use client'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Ceva nu a mers bine
              </h1>
              <p className="text-muted-foreground">
                A apărut o eroare neașteptată. Te rugăm să încerci din nou.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Încearcă din nou
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reîncarcă pagina
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Acasă
            </Button>
          </div>
        </div>
      </div>
  )
}

