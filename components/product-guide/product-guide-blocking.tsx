"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type ProductGuideBlockingContextValue = {
  isBlocked: boolean
  setBlocked: (key: string, blocked: boolean) => void
}

const ProductGuideBlockingContext = createContext<ProductGuideBlockingContextValue | null>(null)

export function ProductGuideBlockingProvider({ children }: { children: ReactNode }) {
  const [blockedKeys, setBlockedKeys] = useState<Record<string, boolean>>({})

  const setBlocked = useCallback((key: string, blocked: boolean) => {
    setBlockedKeys((prev) => {
      const nextValue = Boolean(blocked)
      if (Boolean(prev[key]) === nextValue) return prev
      if (!nextValue) {
        if (!(key in prev)) return prev
        const { [key]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: true }
    })
  }, [])

  const isBlocked = useMemo(
    () => Object.values(blockedKeys).some(Boolean),
    [blockedKeys],
  )

  const value = useMemo(
    () => ({ isBlocked, setBlocked }),
    [isBlocked, setBlocked],
  )

  return (
    <ProductGuideBlockingContext.Provider value={value}>
      {children}
    </ProductGuideBlockingContext.Provider>
  )
}

export function useProductGuideBlocking(): ProductGuideBlockingContextValue {
  const ctx = useContext(ProductGuideBlockingContext)
  if (!ctx) {
    return {
      isBlocked: false,
      setBlocked: () => {},
    }
  }
  return ctx
}
