'use client'

import { useRealVH } from '@/hooks/useRealVH'

/**
 * Client component that initializes the real viewport height fix for mobile devices.
 * This component should be placed in the root layout.
 */
export function RealVHProvider() {
  useRealVH()
  return null
}

