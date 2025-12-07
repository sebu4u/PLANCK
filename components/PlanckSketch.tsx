"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Tldraw, createTLStore, defaultShapeUtils, Editor, TLRecord } from "@tldraw/tldraw";
import { DefaultSizeStyle } from "@tldraw/tlschema";
import "@tldraw/tldraw/tldraw.css";
import PartySocket from "partysocket";
import { PageNavigator } from "@/components/sketch/PageNavigator";
import { ShareButton } from "@/components/sketch/ShareButton";
import { Calculator, X, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathGraphPanel } from "@/components/sketch/MathGraphPanel";
import { WhiteboardNavbar } from "@/components/sketch/WhiteboardNavbar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

interface UserInfo {
  connectionId: string;
  userId?: string;
  name?: string;
  nickname?: string;
  userIcon?: string;
  email?: string;
}

// Record types that are ephemeral (per-user, NOT shared between users)
// These include camera position, zoom, cursor state, etc.
const EPHEMERAL_TYPES = new Set([
  'instance',
  'instance_page_state', 
  'instance_presence',
  'camera',
]);

// Check if a record is ephemeral (should not be synced between users)
const isEphemeralRecord = (record: any): boolean => {
  return EPHEMERAL_TYPES.has(record?.typeName);
};

export default function PlanckSketch({ roomId }: { roomId: string }) {
  const store = useMemo(() => createTLStore({ shapeUtils: defaultShapeUtils }), []);
  const { user, profile } = useAuth();
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<string>("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isMathGraphOpen, setIsMathGraphOpen] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<UserInfo[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [editorReadyVersion, setEditorReadyVersion] = useState(0);
  const socketRef = useRef<PartySocket | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionStatusRef = useRef<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [showGuestWelcome, setShowGuestWelcome] = useState(false);
  const [welcomeSlide, setWelcomeSlide] = useState(0);
  
  // Compute effective current page ID - ensures graph button appears even when currentPageId isn't set yet
  // Using useMemo to recalculate when editor, currentPageId, or store changes
  const effectiveCurrentPageId = useMemo(() => {
    if (currentPageId) return currentPageId;
    if (editor) {
      const pageId = editor.getCurrentPageId();
      if (pageId) return pageId;
    }
    // Try to get first page from editor's pages
    if (editor) {
      try {
        const pages = editor.getPages();
        if (pages.length > 0) {
          return pages[0].id;
        }
      } catch (e) {
        // Ignore errors
      }
    }
    // Try to get first page from store
    if (store) {
      try {
        const pages = store.allRecords().filter((r: any) => r.typeName === 'page');
        if (pages.length > 0) {
          return pages[0].id as string;
        }
      } catch (e) {
        // Ignore errors
      }
    }
    return null;
  }, [currentPageId, editor, store]);

  // Limit tldraw toolbox z-index to be below MathGraphPanel
  useEffect(() => {
    const styleId = 'planck-sketch-tldraw-z-index-fix';
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Limit tldraw UI elements z-index to be below MathGraphPanel (z-[100]) */
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
        z-index: 10 !important;
      }
      /* Ensure tldraw canvas is below everything */
      .tl-container {
        z-index: 0 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;

    // Reset connection status
    setConnectionStatus('connecting');
    connectionStatusRef.current = 'connecting';
    setConnectionError(null);

    // Clear any previous timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
      party: "main",
    });
    
    socketRef.current = socket;

    const onOpen = () => {
      console.log("[PlanckSketch] Connected to PartyKit!");
      // Clear timeout on successful connection
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      setConnectionStatus('connected');
      connectionStatusRef.current = 'connected';
      setConnectionError(null);
      
      // Send user info to server if user is logged in
      if (user && socket) {
        const userInfo = {
          type: "user-info",
          userId: user.id,
          name: profile?.name || user.user_metadata?.name,
          nickname: profile?.nickname,
          userIcon: profile?.user_icon,
          email: user.email,
        };
        socket.send(JSON.stringify(userInfo));
        console.log("[PlanckSketch] Sent user info to server");
      }
    };

    const onClose = (event?: CloseEvent) => {
      console.log("[PlanckSketch] Disconnected from PartyKit", event);
      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Silently handle disconnection - don't show errors to user
      setConnectionStatus('disconnected');
      connectionStatusRef.current = 'disconnected';
    }

    const onError = (error: Event | Error) => {
      // Silently log errors - don't show them to user
      console.error("[PlanckSketch] PartySocket error:", error);
      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Silently handle errors - don't set error status
      setConnectionStatus('disconnected');
      connectionStatusRef.current = 'disconnected';
    }

    const onMessage = (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.type === "init") {
          // Filter out ephemeral records from init payload
          // This ensures we don't apply another user's camera/zoom state
          const filteredPayload = Object.values(msg.payload).filter(
            (record: any) => !isEphemeralRecord(record)
          ) as TLRecord[];
          setLastEvent(`Init: ${filteredPayload.length} objects`);
          store.mergeRemoteChanges(() => {
            store.put(filteredPayload);
          });
        } else if (msg.type === "update") {
          const { added, updated, removed } = msg.payload;
          
          // Filter out ephemeral records from updates
          // Each user maintains their own camera position, zoom level, etc.
          const filteredAdded = added 
            ? Object.values(added).filter((record: any) => !isEphemeralRecord(record)) as TLRecord[]
            : [];
          const filteredUpdated = updated
            ? Object.values(updated).filter((record: any) => !isEphemeralRecord(record)) as TLRecord[]
            : [];
          const filteredRemoved = removed
            ? Object.keys(removed).filter((id: string) => !isEphemeralRecord(removed[id]))
            : [];
          
          const count = filteredAdded.length + filteredUpdated.length;
          setLastEvent(`Recv: ${count} changes`);

          store.mergeRemoteChanges(() => {
            if (filteredAdded.length > 0) store.put(filteredAdded);
            if (filteredUpdated.length > 0) store.put(filteredUpdated);
            if (filteredRemoved.length > 0) store.remove(filteredRemoved as any);
          });
        } else if (msg.type === "presence") {
          // Update connected users list with user info
          if (msg.users && Array.isArray(msg.users)) {
            setConnectedUsers(msg.users);
          }
        }
      } catch (e) {
        console.error("[PlanckSketch] Error parsing message:", e);
      }
    };

    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
    socket.addEventListener("message", onMessage);

    const cleanupListener = store.listen(
      (changes) => {
        if (changes.source !== "user") return;

        const payload: any = { added: {}, updated: {}, removed: {} };
        let hasChanges = false;

        // Filter out ephemeral records when sending updates
        // This ensures camera position, zoom, and cursor state stay local to each user
        for (const [id, record] of Object.entries(changes.changes.added)) {
          if (!isEphemeralRecord(record)) {
            payload.added[id] = record;
            hasChanges = true;
          }
        }

        for (const [id, [from, to]] of Object.entries(changes.changes.updated)) {
          if (!isEphemeralRecord(to)) {
            payload.updated[id] = to;
            hasChanges = true;
          }
        }

        for (const [id, record] of Object.entries(changes.changes.removed)) {
          if (!isEphemeralRecord(record)) {
            payload.removed[id] = { id };
            hasChanges = true;
          }
        }

        if (hasChanges) {
          socket.send(JSON.stringify({ type: "update", payload }));
          setLastEvent("Sent update");
        }
      }
    );

    return () => {
      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      socket.close();
      cleanupListener();
      setConnectionStatus('disconnected');
      connectionStatusRef.current = 'disconnected';
      socketRef.current = null;
    };
  }, [store, roomId, user, profile]);

  // Send user info when user or profile changes (after connection is established)
  useEffect(() => {
    if (socketRef.current && connectionStatus === 'connected' && user) {
      const userInfo = {
        type: "user-info",
        userId: user.id,
        name: profile?.name || user.user_metadata?.name,
        nickname: profile?.nickname,
        userIcon: profile?.user_icon,
        email: user.email,
      };
      socketRef.current.send(JSON.stringify(userInfo));
      console.log("[PlanckSketch] Sent updated user info to server");
    }
  }, [user, profile, connectionStatus]);

  // Listen for page changes via store listener
  useEffect(() => {
    if (!editor || editorReadyVersion === 0) return;

    // Listen to store changes and check for instance record updates
    const unsubscribe = store.listen((entry) => {
      const instanceId = editor.getInstanceState().id;
      // Check if the instance record was updated
      if (entry.changes.updated[instanceId]) {
        const instance = store.get(instanceId);
        if (instance && (instance as any).currentPageId) {
          const newPageId = (instance as any).currentPageId;
          setCurrentPageId((prev) => {
            if (prev !== newPageId) {
              return newPageId;
            }
            return prev;
          });
        }
      }
    }, { source: 'user', scope: 'document' });

    return () => {
      unsubscribe();
    };
  }, [editor, editorReadyVersion, store]);

  // Right-click panning handler
  useEffect(() => {
    if (editorReadyVersion === 0) {
      return;
    }

    const container = containerRef.current;
    const currentEditor = editor;

    if (!container || !currentEditor) {
      return;
    }

    let currentCanvas: HTMLElement | null = null;
    let cleanupCanvasListeners: (() => void) | null = null;

    const detachCanvasListeners = () => {
      if (cleanupCanvasListeners) {
        cleanupCanvasListeners();
        cleanupCanvasListeners = null;
      }
      currentCanvas = null;
    };

    const attachPanHandlers = (canvas: HTMLElement) => {
      const panState = {
        isPressed: false,
        isPanning: false,
        pointerId: null as number | null,
        lastX: 0,
        lastY: 0,
        shouldBlockContextMenu: false,
      };

      let previousCursor: ReturnType<Editor['getInstanceState']>['cursor'] | null = null;

      const stopPanning = () => {
        if (panState.isPanning && previousCursor) {
          currentEditor.setCursor(previousCursor);
        }
        panState.isPanning = false;
        previousCursor = null;
      };

      const resetState = () => {
        panState.isPressed = false;
        panState.pointerId = null;
        stopPanning();
      };

      // Helper function to check if drawing tool is active
      const isDrawingToolActive = () => {
        try {
          const currentToolId = currentEditor.getCurrentToolId();
          return currentToolId === 'draw' || currentToolId === 'pencil' || currentToolId === 'brush';
        } catch (err) {
          return false;
        }
      };

      const handlePointerDown = (event: PointerEvent) => {
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen';
        
        if (isTouch && isDrawingToolActive()) {
          return;
        }

        // For right-click (button === 2), always allow panning
        if (event.button !== 2) {
          return;
        }

        panState.isPressed = true;
        panState.pointerId = event.pointerId;
        panState.lastX = event.clientX;
        panState.lastY = event.clientY;
        panState.shouldBlockContextMenu = false;
      };

      const handlePointerMove = (event: PointerEvent) => {
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen';
        if (isTouch && isDrawingToolActive()) {
          return;
        }

        if (!panState.isPressed || event.pointerId !== panState.pointerId) {
          return;
        }

        const dx = event.clientX - panState.lastX;
        const dy = event.clientY - panState.lastY;

        if (!panState.isPanning) {
          if (dx * dx + dy * dy < 4) {
            return;
          }

          panState.isPanning = true;
          previousCursor = currentEditor.getInstanceState().cursor;
          currentEditor.setCursor({ type: 'grabbing', rotation: 0 });
          panState.shouldBlockContextMenu = true;
        }

        currentEditor.markEventAsHandled(event);
        event.preventDefault();
        event.stopPropagation();

        const { x: cx, y: cy, z: cz } = currentEditor.getCamera();
        const zoom = cz || 1;
        currentEditor.setCamera(
          {
            x: cx + dx / zoom,
            y: cy + dy / zoom,
            z: zoom,
          },
          { immediate: true }
        );

        panState.lastX = event.clientX;
        panState.lastY = event.clientY;
      };

      const handlePointerUp = (event: PointerEvent) => {
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen';
        if (isTouch && isDrawingToolActive()) {
          return;
        }

        if (panState.pointerId === null || event.pointerId !== panState.pointerId) {
          return;
        }

        if (panState.isPanning) {
          currentEditor.markEventAsHandled(event);
          event.preventDefault();
          event.stopPropagation();
        }

        resetState();
      };

      const handleContextMenu = (event: MouseEvent) => {
        if (panState.shouldBlockContextMenu) {
          event.preventDefault();
          panState.shouldBlockContextMenu = false;
        }
      };

      canvas.addEventListener('pointerdown', handlePointerDown, true);
      document.addEventListener('pointermove', handlePointerMove, true);
      document.addEventListener('pointerup', handlePointerUp, true);
      document.addEventListener('pointercancel', handlePointerUp, true);
      canvas.addEventListener('contextmenu', handleContextMenu);

      cleanupCanvasListeners = () => {
        canvas.removeEventListener('pointerdown', handlePointerDown, true);
        document.removeEventListener('pointermove', handlePointerMove, true);
        document.removeEventListener('pointerup', handlePointerUp, true);
        document.removeEventListener('pointercancel', handlePointerUp, true);
        canvas.removeEventListener('contextmenu', handleContextMenu);
        resetState();
      };
    };

    const tryAttach = () => {
      const nextCanvas = container.querySelector<HTMLElement>('.tl-canvas');

      if (!nextCanvas || nextCanvas === currentCanvas) {
        return;
      }

      detachCanvasListeners();
      currentCanvas = nextCanvas;
      attachPanHandlers(nextCanvas);
    };

    tryAttach();
    const observer = new MutationObserver(tryAttach);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      detachCanvasListeners();
    };
  }, [editorReadyVersion, editor]);

  // Check if user is not authenticated and show guest welcome card
  useEffect(() => {
    if (!roomId) return;
    
    // If user is authenticated, don't show the card
    if (user) {
      setShowGuestWelcome(false);
      return;
    }

    // Check if card was already dismissed for this room
    const storageKey = `planck-sketch:guestWelcome:${roomId}`;
    if (typeof window !== 'undefined') {
      const dismissed = window.localStorage.getItem(storageKey);
      if (!dismissed) {
        setShowGuestWelcome(true);
      }
    }
  }, [roomId, user]);

  const guestWelcomeSlides = [
    {
      badge: 'Planck Sketch',
      title: 'Whiteboard infinit + pagini multiple',
      description:
        'Lucrează liber pe o pânză fără margini și organizează capitolele pe pagini separate. Fără cont, tabla se salvează local — cu un cont îți păstrezi progresul oriunde.',
    },
    {
      badge: 'Math Graphs',
      title: 'Grafice și formule inteligente',
      description:
        'Scrie ecuații și vezi grafice animate direct pe Sketch. Panoul Math Graph transformă formulele în vizualizări pe care le poți insera instant pe tablă.',
    },
    {
      badge: 'Insight AI',
      title: 'AI Sketch Copilot',
      description:
        'Primește explicații pas cu pas, idei pentru lecții și ajutor la demonstrații. Creează-ți cont pentru a salva conversațiile și preferințele AI.',
    },
  ];

  const handleDismissWelcome = () => {
    if (!roomId) return;
    setShowGuestWelcome(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`planck-sketch:guestWelcome:${roomId}`, '1');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Navbar */}
      <WhiteboardNavbar roomId={roomId} connectedUsers={connectedUsers} />
      
      {/* Main Editor Area - Flex Grow to fill available space */}
      <div className="flex-1 relative min-w-0 flex overflow-hidden">
        <div className="flex-1 relative h-full min-w-0">
        <div ref={containerRef} className="absolute inset-0">
          <Tldraw 
            store={store}
            licenseKey="tldraw-2026-02-28/WyJmWVRrODVnNSIsWyIqIl0sMTYsIjIwMjYtMDItMjgiXQ.LfYobRlq42wKRiuYggl0DPR+eDYcMWDlRyU0d1RmYpLmMclP+vlJhHz4AGYtmcuQT39nYGP0ywhBwliKp3f4pg"
            onMount={(editor) => {
                setEditor(editor);
                setCurrentPageId(editor.getCurrentPageId());
                setEditorReadyVersion((version) => version + 1);
                
                // Set default pen size to smallest ('s')
                try {
                  const currentSize = editor.getStyleForNextShape(DefaultSizeStyle);
                  if (currentSize !== 's') {
                    editor.setStyleForNextShapes(DefaultSizeStyle, 's');
                  }
                } catch (err) {
                  console.warn('[PlanckSketch] Failed to set default pen size:', err);
                }
            }}
          />
        </div>
        
        {/* Page Navigator */}
        <PageNavigator
          editor={editor}
          store={store}
          currentPageId={currentPageId}
          onPageChange={(pageId) => {
            if (editor) {
               editor.setCurrentPage(pageId);
               setCurrentPageId(pageId);
            }
          }}
        />

        {/* Mobile Graph Toggle */}
        {effectiveCurrentPageId && (
          <div className="sm:hidden absolute top-4 right-4 z-40">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => setIsMathGraphOpen(true)}
              className="rounded-full bg-white/90 text-gray-900 shadow-lg border border-gray-200 hover:bg-white"
              aria-label={isMathGraphOpen ? "Deschide graficul matematic" : "Deschide graficul matematic"}
            >
              <Calculator className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Math Graph Button */}
        {effectiveCurrentPageId && (
          <div className="hidden sm:block absolute bottom-16 right-4 z-50">
            <Button
              onClick={() => setIsMathGraphOpen(!isMathGraphOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              size="lg"
              title={isMathGraphOpen ? "Închide graficare matematică" : "Deschide graficare matematică"}
            >
              <Calculator className="h-5 w-5 mr-2" />
              graph
            </Button>
          </div>
        )}

        {/* Share Button - Bottom Right, below Math Graph Button */}
        <div className="hidden sm:block absolute bottom-4 right-4 z-50">
          <ShareButton 
            boardId={roomId} 
            shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/sketch/${roomId}` : `/sketch/${roomId}`} 
          />
        </div>

        {/* Guest Welcome Card */}
        {showGuestWelcome && (
          <div className="absolute inset-0 z-40 flex items-start justify-center sm:items-center pointer-events-none px-4 pt-6 sm:pt-0">
            <div className="w-full max-w-lg bg-white text-gray-900 border border-gray-300 rounded-2xl shadow-[0_20px_80px_-30px_rgba(15,23,42,0.5)] pointer-events-auto overflow-hidden h-[380px] flex flex-col">
              <div className="w-full h-28 sm:h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-white relative">
                <div className="absolute inset-0 bg-[url('/sketch-welcome-placeholder.jpg')] bg-cover bg-center opacity-10" />
                <div className="absolute inset-0 backdrop-blur-[2px]" />
                <button
                  onClick={handleDismissWelcome}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 text-gray-600 hover:text-gray-900 hover:bg-white"
                  aria-label="Închide"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 p-6 space-y-4 flex flex-col">
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                    {guestWelcomeSlides[welcomeSlide].badge}
                  </p>
                  <h2 className="text-2xl font-semibold mt-1">{guestWelcomeSlides[welcomeSlide].title}</h2>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {guestWelcomeSlides[welcomeSlide].description}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <button
                    className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                    disabled={welcomeSlide === 0}
                    onClick={() => setWelcomeSlide((prev) => Math.max(0, prev - 1))}
                    aria-label="Slide anterior"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    {guestWelcomeSlides.map((_, index) => (
                      <button
                        key={index}
                        className={cn(
                          'h-2.5 w-2.5 rounded-full bg-gray-300 transition-transform',
                          index === welcomeSlide ? 'bg-gray-900 scale-125' : ''
                        )}
                        onClick={() => setWelcomeSlide(index)}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  {welcomeSlide === guestWelcomeSlides.length - 1 ? (
                    <Button
                      className="bg-gray-900 text-white hover:bg-gray-800"
                      onClick={() => {
                        handleDismissWelcome();
                        router.push('/register?redirect=/sketch/boards');
                      }}
                    >
                      Creează cont
                    </Button>
                  ) : (
                    <button
                      className="p-2 text-gray-400 hover:text-gray-900"
                      onClick={() =>
                        setWelcomeSlide((prev) => Math.min(guestWelcomeSlides.length - 1, prev + 1))
                      }
                      aria-label="Slide următor"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Math Graph Panel - Sits alongside editor in flex container (Desktop) */}
        {effectiveCurrentPageId && (
          <div
            className={cn(
              "hidden sm:flex border-l border-gray-200 bg-white shadow-xl transition-[width,opacity] duration-300 ease-out relative flex-col",
              isMathGraphOpen ? "w-[620px] lg:w-[720px] opacity-100" : "w-0 opacity-0 overflow-hidden"
            )}
          >
            <div className="w-[620px] lg:w-[720px] h-full flex flex-col">
               <MathGraphPanel
                  boardId={roomId}
                  pageId={effectiveCurrentPageId}
                  open={isMathGraphOpen}
                  onOpenChange={setIsMathGraphOpen}
                  socket={socketRef.current}
                />
            </div>
          </div>
        )}
        {/* Mobile Fullscreen Graph Panel */}
        {effectiveCurrentPageId && (
          <div
            className={cn(
              "sm:hidden fixed inset-x-0 bottom-0 top-16 bg-white z-40 transition-transform duration-300 ease-out flex flex-col",
              isMathGraphOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
            )}
          >
            <div className="absolute top-3 right-4 z-50">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMathGraphOpen(false)}
                className="rounded-full bg-black/5 text-gray-700 hover:bg-black/10"
                aria-label="Închide graficul matematic"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 w-full pt-4 px-4 flex flex-col min-h-0">
              <MathGraphPanel
                boardId={roomId}
                pageId={effectiveCurrentPageId}
                open={isMathGraphOpen}
                onOpenChange={setIsMathGraphOpen}
                socket={socketRef.current}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
