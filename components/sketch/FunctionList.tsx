"use client"

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { MathFunction } from '@/lib/sketch/function-persistence';
import { InlineMath } from 'react-katex';

interface FunctionListProps {
  functions: MathFunction[];
  onUpdate: (functionId: string, updates: Partial<MathFunction>) => void;
  onDelete: (functionId: string) => void;
  onSelect?: (functionId: string) => void;
  selectedFunctionId?: string;
}

export function FunctionList({
  functions,
  onUpdate,
  onDelete,
  onSelect,
  selectedFunctionId,
}: FunctionListProps) {
  // Ensure functions is always an array
  const safeFunctions = functions || [];
  
  if (safeFunctions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200">
        Nu există funcții. Apăsați „Adaugă funcție” pentru a începe.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {safeFunctions.map((func) => {
        const isSelected = selectedFunctionId === func.function_id;

        return (
          <div
            key={func.function_id}
            className={`
              flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm transition-colors
              ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
              ${!func.is_visible ? 'opacity-60' : ''}
            `}
            data-function-card="true"
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(func.function_id);
            }}
          >
            <FunctionColorPicker
              color={func.color}
              onChange={(color) => onUpdate(func.function_id, { color })}
            />

            <div className="flex-1 min-w-0 flex items-center gap-2 text-sm text-gray-900">
              <span className="italic text-gray-500">f(x) =</span>
              <div className="truncate">
                <FunctionEquation equation={func.equation} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {func.is_visible ? (
                <Eye className="h-4 w-4 text-gray-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <Switch
                checked={func.is_visible}
                onCheckedChange={() => onUpdate(func.function_id, { is_visible: !func.is_visible })}
                onClick={(e) => e.stopPropagation()}
                className={func.is_visible ? 'data-[state=checked]:bg-gray-700' : ''}
                aria-label={func.is_visible ? 'Ascunde funcția' : 'Afișează funcția'}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(func.function_id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function FunctionEquation({ equation }: { equation: string }) {
  if (!equation?.trim()) {
    return <span className="text-sm text-gray-400 italic">Fără ecuație</span>;
  }

  try {
    return <InlineMath math={equation} className="text-gray-900" />;
  } catch (err) {
    console.warn('Nu am putut reda ecuația cu KaTeX:', equation, err);
    return <span className="font-mono text-sm text-gray-900 break-all">{equation}</span>;
  }
}

function FunctionColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        className="h-6 w-6 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{ backgroundColor: color }}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        aria-label="Schimbă culoarea funcției"
      />
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        value={color}
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  );
}

