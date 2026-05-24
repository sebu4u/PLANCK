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
  setFixedBottomBar: (node: ReactNode | null) => void
}

const LearningPathItemChromeContext = createContext<LearningPathItemChromeContextValue | null>(null)

export function LearningPathItemChromeProvider({ children }: { children: ReactNode }) {
  const [fixedBottomBar, setFixedBottomBarState] = useState<ReactNode | null>(null)
  const setFixedBottomBar = useCallback((node: ReactNode | null) => {
    setFixedBottomBarState(node)
  }, [])

  const value = useMemo(
    () => ({ fixedBottomBar, setFixedBottomBar }),
    [fixedBottomBar, setFixedBottomBar]
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
  const setFixedBottomBar = useLearningPathItemChrome()?.setFixedBottomBar
  const renderBarRef = useRef(renderBar)
  renderBarRef.current = renderBar

  useLayoutEffect(() => {
    if (!setFixedBottomBar) return
    setFixedBottomBar(renderBarRef.current())
    return () => setFixedBottomBar(null)
    // renderBar is read from ref; deps list drives when content meaningfully changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFixedBottomBar, ...deps])
}
