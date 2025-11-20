"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FunctionPlot, type FunctionData } from './FunctionPlot';
import { MathInput } from './MathInput';
import { FunctionList } from './FunctionList';
import { FunctionPersistence, type MathFunction } from '@/lib/sketch/function-persistence';
import { FunctionRealtimeSync } from '@/lib/sketch/function-realtime-sync';
import { Plus, RotateCcw, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MathGraphPanelProps {
  boardId: string;
  pageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function MathGraphPanel({ boardId, pageId, open, onOpenChange }: MathGraphPanelProps) {
  const [functions, setFunctions] = useState<MathFunction[]>([]);
  const [currentEquation, setCurrentEquation] = useState('');
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | undefined>();
  const defaultXDomain: [number, number] = [-10, 10];
  const defaultYDomain: [number, number] = [-2, 18];
  const [xDomain, setXDomain] = useState<[number, number]>(defaultXDomain);
  const [yDomain, setYDomain] = useState<[number, number]>(defaultYDomain);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(600);
  const [graphHeight, setGraphHeight] = useState(360);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const persistenceRef = useRef<FunctionPersistence | null>(null);
  const realtimeSyncRef = useRef<FunctionRealtimeSync | null>(null);

  const handleDialogInteractOutside = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (
      target.closest('.ML__virtual-keyboard') ||
      target.closest('.ML__keyboard') ||
      target.closest('.ML__keyboard-row')
    ) {
      event.preventDefault();
    }
  };

  const handleKeyboardClose = () => {
    setIsKeyboardOpen(false);
    setCurrentEquation('');
  };

  const handleKeyboardOpen = () => {
    setCurrentEquation('');
    setIsKeyboardOpen(true);
  };

  // Initialize persistence and realtime sync
  useEffect(() => {
    if (!boardId || !pageId) return;

    persistenceRef.current = new FunctionPersistence({
      boardId,
      onError: (err) => {
        console.error('[MathGraphPanel] Persistence error:', err);
        setError(err.message);
      },
      debounceMs: 300,
    });

    realtimeSyncRef.current = new FunctionRealtimeSync({
      boardId,
      pageId,
      onFunctionUpdate: (updatedFunctions) => {
        console.log('[MathGraphPanel] Received function update:', updatedFunctions);
        setFunctions(updatedFunctions);
      },
      onError: (err) => {
        console.error('[MathGraphPanel] Realtime sync error:', err);
      },
    });

    // Load initial functions
    loadFunctions();

    // Subscribe to realtime updates
    realtimeSyncRef.current.subscribe().catch((err) => {
      console.error('[MathGraphPanel] Failed to subscribe to realtime:', err);
    });

    return () => {
      persistenceRef.current?.destroy();
      realtimeSyncRef.current?.destroy();
    };
  }, [boardId, pageId]);

  useEffect(() => {
    if (selectedFunctionId && !functions.some((f) => f.function_id === selectedFunctionId)) {
      setSelectedFunctionId(undefined);
    }
  }, [functions, selectedFunctionId]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) {
        return;
      }
      setSelectedFunctionId(undefined);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  // Calculate graph dimensions based on container
  useEffect(() => {
    if (!open) return;

    const updateDimensions = () => {
      if (!graphContainerRef.current) return;
      const containerWidth = graphContainerRef.current.offsetWidth;
      const containerHeight = graphContainerRef.current.offsetHeight;
      setGraphWidth(Math.max(320, containerWidth));
      setGraphHeight(Math.max(280, containerHeight));
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIsPanelVisible(false);
      return;
    }

    setIsPanelVisible(false);
    const frame = requestAnimationFrame(() => setIsPanelVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // When panel opens, adjust Y domain once based on current functions and X range
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      adjustYDomainForRange(xDomain, functions);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadFunctions = async () => {
    if (!persistenceRef.current || !pageId) return;

    setIsLoading(true);
    try {
      const loadedFunctions = await persistenceRef.current.loadFunctions(pageId);
      setFunctions(loadedFunctions);
    } catch (err) {
      console.error('[MathGraphPanel] Failed to load functions:', err);
      setError('Eroare la încărcarea funcțiilor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFunction = async () => {
    const equation = currentEquation.trim();
    if (!equation) {
      setError('Introduceți o ecuație');
      return;
    }

    try {
      const converted = convertMathToJS(equation);
      if (!converted || !isPlotExpressionValid(converted)) {
        setError('Expresie matematică invalidă');
        return;
      }
    } catch (err) {
      setError('Expresie matematică invalidă');
      return;
    }

    if (!persistenceRef.current || !pageId) return;

    try {
      const functionId = `func-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const colorIndex = functions.length % DEFAULT_COLORS.length;
      const color = DEFAULT_COLORS[colorIndex];

      const newFunction: Omit<MathFunction, 'id' | 'created_at' | 'updated_at'> = {
        board_id: boardId,
        page_id: pageId,
        function_id: functionId,
        equation,
        color,
        is_visible: true,
      };

      // Save function
      await persistenceRef.current.saveFunction(pageId, newFunction);

      // Add to local state optimistically
      const fullFunction: MathFunction = {
        ...newFunction,
        id: functionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setFunctions((prev) => [...prev, fullFunction]);

      // Broadcast update
      if (realtimeSyncRef.current) {
        await realtimeSyncRef.current.broadcastUpdate([...functions, fullFunction]);
      }

      // Adjust Y domain once after adding the function
      requestAnimationFrame(() => {
        adjustYDomainForRange(xDomain, [...functions, fullFunction]);
      });

      // Clear input
      setCurrentEquation('');
      setError(null);
      setIsKeyboardOpen(false);
    } catch (err: any) {
      console.error('[MathGraphPanel] Failed to add function:', err);
      setError(err.message || 'Eroare la adăugarea funcției');
    }
  };

  const handleUpdateFunction = async (functionId: string, updates: Partial<MathFunction>) => {
    if (!persistenceRef.current || !pageId) return;

    try {
      const functionToUpdate = functions.find((f) => f.function_id === functionId);
      if (!functionToUpdate) return;

      const updatedFunction = { ...functionToUpdate, ...updates };

      await persistenceRef.current.saveFunction(pageId, {
        board_id: updatedFunction.board_id,
        page_id: updatedFunction.page_id,
        function_id: updatedFunction.function_id,
        equation: updatedFunction.equation,
        color: updatedFunction.color,
        is_visible: updatedFunction.is_visible,
      });

      // Update local state
      setFunctions((prev) =>
        prev.map((f) => (f.function_id === functionId ? updatedFunction : f))
      );

      // Broadcast update
      if (realtimeSyncRef.current) {
        const updatedFunctions = functions.map((f) =>
          f.function_id === functionId ? updatedFunction : f
        );
        await realtimeSyncRef.current.broadcastUpdate(updatedFunctions);
      }
    } catch (err: any) {
      console.error('[MathGraphPanel] Failed to update function:', err);
      setError(err.message || 'Eroare la actualizarea funcției');
    }
  };

  const handleDeleteFunction = async (functionId: string) => {
    if (!persistenceRef.current || !pageId) return;

    try {
      await persistenceRef.current.deleteFunction(pageId, functionId);

      // Update local state
      setFunctions((prev) => prev.filter((f) => f.function_id !== functionId));

      // Broadcast update
      if (realtimeSyncRef.current) {
        const updatedFunctions = functions.filter((f) => f.function_id !== functionId);
        await realtimeSyncRef.current.broadcastUpdate(updatedFunctions);
      }
    } catch (err: any) {
      console.error('[MathGraphPanel] Failed to delete function:', err);
      setError(err.message || 'Eroare la ștergerea funcției');
    }
  };

  const handleZoomChange = useCallback((newXDomain: [number, number], newYDomain: [number, number]) => {
    setXDomain(newXDomain);
    setYDomain(newYDomain);
  }, []);

  const handleResetZoom = () => {
    setXDomain(defaultXDomain);
    setYDomain(defaultYDomain);
    // After reset, adjust Y domain once based on current functions and default X range
    requestAnimationFrame(() => {
      adjustYDomainForRange(defaultXDomain, functions);
    });
  };

  // Estimate Y range for visible functions over an X interval
  const estimateYRange = useCallback(
    (xMin: number, xMax: number, functionList?: MathFunction[]) => {
      const list = functionList ?? functions;
      if (!list.length) {
        return null;
      }
      const numSamples = 101;
      const step = (xMax - xMin) / (numSamples - 1);
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      let foundAny = false;

      for (let i = 0; i < numSamples; i++) {
        const x = xMin + i * step;
        for (const f of list) {
          if (!(f as any).is_visible || !(f as any).equation || !(f as any).equation.trim()) continue;
          try {
            const converted = convertMathToJS((f as any).equation);
            if (!converted) continue;
            const evaluator = new Function('x', `
              const pi = Math.PI;
              const e = Math.E;
              const ln = Math.log;
              const log = Math.log;
              const log10 = Math.log10;
              const exp = Math.exp;
              const sqrt = Math.sqrt;
              const abs = Math.abs;
              const pow = Math.pow;
              const sinh = Math.sinh || ((v) => (Math.exp(v) - Math.exp(-v)) / 2);
              const cosh = Math.cosh || ((v) => (Math.exp(v) + Math.exp(-v)) / 2);
              const tanh = Math.tanh || ((v) => {
                const ePos = Math.exp(v);
                const eNeg = Math.exp(-v);
                return (ePos - eNeg) / (ePos + eNeg);
              });
              with (Math) {
                return ${converted};
              }
            `);
            const y = evaluator(x);
            if (typeof y === 'number' && Number.isFinite(y)) {
              foundAny = true;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          } catch {
            // ignore sampling errors
          }
        }
      }

      if (!foundAny) return null;
      return { minY, maxY };
    },
    [functions]
  );

  // Apply Y domain so that origin is centered when function spans negative and positive values
  const applyYDomainFromRange = (minY: number, maxY: number) => {
    if (minY < 0 && maxY > 0) {
      const maxAbs = Math.max(Math.abs(minY), Math.abs(maxY));
      const padding = maxAbs * 0.1 || 1;
      const upper = maxAbs + padding;
      const lower = -upper;
      setYDomain([lower, upper]);
    } else if (minY >= 0) {
      const upper = Math.max(maxY * 1.2, defaultYDomain[1]);
      const lower = Math.min(-1, defaultYDomain[0]);
      setYDomain([lower, upper]);
    } else {
      // All negative values
      const lowerAbs = Math.max(Math.abs(minY) * 1.2, Math.abs(defaultYDomain[0]));
      const lower = -lowerAbs;
      const upper = Math.max(1, defaultYDomain[1]);
      setYDomain([lower, upper]);
    }
  };

  // Convenience: compute range on a given xDomain and apply Y domain once
  const adjustYDomainForRange = (xDom: [number, number], functionList?: MathFunction[]) => {
    const [xMin, xMax] = xDom;
    const range = estimateYRange(xMin, xMax, functionList);
    if (!range) return;
    applyYDomainFromRange(range.minY, range.maxY);
  };

  // Helper function to convert exponentiation (^) to pow()
  const convertExponentiation = (expr: string): string => {
    const isDelimiter = (char: string) => /[\s+\-*/,=<>!&|]/.test(char);

    const extractBase = (input: string): { base: string; start: number } | null => {
      let base = '';
      let parenCount = 0;
      let i = input.length - 1;

      // Skip trailing whitespace
      while (i >= 0 && /\s/.test(input[i])) i--;

      let end = i;

      while (i >= 0) {
        const char = input[i];

        if (char === ')') {
          parenCount++;
          base = char + base;
        } else if (char === '(') {
          parenCount--;
          base = char + base;
          if (parenCount < 0) {
            parenCount = 0;
            break;
          }
        } else if (parenCount === 0 && isDelimiter(char)) {
          break;
        } else {
          base = char + base;
        }
        i--;
      }

      const trimmed = base.trim();
      if (!trimmed) return null;

      const start = i + 1;
      return { base: trimmed, start };
    };

    const extractExponent = (input: string, startIndex: number): { exponent: string; end: number } | null => {
      let i = startIndex;

      // Skip whitespace
      while (i < input.length && /\s/.test(input[i])) i++;
      if (i >= input.length) return null;

      let exponent = '';

      if (input[i] === '{') {
        let depth = 0;
        while (i < input.length) {
          const char = input[i];
          exponent += char;
          if (char === '{') depth++;
          else if (char === '}') {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          i++;
        }
      } else if (input[i] === '(') {
        let depth = 0;
        while (i < input.length) {
          const char = input[i];
          exponent += char;
          if (char === '(') depth++;
          else if (char === ')') {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          i++;
        }
      } else {
        while (i < input.length && !isDelimiter(input[i]) && input[i] !== '^') {
          exponent += input[i];
          i++;
        }
      }

      const trimmed = exponent.trim();
      if (!trimmed) return null;

      return { exponent: trimmed, end: i };
    };

    let result = expr;
    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations) {
      iterations++;
      let changed = false;

      // Handle ^{...} patterns first by manually replacing base+exponent
      const braceRegex = /\^\{([^}]+)\}/g;
      let match: RegExpExecArray | null;
      while ((match = braceRegex.exec(result)) !== null) {
        const exponentContent = match[1];
        const beforeMatch = result.slice(0, match.index);
        const afterMatch = result.slice(match.index + match[0].length);
        const baseInfo = extractBase(beforeMatch);
        if (!baseInfo) continue;

        const { base, start } = baseInfo;
        const prefix = beforeMatch.slice(0, start);
        result = `${prefix}pow(${base}, ${exponentContent})${afterMatch}`;
        changed = true;
        break;
      }
      if (changed) continue;

      // Handle remaining caret patterns by scanning
      const caretIndex = result.indexOf('^');
      if (caretIndex === -1) {
        break;
      }

      const beforeCaret = result.slice(0, caretIndex);
      const baseInfo = extractBase(beforeCaret);
      if (!baseInfo) {
        // Remove the caret to avoid infinite loops
        result = result.replace('^', '');
        continue;
      }

      const exponentInfo = extractExponent(result, caretIndex + 1);
      if (!exponentInfo) {
        result = result.replace('^', '');
        continue;
      }

      const { base, start } = baseInfo;
      const { exponent, end } = exponentInfo;

      const prefix = beforeCaret.slice(0, start);
      const suffix = result.slice(end);
      result = `${prefix}pow(${base}, ${exponent})${suffix}`;
      changed = true;
    }

    return result;
  };

  const isPlotExpressionValid = (expr: string): boolean => {
    if (!expr) return false;
    try {
      const evaluator = new Function('x', `
        const pi = Math.PI;
        const e = Math.E;
        const ln = Math.log;
        const log = Math.log;
        const log10 = Math.log10;
        const exp = Math.exp;
        const sqrt = Math.sqrt;
        const abs = Math.abs;
        const pow = Math.pow;
        const sinh = Math.sinh || ((v) => (Math.exp(v) - Math.exp(-v)) / 2);
        const cosh = Math.cosh || ((v) => (Math.exp(v) + Math.exp(-v)) / 2);
        const tanh = Math.tanh || ((v) => {
          const ePos = Math.exp(v);
          const eNeg = Math.exp(-v);
          return (ePos - eNeg) / (ePos + eNeg);
        });
        with (Math) {
          return ${expr};
        }
      `);
      const samples = [-10, -1, 0, 1, 10];
      for (const sample of samples) {
        const value = evaluator(sample);
        if (Number.isNaN(value)) {
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('Equation failed validation:', expr, err);
      return false;
    }
  };

  // Convert MathLive format to JavaScript expression for function-plot
  const convertMathToJS = (equation: string): string => {
    if (!equation) return '';
    
    let jsExpr = equation.trim();
    
    // First, handle LaTeX commands with backslashes (before removing them)
    // Convert LaTeX functions to evaluator-friendly format
    jsExpr = jsExpr
      // Fractions: \frac{a}{b}, \dfrac{a}{b}, \tfrac{a}{b}
      .replace(/\\(?:d|t)?frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      // Normalize unicode division symbols to '/'
      .replace(/÷|∕/g, '/') 
      .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, 'pow($2, 1/$1)') // nth root
      .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)') // Square root
      .replace(/\\ln\(/g, 'ln(') // Natural log
      .replace(/\\log\(/g, 'log10(') // Log base 10
      .replace(/\\exp\(/g, 'exp(') // Exponential
      .replace(/\\abs\{([^}]+)\}/g, 'abs($1)') // Absolute value
      .replace(/\\pi\b/g, 'pi') // Pi constant
      .replace(/\\e\b/g, 'e') // Euler's number
      .replace(/\\sin\(/g, 'sin(')
      .replace(/\\cos\(/g, 'cos(')
      .replace(/\\tan\(/g, 'tan(')
      .replace(/\\arcsin\(/g, 'asin(')
      .replace(/\\arccos\(/g, 'acos(')
      .replace(/\\arctan\(/g, 'atan(')
      .replace(/\\sinh\(/g, 'sinh(')
      .replace(/\\cosh\(/g, 'cosh(')
      .replace(/\\tanh\(/g, 'tanh(')
      .replace(/\\cdot/g, '*') // Multiplication dot
      .replace(/\\times/g, '*') // Times
      .replace(/\\div/g, '/'); // Division
    
    // Convert exponentiation to pow() BEFORE removing curly braces
    jsExpr = convertExponentiation(jsExpr);
    
    // Remove curly braces (common in LaTeX) - but preserve content
    jsExpr = jsExpr.replace(/\{([^}]+)\}/g, '$1');
    
    // Remove any remaining LaTeX commands with backslashes
    jsExpr = jsExpr.replace(/\\[a-zA-Z]+\{?[^}]*\}?/g, '');
    
    // Now remove remaining backslashes
    jsExpr = jsExpr.replace(/\\/g, '');

    // Handle standalone constants after cleanup
    // Replace pi with numeric constant so function-plot can evaluate it
    jsExpr = jsExpr.replace(/\bpi\b/gi, '(3.141592653589793)');
    jsExpr = jsExpr.replace(/\be\b(?![a-zA-Z0-9_])/gi, 'exp(1)');
    
    // Ensure implicit multiplication is explicit without breaking function names
    // Add * between a number and a variable/function, allowing optional whitespace
    jsExpr = jsExpr.replace(/(\d)\s*(?=[a-zA-Z(])/g, '$1*'); // 2 x or 3 sin(x)
    // Add * between a closing paren and a following token, allowing optional whitespace
    jsExpr = jsExpr.replace(/(\))\s*(?=[a-zA-Z\d(])/g, '$1*'); // ) x or ) ( or ) 2
    // Add * between variable and opening paren, allowing optional whitespace
    jsExpr = jsExpr.replace(/(^|[^a-zA-Z0-9_])([xy])\s*(?=\()/gi, (_, prefix, variable) => `${prefix}${variable}*`); // x (
    // Add * between variable and a function/variable name
    jsExpr = jsExpr.replace(/(^|[^a-zA-Z0-9_])([xy])\s*(?=[a-zA-Z])/gi, (_, prefix, variable) => `${prefix}${variable}*`); // x sin
    // Add * between variable and a digit
    jsExpr = jsExpr.replace(/(^|[^a-zA-Z0-9_])([xy])\s*(?=\d)/gi, (_, prefix, variable) => `${prefix}${variable}*`); // x 2
    
    // Clean up any double operators or invalid patterns
    // Clean up multiple * (multiplication) to single *
    jsExpr = jsExpr.replace(/\*+/g, '*');
    jsExpr = jsExpr.replace(/\s+/g, ' '); // Normalize whitespace
    jsExpr = jsExpr.trim();
    
    return jsExpr;
  };

  // Validate and convert MathFunction to FunctionData for plotting
  const functionData: FunctionData[] = functions
    .filter((f) => f.is_visible && f.equation && f.equation.trim())
    .map((f) => {
      try {
        let convertedEquation = convertMathToJS(f.equation);
        
        // If conversion resulted in empty string, try using original (might already be in JS format)
        if (!convertedEquation || convertedEquation.trim() === '') {
          convertedEquation = f.equation.trim();
        }
        
        // Validate that there are no undefined symbols (like "ti", "ma", etc.)
        const invalidSymbolPattern = /\b[a-z]{2,}(?![a-z]*\()/g;
        const matches = convertedEquation.match(invalidSymbolPattern);
        if (matches) {
          // Filter out valid patterns (known functions, variables, constants)
          const validPatterns = [
            'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
            'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
            'log', 'log10', 'ln', 'exp', 'sqrt', 'abs', 'pow',
            'x', 'y', 'pi'
          ];
          const invalidSymbols = matches.filter(m => !validPatterns.some(p => m.includes(p)));
          if (invalidSymbols.length > 0) {
            console.warn(`Equation contains invalid symbols: ${invalidSymbols.join(', ')}. Original: ${f.equation}, Converted: ${convertedEquation}`);
            return null;
          }
        }

        if (!convertedEquation) {
          return null;
        }

        if (!isPlotExpressionValid(convertedEquation)) {
          console.warn(`Equation failed runtime validation and will be skipped: ${convertedEquation}`);
          return null;
        }

        const containsVariable = /(^|[^a-zA-Z0-9_])x(?![a-zA-Z0-9_])/i.test(convertedEquation);
        const finalEquation = containsVariable
          ? convertedEquation
          : `(${convertedEquation}) + (0 * x)`;

        const isSelected = selectedFunctionId === f.function_id;
        const isDimmed = !!selectedFunctionId && !isSelected;

        return {
          fn: finalEquation,
          color: f.color,
          graphType: 'polyline' as const,
          attr: {
            'stroke-width': isSelected ? 4 : 2.5,
            'stroke-opacity': isDimmed ? 0.25 : 1,
          },
        };
      } catch (err) {
        console.warn(`Failed to convert equation: ${f.equation}`, err);
        return null;
      }
    })
    .filter((f): f is FunctionData => f !== null);

  return (
    <>
      <div
        ref={panelRef}
        className={cn(
          "relative w-full sm:w-[620px] lg:w-[720px] bg-[#f5f6f8] text-gray-900 border-l border-gray-200 flex flex-col overflow-hidden flex-shrink-0 transform transition-all duration-300 ease-out",
          isPanelVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}
        onClickCapture={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[data-function-card="true"]')) {
            return;
          }
          setSelectedFunctionId(undefined);
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-20 text-gray-500 hover:text-gray-900 hover:bg-white/80 shadow-md"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex flex-col h-full">
          <div
            className="relative flex-shrink-0 w-full"
            style={{ flexBasis: '50%', minHeight: '360px' }}
          >
            <div ref={graphContainerRef} className="absolute inset-0">
              <FunctionPlot
                functions={functionData}
                width={graphWidth}
                height={graphHeight}
                xDomain={xDomain}
                yDomain={yDomain}
                grid={true}
                disableZoom={false}
                onZoomChange={handleZoomChange}
                className="rounded-none border-none"
                backgroundColor="#ffffff"
                gridColor="#d4d7de"
                axisColor="#6b7280"
              />
            </div>
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetZoom}
                className="h-9 rounded-full bg-white/80 text-gray-700 hover:text-gray-900 hover:bg-white shadow-md"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Zoom
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
              <Button
                onClick={handleKeyboardOpen}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adaugă funcție
              </Button>

              <Separator className="bg-gray-200" />

              <div className="flex flex-col gap-3 pb-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Funcții active
                  </p>
                  <p className="text-sm font-medium text-gray-600">
                    {functions.length} funcție{functions.length === 1 ? '' : 'i'}
                  </p>
                </div>
                <FunctionList
                  functions={functions}
                  onUpdate={handleUpdateFunction}
                  onDelete={handleDeleteFunction}
                  onSelect={setSelectedFunctionId}
                  selectedFunctionId={selectedFunctionId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isKeyboardOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleKeyboardClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl" onInteractOutside={handleDialogInteractOutside}>
          <DialogHeader>
            <DialogTitle>Adaugă o funcție</DialogTitle>
            <DialogDescription>
              Tastatura matematică se deschide automat pentru a introduce ecuația.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <MathInput
              value={currentEquation}
              onChange={setCurrentEquation}
                onError={() => setError(null)}
              placeholder="ex: x^2 + 2*x + 1 sau sin(x)"
              showVirtualKeyboard={true}
              autoFocus
              hideErrorMessage
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleKeyboardClose}>
                Renunță
              </Button>
              <Button
                onClick={handleAddFunction}
                disabled={!currentEquation.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adaugă funcția
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600 text-right">
                {error}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

