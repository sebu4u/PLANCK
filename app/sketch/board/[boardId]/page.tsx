"use client"

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageNavigator } from '@/components/sketch/PageNavigator';
import { ShareButton } from '@/components/sketch/ShareButton';
import dynamic from 'next/dynamic';
import { Navigation } from '@/components/navigation';

// Lazy load TldrawEditor to reduce initial bundle size
const TldrawEditor = dynamic(
  () => import('@/components/sketch/TldrawEditor').then((mod) => ({ default: mod.TldrawEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center text-white/60">
          <p>Se încarcă editorul...</p>
        </div>
      </div>
    ),
  }
);

// Dynamic import for MathGraphPanel to avoid SSR issues with MathLive
const MathGraphPanel = dynamic(
  () => import('@/components/sketch/MathGraphPanel').then((mod) => ({ default: mod.MathGraphPanel })),
  { ssr: false }
);
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Calculator, X } from 'lucide-react';
import { toast } from 'sonner';
import { Editor } from '@tldraw/tldraw';
import { cn } from '@/lib/utils';

interface Board {
  id: string;
  title: string;
  share_token: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isMathGraphOpen, setIsMathGraphOpen] = useState(false);

  // Compute effective current page ID - similar to PageNavigator logic
  // This ensures the graph button appears even when currentPageId isn't set yet
  // Using useMemo to recalculate when editor or currentPageId changes
  const effectiveCurrentPageId = useMemo(() => {
    if (currentPageId) return currentPageId;
    if (editor?.currentPageId) return editor.currentPageId;
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
    if (editor?.store) {
      try {
        const pages = editor.store.allRecords().filter((r: any) => r.typeName === 'page');
        if (pages.length > 0) {
          return pages[0].id as string;
        }
      } catch (e) {
        // Ignore errors
      }
    }
    return null;
  }, [currentPageId, editor]);
  const [showGuestWelcome, setShowGuestWelcome] = useState(false);
  const [welcomeSlide, setWelcomeSlide] = useState(0);

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const response = await fetch(`/api/sketch/boards/${boardId}`);
        if (!response.ok) {
          throw new Error('Tabla nu a fost găsită');
        }
        const data = await response.json();
        setBoard(data.board);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load board:', err);
        setError(err.message || 'Eroare la încărcarea tablei');
        setIsLoading(false);
        toast.error(err.message || 'Eroare la încărcarea tablei');
      }
    };

    if (boardId) {
      loadBoard();
    }
  }, [boardId]);

  useEffect(() => {
    if (!editor || !boardId) {
      return;
    }

    const storageKey = `planck-sketch:lastPage:${boardId}`;

    try {
      const savedPageId = window.localStorage.getItem(storageKey);
      if (!savedPageId) {
        return;
      }

      const pageExists = editor.getPages().some((page) => page.id === savedPageId);
      if (!pageExists) {
        window.localStorage.removeItem(storageKey);
        return;
      }

      if (savedPageId !== editor.currentPageId) {
        editor.setCurrentPage(savedPageId);
      }
      setCurrentPageId(savedPageId);
    } catch (err) {
      console.warn('Failed to restore last page selection:', err);
    }
  }, [editor, boardId]);

  // Ensure currentPageId is set when editor becomes available with pages
  useEffect(() => {
    if (!editor || currentPageId) return;

    // Try to get current page from editor
    const trySetPageId = () => {
      try {
        if (editor.currentPageId) {
          setCurrentPageId(editor.currentPageId);
          return;
        }

        // Try to get first page from editor's pages
        const pages = editor.getPages();
        if (pages.length > 0) {
          setCurrentPageId(pages[0].id);
          return;
        }

        // Try to get first page from store
        const storePages = editor.store.allRecords().filter((r: any) => r.typeName === 'page');
        if (storePages.length > 0) {
          setCurrentPageId(storePages[0].id as string);
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Try immediately
    trySetPageId();

    // Also try after a short delay in case pages are still loading
    const timeout = setTimeout(trySetPageId, 100);

    return () => clearTimeout(timeout);
  }, [editor, currentPageId]);

  useEffect(() => {
    if (!boardId || !currentPageId) {
      return;
    }

    const storageKey = `planck-sketch:lastPage:${boardId}`;
    try {
      window.localStorage.setItem(storageKey, currentPageId);
    } catch (err) {
      console.warn('Failed to persist last page selection:', err);
    }
  }, [boardId, currentPageId]);

  useEffect(() => {
    if (!boardId || !board) return;
    if (board.user_id) {
      setShowGuestWelcome(false);
      return;
    }

    const storageKey = `planck-sketch:guestWelcome:${boardId}`;
    if (typeof window !== 'undefined') {
      const dismissed = window.localStorage.getItem(storageKey);
      if (!dismissed) {
        setShowGuestWelcome(true);
      }
    }
  }, [boardId, board]);

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
    if (!boardId) return;
    setShowGuestWelcome(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`planck-sketch:guestWelcome:${boardId}`, '1');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Se încarcă tabla...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Tabla nu a fost găsită'}</p>
          <Button
            onClick={() => router.push('/sketch')}
            variant="outline"
            className="border-gray-500/30 text-white hover:bg-gray-700/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi
          </Button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/sketch/board/${boardId}`;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      <Navigation />

      {/* Header with board title */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/sketch')}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi
          </Button>
          <h1 className="text-lg font-semibold text-white">{board.title}</h1>
        </div>
      </div>

      {/* Editor with floating buttons */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Whiteboard area - takes remaining space */}
        <div className="flex-1 relative overflow-hidden">
          <TldrawEditor
            boardId={boardId}
            onError={(error) => {
              console.error('Editor error:', error);
              toast.error(error.message || 'Eroare în editor');
            }}
            onEditorReady={(editor) => {
              setEditor(editor);
              // Set initial page ID
              if (editor.currentPageId) {
                setCurrentPageId(editor.currentPageId);
              }
            }}
            onCurrentPageChange={(pageId) => {
              setCurrentPageId(pageId);
            }}
          />

          {/* Page Navigator */}
          <PageNavigator
            editor={editor}
            store={editor?.store || null}
            currentPageId={currentPageId}
            onPageChange={(pageId) => {
              setCurrentPageId(pageId);
            }}
          />

          {/* Share Button - Bottom Right */}
          <div className="hidden sm:block absolute bottom-4 right-4 z-50">
            <ShareButton boardId={boardId} shareUrl={shareUrl} />
          </div>

          {/* Math Graph Button - Bottom Right, above Share Button */}
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

        {/* Math Graph Panel - side panel */}
        {effectiveCurrentPageId && (
          <div
            className={cn(
              "hidden sm:block overflow-hidden transition-[width] duration-300 ease-out",
              isMathGraphOpen ? "w-[620px] lg:w-[720px]" : "w-0"
            )}
            style={{ backgroundColor: '#c4c4c4' }}
          >
            <MathGraphPanel
              boardId={boardId}
              pageId={effectiveCurrentPageId}
              open={isMathGraphOpen}
              onOpenChange={setIsMathGraphOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}

