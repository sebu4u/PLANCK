"use client"

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DependencyList,
  type ReactNode,
} from "react"

interface LearningPathItemChromeContextValue {
  fixedBottomBar: ReactNode | null
  registerFixedBottomBar: (registrationId: number, node: ReactNode | null) => void
  clearFixedBottomBar: (registrationId: number) => void
}

const LearningPathItemChromeContext = createContext<LearningPathItemChromeContextValue | null>(null)

let nextRegistrationId = 0

export function LearningPathItemChromeProvider({ children }: { children: ReactNode }) {
  const [fixedBottomBar, setFixedBottomBarState] = useState<ReactNode | null>(null)
  const activeRegistrationIdRef = useRef(0)

  const registerFixedBottomBar = useCallback((registrationId: number, node: ReactNode | null) => {
    activeRegistrationIdRef.current = registrationId
    setFixedBottomBarState(node)
  }, [])

  const clearFixedBottomBar = useCallback((registrationId: number) => {
    if (activeRegistrationIdRef.current === registrationId) {
      setFixedBottomBarState(null)
    }
  }, [])

  const value = useMemo(
    () => ({ fixedBottomBar, registerFixedBottomBar, clearFixedBottomBar }),
    [fixedBottomBar, registerFixedBottomBar, clearFixedBottomBar]
  )

  return (
    <LearningPathItemChromeContext.Provider value={value}>
      {children}
    </LearningPathItemChromeContext.Provider>
  )
}

export function useLearningPathItemChrome() {
  return useContext(LearningPathItemChromeContext)
}

export function useRegisterLearningPathFixedBottomBar(
  renderBar: () => ReactNode | null,
  deps: DependencyList
) {
  const registerFixedBottomBar = useLearningPathItemChrome()?.registerFixedBottomBar
  const clearFixedBottomBar = useLearningPathItemChrome()?.clearFixedBottomBar
  const registrationIdRef = useRef<number | null>(null)
  if (registrationIdRef.current === null) {
    registrationIdRef.current = ++nextRegistrationId
  }
  const renderBarRef = useRef(renderBar)
  renderBarRef.current = renderBar

  useLayoutEffect(() => {
    if (!registerFixedBottomBar || !clearFixedBottomBar) return
    const registrationId = registrationIdRef.current!
    registerFixedBottomBar(registrationId, renderBarRef.current())
    return () => clearFixedBottomBar(registrationId)
    // renderBar is read from ref; deps list drives when content meaningfully changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerFixedBottomBar, clearFixedBottomBar, ...deps])
}
