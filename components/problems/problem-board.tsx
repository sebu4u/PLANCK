"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import type { TLStore, Editor } from "@tldraw/tldraw"
import { DefaultSizeStyle } from "@tldraw/tlschema"
import "@tldraw/tldraw/tldraw.css"

// Lazy load Tldraw to reduce initial bundle size
const Tldraw = dynamic(
  () => import("@tldraw/tldraw").then((mod) => {
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
  userId?: string | null
  store?: TLStore
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

export function ProblemBoard({ problemId, store: externalStore }: ProblemBoardProps) {
  const [isReady, setIsReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const editorReadyVersionRef = useRef(0)

  // Setup right-click panning when editor is ready
  useEffect(() => {
    if (!isReady || !editorRef.current || !containerRef.current) {
      return
    }

    const container = containerRef.current
    const editor = editorRef.current

    let currentCanvas: HTMLElement | null = null
    let cleanupCanvasListeners: (() => void) | null = null

    const detachCanvasListeners = () => {
      if (cleanupCanvasListeners) {
        cleanupCanvasListeners()
        cleanupCanvasListeners = null
      }
      currentCanvas = null
    }

    const attachPanHandlers = (canvas: HTMLElement) => {
      const panState = {
        isPressed: false,
        isPanning: false,
        pointerId: null as number | null,
        lastX: 0,
        lastY: 0,
        shouldBlockContextMenu: false,
      }

      let previousCursor: ReturnType<Editor['getInstanceState']>['cursor'] | null = null

      const stopPanning = () => {
        if (panState.isPanning && previousCursor) {
          editor.setCursor(previousCursor)
        }
        panState.isPanning = false
        previousCursor = null
      }

      const resetState = () => {
        panState.isPressed = false
        panState.pointerId = null
        stopPanning()
      }

      // Helper function to check if drawing tool is active
      const isDrawingToolActive = () => {
        try {
          const currentToolId = editor.getCurrentToolId()
          // Check if the current tool is a drawing tool (draw, pencil, etc.)
          return currentToolId === 'draw' || currentToolId === 'pencil' || currentToolId === 'brush'
        } catch (err) {
          return false
        }
      }

      const handlePointerDown = (event: PointerEvent) => {
        // On mobile/touch devices, check if drawing tool is active
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen'
        
        if (isTouch && isDrawingToolActive()) {
          // Allow drawing on mobile when pencil/draw tool is selected
          return
        }

        // For right-click (button === 2), always allow panning
        if (event.button !== 2) {
          return
        }

        panState.isPressed = true
        panState.pointerId = event.pointerId
        panState.lastX = event.clientX
        panState.lastY = event.clientY
        panState.shouldBlockContextMenu = false
      }

      const handlePointerMove = (event: PointerEvent) => {
        // Don't interfere with drawing on mobile when drawing tool is active
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen'
        if (isTouch && isDrawingToolActive()) {
          return
        }

        if (!panState.isPressed || event.pointerId !== panState.pointerId) {
          return
        }

        const dx = event.clientX - panState.lastX
        const dy = event.clientY - panState.lastY

        if (!panState.isPanning) {
          if (dx * dx + dy * dy < 4) {
            return
          }

          panState.isPanning = true
          previousCursor = editor.getInstanceState().cursor
          editor.setCursor({ type: 'grabbing', rotation: 0 })
          panState.shouldBlockContextMenu = true
        }

        editor.markEventAsHandled(event)
        event.preventDefault()
        event.stopPropagation()

        const { x: cx, y: cy, z: cz } = editor.getCamera()
        const zoom = cz || 1
        editor.setCamera(
          {
            x: cx + dx / zoom,
            y: cy + dy / zoom,
            z: zoom,
          },
          { immediate: true }
        )

        panState.lastX = event.clientX
        panState.lastY = event.clientY
      }

      const handlePointerUp = (event: PointerEvent) => {
        // Don't interfere with drawing on mobile when drawing tool is active
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen'
        if (isTouch && isDrawingToolActive()) {
          return
        }

        if (panState.pointerId === null || event.pointerId !== panState.pointerId) {
          return
        }

        if (panState.isPanning) {
          editor.markEventAsHandled(event)
          event.preventDefault()
          event.stopPropagation()
        }

        resetState()
      }

      const handleContextMenu = (event: MouseEvent) => {
        if (panState.shouldBlockContextMenu) {
          event.preventDefault()
          panState.shouldBlockContextMenu = false
        }
      }

      canvas.addEventListener('pointerdown', handlePointerDown, true)
      document.addEventListener('pointermove', handlePointerMove, true)
      document.addEventListener('pointerup', handlePointerUp, true)
      document.addEventListener('pointercancel', handlePointerUp, true)
      canvas.addEventListener('contextmenu', handleContextMenu)

      cleanupCanvasListeners = () => {
        canvas.removeEventListener('pointerdown', handlePointerDown, true)
        document.removeEventListener('pointermove', handlePointerMove, true)
        document.removeEventListener('pointerup', handlePointerUp, true)
        document.removeEventListener('pointercancel', handlePointerUp, true)
        canvas.removeEventListener('contextmenu', handleContextMenu)
        resetState()
      }
    }

    const tryAttach = () => {
      const nextCanvas = container.querySelector<HTMLElement>('.tl-canvas')

      if (!nextCanvas || nextCanvas === currentCanvas) {
        return
      }

      detachCanvasListeners()
      currentCanvas = nextCanvas
      attachPanHandlers(nextCanvas)
    }

    tryAttach()
    const observer = new MutationObserver(tryAttach)
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      detachCanvasListeners()
    }
  }, [isReady])

  useEffect(() => {
    // Only clear data if this is the first mount (no external store means we're creating a new instance)
    if (!externalStore) {
      clearTldrawDataForProblem(problemId)
    }

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
      
      // Only clear whiteboard data if this is the last instance using the store
      // (We can't easily detect this, so we'll clear on unmount of the main instance)
      if (!externalStore) {
        clearTldrawDataForProblem(problemId)
      }
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [problemId, externalStore])

  return (
    <div ref={containerRef} className="relative h-full min-h-[500px] w-full overflow-hidden" style={{ isolation: 'isolate', zIndex: 1 }}>
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {/* Don't use persistenceKey - this prevents any data persistence */}
        {/* Tldraw will work in memory only and won't save any data */}
        {/* If store is provided, use it to share state between instances */}
        <Tldraw
          store={externalStore}
          licenseKey="tldraw-2026-02-28/WyJmWVRrODVnNSIsWyIqIl0sMTYsIjIwMjYtMDItMjgiXQ.LfYobRlq42wKRiuYggl0DPR+eDYcMWDlRyU0d1RmYpLmMclP+vlJhHz4AGYtmcuQT39nYGP0ywhBwliKp3f4pg"
          onMount={(instance) => {
            editorRef.current = instance
            editorReadyVersionRef.current += 1
            
            // Set default pen/brush size to smallest ('s')
            try {
              const currentSize = instance.getStyleForNextShape(DefaultSizeStyle)
              if (currentSize !== 's') {
                instance.setStyleForNextShapes(DefaultSizeStyle, 's')
              }
            } catch (err) {
              console.warn('[ProblemBoard] Failed to set default pen size:', err)
            }
            
            setIsReady(true)
          }}
          autoFocus={!externalStore}
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
