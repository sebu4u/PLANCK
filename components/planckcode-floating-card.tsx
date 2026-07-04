"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Code, X } from "lucide-react"
import { usePlanckIdeFloating } from "@/components/planckcode-floating-provider"
import { cn } from "@/lib/utils"

const EmbeddedIDE = dynamic(() => import("@/components/coding-problems/embedded-ide"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-white/50">
      Se încarcă editorul...
    </div>
  ),
})

function sessionTitle(session: NonNullable<ReturnType<typeof usePlanckIdeFloating>["session"]>) {
  if (session.source === "problem") {
    return "Problemă informatică"
  }
  return "PlanckCode IDE"
}

export function PlanckIdeFloatingCard() {
  const router = useRouter()
  const { session, isVisible, cardSize, entryAnimationActive, setCardSize, closeSession, updateWorkspace } =
    usePlanckIdeFloating()

  if (!isVisible || !session || entryAnimationActive) {
    return null
  }

  const isExpanded = cardSize === "expanded"
  const hint = isExpanded ? "Click pentru a deschide pagina" : "Click pentru mărire"

  const handleHeaderClick = () => {
    if (!isExpanded) {
      setCardSize("expanded")
      return
    }
    router.push(session.returnPath)
  }

  return (
    <>
      {isExpanded ? (
        <button
          type="button"
          aria-label="Restrânge IDE"
          className="fixed inset-0 z-[279] cursor-default bg-transparent"
          onClick={() => setCardSize("mini")}
        />
      ) : null}
      <div
        className={cn(
          "fixed z-[280] flex flex-col overflow-hidden rounded-xl border border-[#3b3b3b] bg-[#181818] shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-200 animate-in fade-in duration-200",
          "max-md:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] max-md:right-3",
          "md:bottom-4 md:right-4",
          isExpanded
            ? "h-[min(480px,70vh)] w-[min(640px,calc(100vw-2rem))]"
            : "h-[220px] w-[min(320px,calc(100vw-2rem))]",
        )}
        role="dialog"
        aria-label={sessionTitle(session)}
      >
        <button
          type="button"
          onClick={handleHeaderClick}
          className="group relative flex shrink-0 items-center gap-2 border-b border-[#3b3b3b] bg-[#1e1e1e] px-3 py-2 text-left transition-colors hover:bg-[#262626]"
        >
          <Code className="h-4 w-4 shrink-0 text-white/80" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{sessionTitle(session)}</div>
            <div className="truncate text-[11px] text-white/45">{hint}</div>
          </div>
          <span
            role="button"
            tabIndex={0}
            aria-label="Închide IDE"
            onClick={(event) => {
              event.stopPropagation()
              closeSession()
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                event.stopPropagation()
                closeSession()
              }
            }}
            className="absolute right-2 top-2 rounded-md p-1 text-white/70 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </span>
        </button>

        <div className="min-h-0 flex-1" onClick={(event) => event.stopPropagation()}>
          <EmbeddedIDE
            key={session.returnPath}
            presentation="floating"
            hideRunActions={!isExpanded}
            defaultLanguage={session.defaultLanguage}
            initialFiles={session.files}
            initialActiveFileId={session.activeFileId}
            problemSlug={session.problemSlug ?? null}
            onWorkspaceChange={updateWorkspace}
          />
        </div>
      </div>
    </>
  )
}
