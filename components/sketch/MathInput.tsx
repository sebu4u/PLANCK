"use client"

import { useEffect, useRef, useState } from 'react';

// Dynamic import for MathLive (browser-only)
let MathfieldElement: any = null;
let isMathLiveLoaded = false;

const loadMathLive = async () => {
  if (isMathLiveLoaded) return;
  
  if (typeof window !== 'undefined') {
    try {
      const mathlive = await import('mathlive');
      MathfieldElement = mathlive.MathfieldElement;
      
      // Import CSS
      await import('mathlive/fonts.css');
      
      // Register the custom element
      if (!customElements.get('math-field') && MathfieldElement) {
        customElements.define('math-field', MathfieldElement);
      }
      
      isMathLiveLoaded = true;
    } catch (error) {
      console.error('Failed to load MathLive:', error);
    }
  }
};

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string | null) => void;
  placeholder?: string;
  className?: string;
  showVirtualKeyboard?: boolean;
  autoFocus?: boolean;
  hideErrorMessage?: boolean;
  disableNativeKeyboard?: boolean;
  onMathFieldReady?: (field: any) => void;
}

export function MathInput({
  value,
  onChange,
  onError,
  placeholder = 'Introduceți ecuația...',
  className = '',
  showVirtualKeyboard = true,
  autoFocus = false,
  hideErrorMessage = false,
  disableNativeKeyboard = false,
  onMathFieldReady,
}: MathInputProps) {
  const mathFieldRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const keyboardOpenAttemptedRef = useRef<boolean>(false);
  const focusHandlerRef = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mathFieldRef.current) return;
    if (disableNativeKeyboard) {
      mathFieldRef.current.setAttribute('virtual-keyboard-mode', 'off');
      mathFieldRef.current.setAttribute('inputmode', 'none');
      mathFieldRef.current.setAttribute('readonly', 'true');
    } else {
      mathFieldRef.current.setAttribute('virtual-keyboard-mode', showVirtualKeyboard ? 'onfocus' : 'manual');
      mathFieldRef.current.setAttribute('inputmode', 'text');
      mathFieldRef.current.removeAttribute('readonly');
    }
  }, [showVirtualKeyboard, disableNativeKeyboard]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load MathLive first
    loadMathLive().then(() => {
      if (!containerRef.current || !MathfieldElement) return;

      // Create math field if it doesn't exist
      if (!mathFieldRef.current) {
        const mathField = document.createElement('math-field') as any;
        mathField.setAttribute('style', 'width: 100%; min-height: 60px;');
        // Use 'manual' mode to prevent automatic toggling, we'll control it manually
        mathField.setAttribute('virtual-keyboard-mode', showVirtualKeyboard ? 'manual' : 'manual');
        mathField.setAttribute('virtual-keyboard-layout', 'auto');
        mathField.setAttribute('smart-fence', 'true');
        mathField.setAttribute('smart-superscript', 'true');
        mathField.setAttribute('remove-extraneous-parentheses', 'true');
        mathField.setAttribute('plonk-sound', 'false');
        
        if (disableNativeKeyboard) {
          // Completely disable MathLive's virtual keyboard on mobile
          mathField.setAttribute('virtual-keyboard-mode', 'off');
          mathField.setAttribute('inputmode', 'none');
          mathField.setAttribute('readonly', 'true');
          mathField.setAttribute('data-custom-keyboard', 'true');
          mathField.style.caretColor = '#2563eb';
          // Prevent focus from triggering any keyboard
          mathField.addEventListener('focus', (e: FocusEvent) => {
            e.preventDefault();
            // Blur any input that might trigger native keyboard
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          });
        }

        // Set initial value
        if (value) {
          mathField.value = value;
        }

        // Handle input events
        mathField.addEventListener('input', () => {
          let newValue = mathField.value as string;

          // Normalize functions to include parentheses when missing
          // Handle both plain (e.g., sin) and LaTeX commands (e.g., \sin)
          try {
            const fnGroup = '(sin|cos|tan|ln|log|exp|sqrt|asin|acos|atan|sinh|cosh|tanh)';
            // Plain text functions without following bracket/paren
            const plainFnRegex = new RegExp(`\\b${fnGroup}\\b(?!\\s*[({\\[])`, 'gi');
            // LaTeX functions without following bracket/paren
            const latexFnRegex = new RegExp(`\\\\${fnGroup}\\b(?!\\s*[({\\[])`, 'gi');

            let normalized = newValue.replace(plainFnRegex, (_m) => {
              // Keep original case for function name
              const name = _m;
              return `${name}()`;
            });
            normalized = normalized.replace(latexFnRegex, (_m) => {
              // _m starts with backslash, preserve it
              return `${_m}()`;
            });

            if (normalized !== newValue) {
              newValue = normalized;
              // Update the field value to reflect normalization
              mathField.value = newValue;
            }
          } catch {
            // No-op on normalization errors; proceed with raw value
          }

          onChange(newValue);
          
          // Validate the expression
          try {
            // Basic validation - check if it's a valid expression
            if (newValue.trim()) {
              // Try to parse as a function (basic check)
              const testExpr = newValue.replace(/[xy]/g, '1');
              // eslint-disable-next-line no-eval
              eval(`(${testExpr})`);
              setError(null);
              if (onError) onError(null);
            } else {
              setError(null);
              if (onError) onError(null);
            }
          } catch (e) {
            const errorMsg = 'Expresie matematică invalidă';
            setError(errorMsg);
            if (onError) onError(errorMsg);
          }
        });

        const openVirtualKeyboard = () => {
          // Prevent multiple attempts in quick succession
          if (keyboardOpenAttemptedRef.current) return;
          
          // Small delay to ensure MathLive is ready
          setTimeout(() => {
            try {
              // Check current keyboard state first
              const currentState = mathField.virtualKeyboardState || 'hidden';
              
              // If keyboard is already visible or showing, don't do anything
              if (currentState === 'visible' || currentState === 'showing') {
                return;
              }
              
              // Only open if keyboard is hidden or hiding
              if (currentState === 'hidden' || currentState === 'hiding') {
                keyboardOpenAttemptedRef.current = true;
                
                if (mathField.showVirtualKeyboard) {
                  mathField.showVirtualKeyboard();
                } else if (mathField.executeCommand) {
                  // Use showVirtualKeyboard command if available
                  try {
                    mathField.executeCommand('showVirtualKeyboard');
                  } catch {
                    // Fallback to toggle only if show doesn't work
                    mathField.executeCommand('toggleVirtualKeyboard');
                  }
                }
                
                // Reset flag after a delay to allow future opens
                setTimeout(() => {
                  keyboardOpenAttemptedRef.current = false;
                }, 2000);
              }
            } catch (e) {
              console.warn('Could not open virtual keyboard:', e);
              keyboardOpenAttemptedRef.current = false;
            }
          }, 400);
        };

        // Store the handler reference for cleanup
        focusHandlerRef.current = openVirtualKeyboard;

        // Open virtual keyboard automatically on focus (only for desktop)
        if (showVirtualKeyboard && !disableNativeKeyboard) {
          mathField.addEventListener('focus', openVirtualKeyboard);
        }

        mathFieldRef.current = mathField;
        containerRef.current.appendChild(mathField);
        if (onMathFieldReady) {
          onMathFieldReady(mathField);
        }
      }

      // Update value if it changes externally
      if (mathFieldRef.current && mathFieldRef.current.value !== value) {
        mathFieldRef.current.value = value;
      }

      if (autoFocus && mathFieldRef.current) {
        // Delay focus to ensure Dialog is fully rendered
        setTimeout(() => {
          try {
            mathFieldRef.current?.focus();
            // Also manually open keyboard after focus
            if (showVirtualKeyboard && !disableNativeKeyboard && focusHandlerRef.current) {
              setTimeout(() => {
                focusHandlerRef.current?.();
              }, 200);
            }
          } catch (err) {
            console.warn('Could not focus math field:', err);
          }
        }, 100);
      }
    });

    // Cleanup: remove event listener when component unmounts or dependencies change
    return () => {
      if (mathFieldRef.current && focusHandlerRef.current) {
        mathFieldRef.current.removeEventListener('focus', focusHandlerRef.current);
        focusHandlerRef.current = null;
      }
    };
  }, [value, onChange, onError, showVirtualKeyboard, autoFocus, disableNativeKeyboard, onMathFieldReady]);

  return (
    <div className={`w-full ${className}`}>
      <div ref={containerRef} className="w-full" />
      {!hideErrorMessage && error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

