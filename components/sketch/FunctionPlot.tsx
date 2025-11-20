"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface FunctionData {
  fn: string;
  color?: string;
  graphType?: 'polyline' | 'scatter' | 'interval';
  attr?: {
    'stroke-width'?: number;
  };
}

interface FunctionPlotProps {
  functions: FunctionData[];
  width?: number;
  height?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  grid?: boolean;
  disableZoom?: boolean;
  onZoomChange?: (xDomain: [number, number], yDomain: [number, number]) => void;
  className?: string;
  backgroundColor?: string;
  axisColor?: string;
  gridColor?: string;
}

export function FunctionPlot({
  functions,
  width = 600,
  height = 400,
  xDomain = [-10, 10],
  yDomain = [-10, 10],
  grid = true,
  disableZoom = false,
  onZoomChange,
  className,
  backgroundColor = '#ffffff',
  axisColor = '#4b5563',
  gridColor = '#d1d5db',
}: FunctionPlotProps) {
  const PAN_SENSITIVITY = 0.2;
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<any>(null);
  const functionPlotRef = useRef<any>(null);
  const containerIdRef = useRef(`function-plot-${Math.random().toString(36).slice(2, 10)}`);
  const styleElRef = useRef<HTMLStyleElement | null>(null);
  const currentDomainRef = useRef<{
    x: [number, number];
    y: [number, number];
  }>({ x: xDomain, y: yDomain });
  const [isLoaded, setIsLoaded] = useState(false);
  const panStateRef = useRef<{
    isDragging: boolean;
    pointerId: number | null;
    start: { x: number; y: number };
    startDomain: { x: [number, number]; y: [number, number] };
  }>({
    isDragging: false,
    pointerId: null,
    start: { x: 0, y: 0 },
    startDomain: { x: xDomain, y: yDomain },
  });
  const pendingDomainRef = useRef<{ x: [number, number]; y: [number, number] } | null>(null);
  const panAnimationRef = useRef<number | null>(null);

  const applyDomains = useCallback(
    (newX: [number, number], newY: [number, number], notify = true) => {
      if (!plotRef.current || !plotRef.current.meta) return;
      const normalizedX: [number, number] = [newX[0], newX[1]];
      const normalizedY: [number, number] = [newY[0], newY[1]];
      plotRef.current.meta.xScale.domain(normalizedX);
      plotRef.current.meta.yScale.domain(normalizedY);
      if (plotRef.current.meta.zoomBehavior) {
        plotRef.current.meta.zoomBehavior.xScale.domain(normalizedX);
        plotRef.current.meta.zoomBehavior.yScale.domain(normalizedY);
      }
      currentDomainRef.current = { x: normalizedX, y: normalizedY };
      plotRef.current.draw();
      if (notify && onZoomChange) {
        onZoomChange(normalizedX, normalizedY);
      }
    },
    [onZoomChange]
  );

  const scheduleDomainUpdate = useCallback(
    (newX: [number, number], newY: [number, number]) => {
      pendingDomainRef.current = { x: newX, y: newY };
      if (panAnimationRef.current !== null) return;
      panAnimationRef.current = window.requestAnimationFrame(() => {
        panAnimationRef.current = null;
        if (!pendingDomainRef.current) return;
        applyDomains(pendingDomainRef.current.x, pendingDomainRef.current.y, true);
      });
    },
    [applyDomains]
  );

  // Load function-plot dynamically (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined' || isLoaded) return;

    // Use dynamic import for client-side only
    const loadFunctionPlot = async () => {
      try {
        const functionPlotModule = await import('function-plot');
        // Handle different export formats
        functionPlotRef.current =
          functionPlotModule.default ||
          functionPlotModule ||
          (functionPlotModule as any).functionPlot;
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load function-plot:', error);
      }
    };

    loadFunctionPlot();
  }, [isLoaded]);

  useEffect(() => {
    if (!containerRef.current || !isLoaded || !functionPlotRef.current) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Filter out invalid functions before plotting
    const validFunctions = functions.filter((fn) => {
      if (!fn.fn || !fn.fn.trim()) return false;
      // Check for common invalid characters that cause parser errors
      const invalidChars = /[\\{}]/;
      if (invalidChars.test(fn.fn)) {
        console.warn(`Skipping function with invalid characters: ${fn.fn}`);
        return false;
      }
      return true;
    });

    if (validFunctions.length === 0) {
      // Render empty plot with origin centered
      try {
        const xMaxAbs = Math.max(Math.abs(xDomain[0]), Math.abs(xDomain[1]));
        const yMaxAbs = Math.max(Math.abs(yDomain[0]), Math.abs(yDomain[1]));
        const centeredX: [number, number] = [-xMaxAbs, xMaxAbs];
        const centeredY: [number, number] = [-yMaxAbs, yMaxAbs];

        const options: any = {
          target: containerRef.current,
          width,
          height,
          xAxis: {
            domain: centeredX,
            label: 'x',
          },
          yAxis: {
            domain: centeredY,
            label: 'y',
          },
          grid,
          data: [],
          disableZoom: true,
        };

        plotRef.current = functionPlotRef.current(options);
        currentDomainRef.current = { x: [...centeredX] as [number, number], y: [...centeredY] as [number, number] };
      } catch (error: any) {
        console.error('Error rendering empty plot:', error);
        containerRef.current.innerHTML = `<div class="flex items-center justify-center h-full text-red-400 p-4 text-center">Eroare la afișarea graficului</div>`;
      }
      return;
    }

    try {
      const options: any = {
        target: containerRef.current,
        width,
        height,
        xAxis: {
          domain: xDomain,
          label: 'x',
        },
        yAxis: {
          domain: yDomain,
          label: 'y',
        },
        grid,
        data: validFunctions.map((fn) => ({
          fn: fn.fn,
          color: fn.color || '#3b82f6',
          graphType: fn.graphType || 'polyline',
          attr: fn.attr || { 'stroke-width': 3 },
        })),
        disableZoom: true,
      };

      plotRef.current = functionPlotRef.current(options);
      currentDomainRef.current = { x: [...xDomain] as [number, number], y: [...yDomain] as [number, number] };

      if (onZoomChange && !disableZoom) {
        const interval = setInterval(() => {
          if (!plotRef.current?.meta) return;
          const meta = plotRef.current.meta;
          const newXDomain: [number, number] = [meta.xScale.domain()[0], meta.xScale.domain()[1]];
          const newYDomain: [number, number] = [meta.yScale.domain()[0], meta.yScale.domain()[1]];
          const prevX = currentDomainRef.current.x;
          const prevY = currentDomainRef.current.y;

          if (
            newXDomain[0] !== prevX[0] ||
            newXDomain[1] !== prevX[1] ||
            newYDomain[0] !== prevY[0] ||
            newYDomain[1] !== prevY[1]
          ) {
            currentDomainRef.current = { x: newXDomain, y: newYDomain };
            onZoomChange(newXDomain, newYDomain);
          }
        }, 200);

        return () => {
          clearInterval(interval);
        };
      }
    } catch (error: any) {
      console.error('Error plotting functions:', error);
      // Show error message in container
      containerRef.current.innerHTML = `<div class="flex items-center justify-center h-full text-red-400 p-4 text-center">Eroare la afișarea graficului: ${error?.message || 'Expresie matematică invalidă'}</div>`;
    }
  }, [functions, width, height, xDomain, yDomain, grid, disableZoom, onZoomChange, isLoaded]);

  useEffect(() => {
    return () => {
      if (panAnimationRef.current !== null && typeof window !== 'undefined') {
        cancelAnimationFrame(panAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (disableZoom) return;
    const element = containerRef.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      if (!plotRef.current?.meta) return;
      event.preventDefault();

      const meta = plotRef.current.meta;
      const zoomIntensity = 0.35;
      const direction = event.deltaY < 0 ? -1 : 1;
      const scaleFactor = direction < 0 ? 1 - zoomIntensity : 1 + zoomIntensity;

      const minRange = 1e-4;
      const [x0, x1] = currentDomainRef.current.x;
      const [y0, y1] = currentDomainRef.current.y;

      // Compute cursor position in data coordinates, if possible
      let cursorX = (x0 + x1) / 2;
      let cursorY = (y0 + y1) / 2;

      try {
        const rect = element.getBoundingClientRect();
        const margin = meta.margin || meta.margins || { left: 0, top: 0 };
        const svgX = event.clientX - rect.left - (margin.left ?? 0);
        const svgY = event.clientY - rect.top - (margin.top ?? 0);
        if (meta.xScale?.invert && meta.yScale?.invert) {
          cursorX = meta.xScale.invert(svgX);
          cursorY = meta.yScale.invert(svgY);
        }
      } catch {
        // Fallback to center if we can't compute
      }

      // Zoom keeping the cursor point fixed
      const leftDistX = cursorX - x0;
      const rightDistX = x1 - cursorX;
      const bottomDistY = cursorY - y0;
      const topDistY = y1 - cursorY;

      const newX0 = cursorX - Math.max(leftDistX * scaleFactor, minRange);
      const newX1 = cursorX + Math.max(rightDistX * scaleFactor, minRange);
      const newY0 = cursorY - Math.max(bottomDistY * scaleFactor, minRange);
      const newY1 = cursorY + Math.max(topDistY * scaleFactor, minRange);

      applyDomains([newX0, newX1], [newY0, newY1], true);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (!plotRef.current || !plotRef.current.meta) return;
      event.preventDefault();

      panStateRef.current = {
        isDragging: true,
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        startDomain: {
          x: [...currentDomainRef.current.x] as [number, number],
          y: [...currentDomainRef.current.y] as [number, number],
        },
      };

      try {
        element.setPointerCapture(event.pointerId);
      } catch (err) {
        // Ignore if pointer capture is unsupported
      }
      element.style.cursor = 'grabbing';
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!panStateRef.current.isDragging || !plotRef.current?.meta) return;
      event.preventDefault();

      const dx = event.clientX - panStateRef.current.start.x;
      const dy = event.clientY - panStateRef.current.start.y;

      const startX = panStateRef.current.startDomain.x;
      const startY = panStateRef.current.startDomain.y;
      const meta = plotRef.current.meta;
      const innerWidth = meta?.width || width;
      const innerHeight = meta?.height || height;
      if (!innerWidth || !innerHeight) return;

      const unitsPerPixelX = (startX[1] - startX[0]) / innerWidth;
      const unitsPerPixelY = (startY[1] - startY[0]) / innerHeight;

      const deltaXUnits = dx * unitsPerPixelX * PAN_SENSITIVITY;
      const deltaYUnits = -dy * unitsPerPixelY * PAN_SENSITIVITY;

      const newX: [number, number] = [startX[0] - deltaXUnits, startX[1] - deltaXUnits];
      const newY: [number, number] = [startY[0] - deltaYUnits, startY[1] - deltaYUnits];

      scheduleDomainUpdate(newX, newY);
    };

    const endDrag = (event?: PointerEvent) => {
      if (!panStateRef.current.isDragging) return;
      panStateRef.current.isDragging = false;
      panStateRef.current.pointerId = null;
      element.style.cursor = '';
      if (event?.pointerId !== undefined && element.hasPointerCapture?.(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault();
      endDrag(event);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      endDrag(event);
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointerleave', handlePointerCancel);
    element.addEventListener('pointercancel', handlePointerCancel);
    element.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointerleave', handlePointerCancel);
      element.removeEventListener('pointercancel', handlePointerCancel);
      element.removeEventListener('wheel', handleWheel, { capture: true } as any);
    };
  }, [disableZoom, scheduleDomainUpdate, width, height, applyDomains]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!styleElRef.current) {
      styleElRef.current = document.createElement('style');
      containerRef.current.appendChild(styleElRef.current);
    }

    styleElRef.current.textContent = `
      #${containerIdRef.current} svg {
        background-color: ${backgroundColor};
      }
      #${containerIdRef.current} .x.axis path,
      #${containerIdRef.current} .y.axis path,
      #${containerIdRef.current} .x.axis .tick line,
      #${containerIdRef.current} .y.axis .tick line {
        stroke: ${gridColor};
        opacity: 0.6;
      }
      #${containerIdRef.current} .x.axis text,
      #${containerIdRef.current} .y.axis text {
        fill: ${axisColor};
      }
    `;

    return () => {
      if (styleElRef.current) {
        styleElRef.current.remove();
        styleElRef.current = null;
      }
    };
  }, [axisColor, gridColor, backgroundColor]);

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center overflow-hidden",
        className
      )}
      style={{ backgroundColor }}
    >
      <div ref={containerRef} id={containerIdRef.current} className="w-full h-full" />
    </div>
  );
}

