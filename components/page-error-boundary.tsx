"use client"

import { ErrorBoundary } from './error-boundary'
import { ReactNode } from 'react'

interface PageErrorBoundaryProps {
  children: ReactNode
}

/**
 * Error Boundary wrapper for pages
 * Provides a more specific error UI for page-level errors
 */
export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
          <div className="max-w-xl w-full space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-foreground">
                Eroare la încărcarea paginii
              </h1>
              <p className="text-muted-foreground">
                Ne pare rău, dar pagina pe care o căutați nu poate fi încărcată.
                Te rugăm să încerci din nou sau să revii la pagina principală.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

