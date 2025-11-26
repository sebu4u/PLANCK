"use client";

import { Button } from "@/components/ui/button";
import { Delete, RotateCcw } from "lucide-react";

type MobileMathKeyboardProps = {
  onInsert: (value: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit?: () => void;
};

const BASIC_KEYS = [
  ["7", "8", "9", "(", ")"],
  ["4", "5", "6", "+", "-"],
  ["1", "2", "3", "×", "÷"],
  ["0", ".", "^", "x", "y"],
];

const FUNCTION_KEYS = ["sin", "cos", "tan", "log", "ln"];
const EXTRA_KEYS = ["√", "|x|", "π", "e"];

export function MobileMathKeyboard({
  onInsert,
  onDelete,
  onClear,
}: MobileMathKeyboardProps) {
  const translateValue = (value: string) => {
    switch (value) {
      case "×":
        return "*";
      case "÷":
        return "/";
      case "π":
        return "pi";
      case "√":
        return "sqrt(";
      case "|x|":
        return "abs(";
      case "sin":
      case "cos":
      case "tan":
      case "log":
      case "ln":
        return `${value}(`;
      default:
        return value;
    }
  };

  const renderKey = (label: string, className?: string) => (
    <Button
      key={label}
      type="button"
      variant="secondary"
      className={`flex-1 rounded-xl bg-white text-gray-900 shadow-sm text-lg h-11 active:scale-95 transition-transform ${className || ""}`}
      onClick={() => onInsert(translateValue(label))}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-2">
      {/* Function row */}
      <div className="flex gap-1.5">
        {FUNCTION_KEYS.map((fn) => (
          <Button
            key={fn}
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl border-gray-300 bg-gray-50 text-xs h-9 font-medium active:scale-95 transition-transform"
            onClick={() => onInsert(translateValue(fn))}
          >
            {fn}
          </Button>
        ))}
      </div>

      {/* Extra functions row */}
      <div className="flex gap-1.5">
        {EXTRA_KEYS.map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl border-gray-300 bg-gray-50 text-xs h-9 font-medium active:scale-95 transition-transform"
            onClick={() => onInsert(translateValue(key))}
          >
            {key}
          </Button>
        ))}
      </div>

      {/* Number pad */}
      {BASIC_KEYS.map((row) => (
        <div key={row.join("-")} className="flex gap-1.5">
          {row.map((key) => renderKey(key))}
        </div>
      ))}

      {/* Bottom row: delete and clear */}
      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 rounded-xl bg-gray-200 text-gray-700 h-11 active:scale-95 transition-transform"
          onClick={onDelete}
        >
          <Delete className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-[2] rounded-xl bg-gray-200 text-gray-700 h-11 active:scale-95 transition-transform"
          onClick={onClear}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Șterge tot
        </Button>
      </div>
    </div>
  );
}



