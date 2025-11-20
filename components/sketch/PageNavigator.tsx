"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Editor, TLPage, TLShapeId } from '@tldraw/tldraw';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface PageNavigatorProps {
  editor: Editor | null;
  currentPageId: string | null;
  onPageChange?: (pageId: string) => void;
}

interface PageThumbnail {
  pageId: string;
  thumbnail: string | null;
  isLoading: boolean;
}

const MAX_VISIBLE_PAGES = 4;

export function PageNavigator({ editor, currentPageId, onPageChange }: PageNavigatorProps) {
  const [pages, setPages] = useState<TLPage[]>([]);
  const [viewportStartIndex, setViewportStartIndex] = useState(0);
  const [thumbnails, setThumbnails] = useState<Map<string, PageThumbnail>>(new Map());
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const [showDeleteButton, setShowDeleteButton] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const thumbnailsRef = useRef<Map<string, PageThumbnail>>(new Map());

  // Get pages from editor and detect theme
  useEffect(() => {
    if (!editor) return;

    const updatePages = () => {
      const allPages = editor.getPages();
      setPages(allPages);
    };

    const updateTheme = () => {
      // Check if editor has user preferences for theme
      try {
        // Try to get theme from user preferences
        const prefs = editor.user.getUserPreferences();
        if (prefs && 'isDarkMode' in prefs) {
          setIsDarkMode(prefs.isDarkMode as boolean);
          return;
        }
      } catch (e) {
        // Ignore
      }
      
      // Fallback: check CSS class or default to dark
      try {
        const root = document.documentElement;
        const isDark = root.classList.contains('dark') || 
                      (!root.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDarkMode(isDark);
      } catch (e2) {
        setIsDarkMode(true); // Default to dark
      }
    };

    updatePages();
    updateTheme();

    // Listen to store changes for pages
    const unsubscribeStore = editor.store.listen(() => {
      updatePages();
    }, { source: 'user', scope: 'document' });

    // Listen to theme changes - check periodically and on user preference changes
    const themeInterval = setInterval(() => {
      updateTheme();
    }, 500);

    // Also listen to DOM changes for theme class
    const observer = new MutationObserver(() => {
      updateTheme();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      unsubscribeStore();
      clearInterval(themeInterval);
      observer.disconnect();
    };
  }, [editor]);

  // Compute effective current page id for initial render (fallback to editor or first page)
  const effectiveCurrentPageId = useMemo(() => {
    if (currentPageId) return currentPageId;
    const fromEditor = editor?.currentPageId;
    if (fromEditor) return fromEditor;
    return pages.length > 0 ? pages[0].id : null;
  }, [currentPageId, editor, pages]);

  // Adjust viewport when current page changes
  useEffect(() => {
    if (!effectiveCurrentPageId || pages.length === 0) return;

    const currentIndex = pages.findIndex(p => p.id === effectiveCurrentPageId);
    if (currentIndex === -1) return;

    // Ensure current page is visible in viewport
    setViewportStartIndex(prevIndex => {
      if (currentIndex < prevIndex) {
        return Math.max(0, currentIndex);
      } else if (currentIndex >= prevIndex + MAX_VISIBLE_PAGES) {
        return Math.max(0, currentIndex - MAX_VISIBLE_PAGES + 1);
      }
      return prevIndex; // No change needed
    });
  }, [effectiveCurrentPageId, pages]);

  // Generate thumbnail for a page
  const generateThumbnail = useCallback(async (pageId: string) => {
    if (!editor) return null;

    // Check if thumbnail already exists or is loading using ref
    const existing = thumbnailsRef.current.get(pageId);
    if (existing?.thumbnail) {
      return existing.thumbnail; // Already has thumbnail
    }
    if (existing?.isLoading) {
      return null; // Already loading
    }

    // Mark as loading
    setThumbnails(prev => {
      const newMap = new Map(prev);
      newMap.set(pageId, { pageId, thumbnail: null, isLoading: true });
      thumbnailsRef.current = newMap;
      return newMap;
    });

    try {
      // Get shapes for this page from store
      const allRecords = editor.store.allRecords();
      const pageShapes = allRecords.filter(
        (record): record is any =>
          record.typeName === 'shape' &&
          (record as any).parentId === pageId
      );

      if (pageShapes.length === 0) {
        setThumbnails(prev => {
          const newMap = new Map(prev);
          newMap.set(pageId, { pageId, thumbnail: null, isLoading: false });
          thumbnailsRef.current = newMap;
          return newMap;
        });
        return null;
      }

      const shapeIds = pageShapes.map((shape) => shape.id as TLShapeId);
      if (shapeIds.length === 0) {
        setThumbnails(prev => {
          const newMap = new Map(prev);
          newMap.set(pageId, { pageId, thumbnail: null, isLoading: false });
          thumbnailsRef.current = newMap;
          return newMap;
        });
        return null;
      }

      const { blob } = await editor.toImage(shapeIds, {
        format: 'png',
        scale: 0.3,
        background: true,
      });

      const url = URL.createObjectURL(blob);

      setThumbnails(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(pageId);
        if (existing?.thumbnail) {
          URL.revokeObjectURL(existing.thumbnail);
        }
        newMap.set(pageId, { pageId, thumbnail: url, isLoading: false });
        thumbnailsRef.current = newMap;
        return newMap;
      });

      return url;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setThumbnails(prev => {
        const newMap = new Map(prev);
        newMap.set(pageId, { pageId, thumbnail: null, isLoading: false });
        thumbnailsRef.current = newMap;
        return newMap;
      });
      return null;
    }
  }, [editor]);

  // Generate thumbnails for visible pages
  useEffect(() => {
    if (!editor || pages.length === 0) return;

    const visiblePages = pages.slice(viewportStartIndex, viewportStartIndex + MAX_VISIBLE_PAGES);
    
    visiblePages.forEach(page => {
      // Check current state before generating using ref
      const thumbnail = thumbnailsRef.current.get(page.id);
      if (!thumbnail || (!thumbnail.thumbnail && !thumbnail.isLoading)) {
        // Generate thumbnail asynchronously
        generateThumbnail(page.id);
      }
    });
  }, [editor, pages, viewportStartIndex, generateThumbnail]);

  // Cleanup thumbnails URLs and timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup all thumbnails on unmount
      setThumbnails(prev => {
        prev.forEach(thumb => {
          if (thumb.thumbnail) {
            URL.revokeObjectURL(thumb.thumbnail);
          }
        });
        return new Map();
      });
      
      // Cleanup all hover timeouts
      hoverTimeoutRef.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      hoverTimeoutRef.current.clear();
    };
  }, []);

  // Handle page click
  const handlePageClick = useCallback((pageId: string) => {
    if (!editor) return;
    
    editor.setCurrentPage(pageId);
    if (onPageChange) {
      onPageChange(pageId);
    }
  }, [editor, onPageChange]);

  // Handle page hover start
  const handlePageHoverStart = useCallback((pageId: string) => {
    setHoveredPageId(pageId);
    
    // Clear any existing timeout for this page
    const existingTimeout = hoverTimeoutRef.current.get(pageId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set timeout to show delete button after 0.5 seconds
    const timeout = setTimeout(() => {
      setShowDeleteButton(pageId);
    }, 500);

    hoverTimeoutRef.current.set(pageId, timeout);
  }, []);

  // Handle page hover end
  const handlePageHoverEnd = useCallback((pageId: string) => {
    setHoveredPageId(null);
    
    // Clear timeout
    const timeout = hoverTimeoutRef.current.get(pageId);
    if (timeout) {
      clearTimeout(timeout);
      hoverTimeoutRef.current.delete(pageId);
    }

    // Hide delete button after a short delay
    setTimeout(() => {
      setShowDeleteButton(prev => prev === pageId ? null : prev);
    }, 100);
  }, []);

  // Handle page delete
  const handleDeletePage = useCallback((pageId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent page click
    
    if (!editor) return;

    // Don't allow deleting if it's the only page
    const allPages = editor.getPages();
    if (allPages.length <= 1) {
      toast.error('Nu poți șterge singura pagină');
      return;
    }

    try {
      // If deleting current page, switch to another page first
      if (pageId === effectiveCurrentPageId) {
        const otherPage = allPages.find(p => p.id !== pageId);
        if (otherPage) {
          editor.setCurrentPage(otherPage.id);
          if (onPageChange) {
            onPageChange(otherPage.id);
          }
        }
      }

      // Delete the page
      editor.deletePage(pageId);
      
      // Clean up thumbnails
      setThumbnails(prev => {
        const newMap = new Map(prev);
        const thumbnail = newMap.get(pageId);
        if (thumbnail?.thumbnail) {
          URL.revokeObjectURL(thumbnail.thumbnail);
        }
        newMap.delete(pageId);
        thumbnailsRef.current = newMap;
        return newMap;
      });

      toast.success('Pagină ștearsă');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Eroare la ștergerea paginii');
    }
  }, [editor, currentPageId, onPageChange]);

  // Handle create page
  const handleCreatePage = useCallback(async () => {
    if (!editor || isCreatingPage) return;

    setIsCreatingPage(true);
    try {
      const pageCount = pages.length;
      
      // Create the page
      editor.createPage({
        name: `Pagina ${pageCount + 1}`,
      });

      // Wait a bit for the page to be added to the store
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get all pages after creation - the new page should be the last one
      const allPages = editor.getPages();
      
      if (allPages.length > pageCount) {
        // New page was created - it should be the last one
        const newPage = allPages[allPages.length - 1];
        
        // Verify the page exists in store before setting it
        if (editor.store.has(newPage.id)) {
          // Set as current page
          editor.setCurrentPage(newPage.id);
          if (onPageChange) {
            onPageChange(newPage.id);
          }

          // Adjust viewport to show new page
          const newIndex = allPages.length - 1;
          if (newIndex >= viewportStartIndex + MAX_VISIBLE_PAGES) {
            setViewportStartIndex(Math.max(0, newIndex - MAX_VISIBLE_PAGES + 1));
          }

          toast.success('Pagină nouă creată');
        } else {
          // Page not yet in store, wait a bit more
          await new Promise(resolve => setTimeout(resolve, 100));
          const updatedPages = editor.getPages();
          if (updatedPages.length > pageCount) {
            const latestPage = updatedPages[updatedPages.length - 1];
            if (editor.store.has(latestPage.id)) {
              editor.setCurrentPage(latestPage.id);
              if (onPageChange) {
                onPageChange(latestPage.id);
              }
              toast.success('Pagină nouă creată');
            } else {
              toast.error('Eroare la setarea paginii noi');
            }
          }
        }
      } else {
        toast.error('Eroare la crearea paginii');
      }
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Eroare la crearea paginii');
    } finally {
      setIsCreatingPage(false);
    }
  }, [editor, pages.length, viewportStartIndex, onPageChange, isCreatingPage]);

  // Handle arrow navigation
  const handleArrowLeft = useCallback(() => {
    if (viewportStartIndex > 0) {
      setViewportStartIndex(viewportStartIndex - 1);
    }
  }, [viewportStartIndex]);

  const handleArrowRight = useCallback(() => {
    if (viewportStartIndex + MAX_VISIBLE_PAGES < pages.length) {
      setViewportStartIndex(viewportStartIndex + 1);
    }
  }, [viewportStartIndex, pages.length]);

  // Get visible pages
  const visiblePages = useMemo(() => {
    return pages.slice(viewportStartIndex, viewportStartIndex + MAX_VISIBLE_PAGES);
  }, [pages, viewportStartIndex]);

  if (!editor || pages.length === 0) {
    return null;
  }

  const canScrollLeft = viewportStartIndex > 0;
  const canScrollRight = viewportStartIndex + MAX_VISIBLE_PAGES < pages.length;
  const showArrows = pages.length > MAX_VISIBLE_PAGES;

  // Theme-based colors
  const bgColor = isDarkMode 
    ? 'bg-gray-900/90' 
    : 'bg-white/90';
  const borderColor = isDarkMode 
    ? 'border-gray-700' 
    : 'border-gray-300';
  const pageBg = isDarkMode 
    ? 'bg-gray-700/60' 
    : 'bg-gray-200/60';
  const pageBorder = isDarkMode 
    ? 'border-gray-600/70' 
    : 'border-gray-400/70';
  const pageBorderHover = isDarkMode 
    ? 'hover:border-gray-500/80' 
    : 'hover:border-gray-500/80';
  const activeBorder = isDarkMode 
    ? 'border-blue-500' 
    : 'border-blue-600';
  const activeBg = isDarkMode 
    ? 'bg-blue-500/10' 
    : 'bg-blue-500/20';
  const textColor = isDarkMode 
    ? 'text-gray-400' 
    : 'text-gray-500';
  const arrowColor = isDarkMode 
    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200';
  const loadingColor = isDarkMode 
    ? 'border-gray-500' 
    : 'border-gray-400';

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="flex items-center px-2 py-2">
        {/* Left arrow - only show if more than 4 pages */}
        {showArrows && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleArrowLeft}
            disabled={!canScrollLeft}
            className={`h-8 w-8 ${arrowColor} disabled:opacity-30`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Page thumbnails - with spacing */}
        <div className="flex items-center gap-3">
          {visiblePages.map((page) => {
            const thumbnail = thumbnails.get(page.id);
            const isActive = page.id === effectiveCurrentPageId;
            
            return (
              <div
                key={page.id}
                onClick={() => handlePageClick(page.id)}
                onMouseEnter={() => handlePageHoverStart(page.id)}
                onMouseLeave={() => handlePageHoverEnd(page.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePageClick(page.id);
                  }
                }}
                className={`
                  relative w-20 h-12 rounded border-2 transition-all duration-300 ease-in-out
                  ${isActive 
                    ? `${activeBorder} ${activeBg}` 
                    : `${pageBorder} ${pageBg} ${pageBorderHover}`
                  }
                  flex items-center justify-center overflow-hidden
                  shadow-md hover:scale-110 hover:z-50
                  cursor-pointer
                `}
                title={page.name || `Pagina ${pages.indexOf(page) + 1}`}
              >
                {/* Always show page index badge (high-contrast) */}
                <div
                  className={`
                    absolute top-0 left-0 m-1 px-2 py-0.5 rounded-sm font-semibold
                    text-[11px] leading-none
                    ${isDarkMode
                      ? 'bg-blue-600 text-white ring-1 ring-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
                      : 'bg-blue-600 text-white ring-1 ring-black/40 shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                    }
                  `}
                >
                  {pages.findIndex(p => p.id === page.id) + 1}
                </div>

                {thumbnail?.isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={`w-4 h-4 border-2 ${loadingColor} border-t-transparent rounded-full animate-spin`} />
                  </div>
                ) : thumbnail?.thumbnail ? (
                  <img
                    src={thumbnail.thumbnail}
                    alt={page.name || `Pagina ${pages.indexOf(page) + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className={`text-xs ${textColor}`} />
                )}
                {isActive && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />
                )}
                
                {/* Delete button - appears on hover after 0.5s */}
                {showDeleteButton === page.id && pages.length > 1 && (
                  <button
                    onClick={(e) => handleDeletePage(page.id, e)}
                    className={`
                      absolute top-0 right-0 w-5 h-5 rounded-full
                      ${isDarkMode 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                      }
                      flex items-center justify-center
                      transition-all duration-200
                      shadow-lg z-50
                    `}
                    title="Șterge pagina"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
          
          {/* Add page button - styled as a page */}
          <button
            onClick={handleCreatePage}
            disabled={isCreatingPage}
            className={`
              relative w-20 h-12 rounded border-2 transition-all duration-300 ease-in-out
              ${pageBorder} ${pageBg} ${pageBorderHover}
              flex items-center justify-center overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-md hover:scale-110 hover:z-50
            `}
            title="Adaugă pagină nouă"
          >
            {isCreatingPage ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className={`w-4 h-4 border-2 ${loadingColor} border-t-transparent rounded-full animate-spin`} />
              </div>
            ) : (
              <Plus className={`h-5 w-5 ${textColor}`} />
            )}
          </button>
        </div>

        {/* Right arrow - only show if more than 4 pages */}
        {showArrows && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleArrowRight}
            disabled={!canScrollRight}
            className={`h-8 w-8 ${arrowColor} disabled:opacity-30`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

