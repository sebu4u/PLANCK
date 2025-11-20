"use client"

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TldrawImage, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import type { StoreSnapshot, TLRecord } from '@tldraw/tldraw';

interface BoardPreviewProps {
  boardId: string;
  className?: string;
}

type SketchSnapshot = StoreSnapshot<TLRecord>;

const DEFAULT_PREVIEW_SCHEMA = (() => {
  try {
    const store = createTLStore({ shapeUtils: defaultShapeUtils });
    return store.schema.serialize();
  } catch (error) {
    console.warn('[BoardPreview] Failed to create default schema:', error);
    return {} as any;
  }
})();

export function BoardPreview({ boardId, className = '' }: BoardPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasContent, setHasContent] = useState(false);
  const [snapshot, setSnapshot] = useState<SketchSnapshot | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const sanitizeSnapshot = (value: SketchSnapshot | null | undefined): SketchSnapshot | null => {
      if (!value || typeof value !== 'object') {
        return null;
      }

      const store =
        value.store && typeof value.store === 'object'
          ? (value.store as Record<string, TLRecord>)
          : {};

      const schema =
        value.schema && typeof value.schema === 'object' && Object.keys(value.schema).length > 0
          ? value.schema
          : DEFAULT_PREVIEW_SCHEMA;

      if (Object.keys(store).length === 0) {
        return null;
      }

      return {
        store,
        schema,
      } as SketchSnapshot;
    };

    const loadPreview = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/sketch/boards/${boardId}/pages`);

        if (!response.ok) {
          if (!isMounted) return;
          setIsLoading(false);
          setHasContent(false);
          return;
        }

        const data = await response.json();
        const pages = (data.pages || []) as Array<{
          page_id: string;
          snapshot: SketchSnapshot | null;
          hasShapes?: boolean;
          index?: number;
        }>;

        if (pages.length === 0) {
          if (!isMounted) return;
          setIsLoading(false);
          setHasContent(false);
          return;
        }

        let preferredPageId: string | null = null;
        const lastPageKey = `planck-sketch:lastPage:${boardId}`;

        try {
          preferredPageId = window.localStorage.getItem(lastPageKey);
        } catch (err) {
          console.warn('Cannot access localStorage for preview:', err);
        }

        const pagesWithShapes = pages.filter((page) => page.hasShapes);
        let targetPage =
          pagesWithShapes.find((page) => page.page_id === preferredPageId) ||
          null;

        if (!targetPage && preferredPageId) {
          try {
            window.localStorage.removeItem(lastPageKey);
          } catch (err) {
            console.warn('Could not clear outdated page preference:', err);
          }
        }

        if (!targetPage) {
          targetPage = pagesWithShapes.length > 0 ? pagesWithShapes[0] : null;
        }

        const normalizedSnapshot = sanitizeSnapshot(targetPage?.snapshot);

        if (!targetPage || !normalizedSnapshot) {
          if (!isMounted) return;
          setIsLoading(false);
          setHasContent(false);
          return;
        }

        if (!isMounted) return;
        setSnapshot(normalizedSnapshot);
        setPageId(targetPage.page_id);
        setHasContent(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load preview:', error);
        if (!isMounted) return;
        setIsLoading(false);
        setHasContent(false);
        setSnapshot(null);
        setPageId(null);
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [boardId]);

  if (isLoading) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-black/10 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400/50" />
      </div>
    );
  }

  if (!hasContent || !snapshot || !pageId) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-black/5 ${className}`}>
        <div className="text-center text-gray-400/60">
          <svg
            className="w-8 h-8 mx-auto mb-1.5 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <p className="text-[10px]">Empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <TldrawImage
        snapshot={snapshot}
        pageId={pageId}
        format="png"
        background
        darkMode
        padding={32}
        scale={0.4}
      />
    </div>
  );
}

