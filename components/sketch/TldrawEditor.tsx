"use client"

import { useEffect, useRef, useState, useCallback } from 'react';
import { Tldraw, Editor, TLStore, StoreSnapshot, TLRecord, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import { DefaultSizeStyle } from '@tldraw/tlschema';
import '@tldraw/tldraw/tldraw.css';
import { SupabasePersistence } from '@/lib/sketch/supabase-persistence';

interface TldrawEditorProps {
  boardId: string;
  onError?: (error: Error) => void;
  onEditorReady?: (editor: Editor) => void;
  onPageChange?: (pageId: string) => void;
  onCurrentPageChange?: (pageId: string | null) => void;
}

export function TldrawEditor({ boardId, onError, onEditorReady, onPageChange, onCurrentPageChange }: TldrawEditorProps) {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));
  const persistenceRef = useRef<SupabasePersistence | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStoreLoaded, setIsStoreLoaded] = useState(false);
  const [isEditorMounted, setIsEditorMounted] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editorReadyVersion, setEditorReadyVersion] = useState(0);

  // Initialize persistence
  useEffect(() => {
    const persistence = new SupabasePersistence({
      boardId,
      onError: (err) => {
        console.warn('[TldrawEditor] Persistence error:', err);
        // Don't block editor on persistence errors
      },
      debounceMs: 200,
    });

    // Set store reference so persistence can get fresh state
    persistence.setStore(store);

    persistenceRef.current = persistence;

        // Load initial pages
    const loadPages = async () => {
      try {
        console.log(`[TldrawEditor] Loading pages for board ${boardId}`);
        const snapshot = await persistence.loadPages();
        
        if (snapshot && snapshot.store && Object.keys(snapshot.store).length > 0) {
          const recordCount = Object.keys(snapshot.store).length;
          console.log(`[TldrawEditor] Found snapshot with ${recordCount} records, loading into store`);
          console.log(`[TldrawEditor] Snapshot structure:`, {
            hasStore: !!snapshot.store,
            hasSchema: !!snapshot.schema,
            recordCount,
            recordTypes: Object.values(snapshot.store).map((r: any) => r?.typeName).filter(Boolean)
          });
          
          try {
            // Convert snapshot store (object) to array of records for store.put()
            const recordsToLoad: TLRecord[] = Object.values(snapshot.store) as TLRecord[];
            
            if (recordsToLoad.length > 0) {
              console.log(`[TldrawEditor] Loading ${recordsToLoad.length} records into store using store.put()`);
              // Load records into store using put() method
              store.put(recordsToLoad);
              console.log(`[TldrawEditor] Successfully loaded snapshot into store`);
              
              // Verify the load worked
              const loadedRecords = store.allRecords();
              console.log(`[TldrawEditor] Store now has ${loadedRecords.length} records after load`);
              
              // Wait a tick to ensure store changes are applied
              await new Promise(resolve => setTimeout(resolve, 0));
            } else {
              console.warn(`[TldrawEditor] No records to load from snapshot`);
            }
          } catch (snapshotError) {
            console.error('[TldrawEditor] Failed to load snapshot, starting fresh:', snapshotError);
            console.error('[TldrawEditor] Snapshot that failed:', snapshot);
            // If snapshot is invalid, tldraw will create default page
          }
        } else {
          console.log(`[TldrawEditor] No snapshot found or empty snapshot, tldraw will create default page`);
          if (snapshot) {
            console.log(`[TldrawEditor] Snapshot exists but is empty:`, {
              hasStore: !!snapshot.store,
              storeKeys: snapshot.store ? Object.keys(snapshot.store).length : 0
            });
          }
          // No pages exist, create a default page
          // tldraw will create a default page automatically
        }

        // Mark store as loaded, but don't set isLoading to false yet
        // Wait for editor to mount as well
        setIsStoreLoaded(true);
      } catch (error) {
        console.error('[TldrawEditor] Failed to load pages:', error);
        // Don't block - let tldraw create default page
        setIsStoreLoaded(true);
      }
    };

    loadPages();

    // Save before page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (persistenceRef.current && store) {
        // Force save all pages synchronously
        // Note: This is best-effort, as async operations in beforeunload are limited
        persistenceRef.current.forceSaveAll(store).catch((err) => {
          console.error('Failed to save on unload:', err);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Save on cleanup
      if (persistenceRef.current && store) {
        persistenceRef.current.forceSaveAll(store).catch(console.error);
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      persistence.destroy();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [boardId, store]);

  // Handle store changes - background DB save
  useEffect(() => {
    if (!persistenceRef.current || isLoading) return;

    const handleStoreChange = () => {
      if (!persistenceRef.current) return;

      // Get current page ID from store if not set
      let pageIdToSave = currentPageId;
      if (!pageIdToSave) {
        const pages = store.allRecords().filter(r => r.typeName === 'page');
        if (pages.length > 0) {
          pageIdToSave = pages[0].id as string;
          console.log(`[TldrawEditor] No currentPageId set, using first page: ${pageIdToSave}`);
        } else {
          console.log(`[TldrawEditor] No pages found in store, skipping save`);
          return; // No pages to save
        }
      }

      // Get all records
      const allRecords = store.allRecords();

      // Filter ephemeral records early to avoid unnecessary processing
      const isEphemeral = (rec: any) => {
        const t = rec?.typeName;
        return t === 'instance' || t === 'instance_page_state' || t === 'instance_presence' || t === 'camera';
      };
      
      const contentRecords = allRecords.filter(rec => !isEphemeral(rec));

      if (contentRecords.length === 0) {
        return;
      }

      // Build snapshot for DB persistence
      const snapshotStore: Record<string, TLRecord> = {};
      for (const record of contentRecords) {
        snapshotStore[record.id] = record;
      }

      const snapshot: StoreSnapshot<TLRecord> = {
        store: snapshotStore,
        schema: store.schema.serialize(),
      };
      
      // Trigger background DB save (debounced: 1000ms)
      persistenceRef.current.persistToDb(pageIdToSave, snapshot).catch((err) => {
        console.warn('[TldrawEditor] DB persistence failed:', err);
      });
    };

    // Subscribe to store changes
    const unsubscribe = store.listen(handleStoreChange);

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [store, currentPageId, isLoading]);

  useEffect(() => {
    if (editorReadyVersion === 0) {
      return;
    }

    const container = containerRef.current;
    const editor = editorRef.current;

    if (!container || !editor) {
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
          editor.setCursor(previousCursor);
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
          const currentToolId = editor.getCurrentToolId();
          // Check if the current tool is a drawing tool (draw, pencil, etc.)
          // In tldraw, the draw tool is typically called 'draw'
          return currentToolId === 'draw' || currentToolId === 'pencil' || currentToolId === 'brush';
        } catch (err) {
          return false;
        }
      };

      const handlePointerDown = (event: PointerEvent) => {
        // On mobile/touch devices (pointerType === 'touch'), check if drawing tool is active
        // If drawing tool is active, allow the event to pass through for drawing
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen';
        
        if (isTouch && isDrawingToolActive()) {
          // Allow drawing on mobile when pencil/draw tool is selected
          // Don't intercept the event, let tldraw handle it
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
        // Don't interfere with drawing on mobile when drawing tool is active
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
          previousCursor = editor.getInstanceState().cursor;
          editor.setCursor({ type: 'grabbing', rotation: 0 });
          panState.shouldBlockContextMenu = true;
        }

        editor.markEventAsHandled(event);
        event.preventDefault();
        event.stopPropagation();

        const { x: cx, y: cy, z: cz } = editor.getCamera();
        const zoom = cz || 1;
        editor.setCamera(
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
        // Don't interfere with drawing on mobile when drawing tool is active
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen';
        if (isTouch && isDrawingToolActive()) {
          return;
        }

        if (panState.pointerId === null || event.pointerId !== panState.pointerId) {
          return;
        }

        if (panState.isPanning) {
          editor.markEventAsHandled(event);
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
  }, [editorReadyVersion]);


  // Handle page change
  const handlePageChange = useCallback(async (pageId: string) => {
    if (pageId === currentPageId) return;

    setCurrentPageId(pageId);
    
    // Notify parent component
    if (onCurrentPageChange) {
      onCurrentPageChange(pageId);
    }
    
    if (persistenceRef.current) {
      persistenceRef.current.setCurrentPage(pageId);
    }

    // Save current page before switching (DB persistence only, no broadcast)
    if (persistenceRef.current && currentPageId) {
      // Build snapshot manually from all records
      const allRecords = store.allRecords();
      const snapshotStore: Record<string, TLRecord> = {};
      const isEphemeral = (rec: any) => {
        const t = rec?.typeName;
        return t === 'instance' || t === 'instance_page_state' || t === 'instance_presence' || t === 'camera';
      };
      
      for (const record of allRecords) {
        if (!isEphemeral(record)) {
          snapshotStore[record.id] = record;
        }
      }

      const snapshot: StoreSnapshot<TLRecord> = {
        store: snapshotStore,
        schema: store.schema.serialize(),
      };
      
      await persistenceRef.current.persistToDb(currentPageId, snapshot);
    }
  }, [currentPageId, store, onCurrentPageChange]);

  // Update isLoading when both store is loaded and editor is mounted
  useEffect(() => {
    if (isStoreLoaded && isEditorMounted) {
      // Add a small delay to ensure everything is fully initialized
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isStoreLoaded, isEditorMounted]);

  // Get initial page ID from store
  useEffect(() => {
    if (isLoading || !editorRef.current) return;

    const pages = store.allRecords().filter(r => r.typeName === 'page');
    if (pages.length > 0 && !currentPageId) {
      const firstPage = pages[0];
      const pageId = firstPage.id as string;
      setCurrentPageId(pageId);
      if (onCurrentPageChange) {
        onCurrentPageChange(pageId);
      }
      if (onPageChange) {
        onPageChange(pageId);
      }
      
      if (persistenceRef.current) {
        persistenceRef.current.setCurrentPage(pageId);
      }
    }
  }, [isLoading, store, currentPageId, onCurrentPageChange, onPageChange]);

  // Render Tldraw once store is loaded, but show loading overlay until editor is mounted
  if (!isStoreLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Se încarcă tabla...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
      <Tldraw
        store={store}
        licenseKey="tldraw-2026-02-28/WyJmWVRrODVnNSIsWyIqIl0sMTYsIjIwMjYtMDItMjgiXQ.LfYobRlq42wKRiuYggl0DPR+eDYcMWDlRyU0d1RmYpLmMclP+vlJhHz4AGYtmcuQT39nYGP0ywhBwliKp3f4pg"
        onMount={(editor) => {
          editorRef.current = editor;
          setEditorReadyVersion((version) => version + 1);

          try {
            const currentSize = editor.getStyleForNextShape(DefaultSizeStyle);
            if (currentSize !== 's') {
              editor.setStyleForNextShapes(DefaultSizeStyle, 's');
            }
          } catch (err) {
            console.warn('[TldrawEditor] Failed to set default pen size:', err);
          }
          
          console.log(`[TldrawEditor] Editor mounted, current page: ${editor.currentPageId}`);
          console.log(`[TldrawEditor] Store has ${store.allRecords().length} records after mount`);
          
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            setIsEditorMounted(true);
            
            // Notify parent component that editor is ready
            if (onEditorReady) {
              onEditorReady(editor);
            }
            
            // Set up page change listener
            editor.on('change-page', ({ pageId }) => {
              if (pageId) {
                console.log(`[TldrawEditor] Page changed to: ${pageId}`);
                handlePageChange(pageId);
                if (onPageChange) {
                  onPageChange(pageId);
                }
              }
            });

            // Get initial page
            const currentPage = editor.currentPageId;
            if (currentPage) {
              console.log(`[TldrawEditor] Setting initial page: ${currentPage}`);
              setCurrentPageId(currentPage);
              if (onCurrentPageChange) {
                onCurrentPageChange(currentPage);
              }
              if (onPageChange) {
                onPageChange(currentPage);
              }
              if (persistenceRef.current) {
                persistenceRef.current.setCurrentPage(currentPage);
              }
            } else {
              console.warn(`[TldrawEditor] No current page ID after mount`);
            }
          });
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Se încarcă tabla...</p>
          </div>
        </div>
      )}
    </div>
  );
}

