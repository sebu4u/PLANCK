"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Lazy load Tldraw to reduce initial bundle size
const Tldraw = dynamic(
  () => import("@tldraw/tldraw").then((mod) => {
    // Import CSS when component loads
    if (typeof window !== 'undefined') {
      import("@tldraw/tldraw/tldraw.css")
    }
    return { default: mod.Tldraw }
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
        <div className="text-center text-white/60">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
          <p>Se pregătește tabla…</p>
        </div>
      </div>
    ),
  }
)

interface ProblemBoardProps {
  problemId: string
  userId: string | null
}

// Helper function to clear all Tldraw data for a problem
async function clearTldrawDataForProblem(problemId: string) {
  if (typeof window === 'undefined') return

  try {
    const problemKey = `problem-board-${problemId}`
    
    // Clear localStorage keys related to this problem
    const keysToRemove: string[] = []
    
    // Check all localStorage keys
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.includes(problemKey)) {
        keysToRemove.push(key)
      }
    }
    
    // Remove all matching keys from localStorage
    keysToRemove.forEach(key => {
      window.localStorage.removeItem(key)
    })
    
    // Clear IndexedDB data (Tldraw uses IndexedDB for persistence)
    // Tldraw stores data in IndexedDB - we need to find and delete all databases for this problem
    if ('indexedDB' in window && indexedDB.databases) {
      try {
        const databases = await indexedDB.databases()
        databases.forEach(db => {
          if (db.name && db.name.includes(problemKey)) {
            try {
              indexedDB.deleteDatabase(db.name)
            } catch (e) {
              // Ignore errors
            }
          }
        })
      } catch (e) {
        // Fallback: try common database name formats if databases() is not available
        const dbNames = [
          `tldraw-store-${problemKey}`,
          `tl-store-${problemKey}`,
          `tldraw_${problemKey}`,
          `tl_${problemKey}`,
          `tldraw-${problemKey}`,
          `tl-${problemKey}`,
        ]
        
        dbNames.forEach(dbName => {
          try {
            indexedDB.deleteDatabase(dbName)
          } catch (err) {
            // Ignore errors
          }
        })
      }
    }
  } catch (error) {
    console.warn('Failed to clear whiteboard data:', error)
  }
}

export function ProblemBoard({ problemId }: ProblemBoardProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Clear any old data immediately when component mounts (in case persistence was used before)
    clearTldrawDataForProblem(problemId)

    // Inject CSS to limit tldraw z-index values
    const styleId = `tldraw-z-index-fix-${problemId}`
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      /* Limit tldraw z-index to be below navbar (z-[300]) */
      /* Target all tldraw UI elements */
      .tlui-menu,
      .tlui-menu-container,
      .tlui-popup,
      .tlui-dialog,
      .tlui-menu-zone,
      .tlui-toolbar,
      .tlui-help-menu,
      .tlui-navigation-panel,
      .tlui-page-menu,
      .tlui-style-panel,
      .tlui-topbar,
      .tlui-buttons__button,
      [class*="tlui-"],
      [data-tldraw] {
        z-index: 1 !important;
      }
      /* Ensure tldraw canvas is below everything */
      .tl-container {
        z-index: 0 !important;
      }
    `
    document.head.appendChild(style)

    // Clear data on page unload (when user leaves the page) as backup
    const handleBeforeUnload = () => {
      clearTldrawDataForProblem(problemId)
    }
    const handlePageHide = () => {
      clearTldrawDataForProblem(problemId)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      // Cleanup: remove the style when component unmounts
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
      
      // Clear whiteboard data when user leaves the problem (backup cleanup)
      clearTldrawDataForProblem(problemId)
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [problemId])

  return (
    <div className="relative h-full min-h-[500px] w-full overflow-hidden" style={{ isolation: 'isolate', zIndex: 1 }}>
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {/* Don't use persistenceKey - this prevents any data persistence */}
        {/* Tldraw will work in memory only and won't save any data */}
        <Tldraw
          licenseKey="tldraw-2026-02-28/WyJmWVRrODVnNSIsWyIqIl0sMTYsIjIwMjYtMDItMjgiXQ.LfYobRlq42wKRiuYggl0DPR+eDYcMWDlRyU0d1RmYpLmMclP+vlJhHz4AGYtmcuQT39nYGP0ywhBwliKp3f4pg"
          onMount={(instance) => {
            setIsReady(true)
          }}
          autoFocus
        />
      </div>

      {!isReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <div className="text-center text-white/60">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
            <p>Se pregătește tabla…</p>
          </div>
        </div>
      )}
    </div>
  )
}
