"use client"

import { AlertCircle, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={2000} swipeDirection="down">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive"

        return (
          <Toast key={id} variant={variant} {...props}>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center"
              aria-hidden
            >
              {isDestructive ? (
                <AlertCircle className="h-5 w-5 text-[#111111]" strokeWidth={2.25} />
              ) : (
                <Check className="h-5 w-5 text-[#111111]" strokeWidth={2.5} />
              )}
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5 pr-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
