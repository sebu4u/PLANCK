export { Toaster } from "sonner"
export type { ExternalToast, ToastT } from "sonner"

import { toast as sonnerToast } from "sonner"
import { playNotificationSound } from "@/lib/platform-sounds"

function playAndCall<T>(fn: (...args: never[]) => T, ...args: Parameters<typeof fn>): T {
  playNotificationSound()
  return fn(...args)
}

function toastWithSound(...args: Parameters<typeof sonnerToast>) {
  playNotificationSound()
  return sonnerToast(...args)
}

export const toast = Object.assign(toastWithSound, {
  ...sonnerToast,
  success: (...args: Parameters<typeof sonnerToast.success>) =>
    playAndCall(sonnerToast.success, ...args),
  error: (...args: Parameters<typeof sonnerToast.error>) =>
    playAndCall(sonnerToast.error, ...args),
  info: (...args: Parameters<typeof sonnerToast.info>) => playAndCall(sonnerToast.info, ...args),
  warning: (...args: Parameters<typeof sonnerToast.warning>) =>
    playAndCall(sonnerToast.warning, ...args),
  message: (...args: Parameters<typeof sonnerToast.message>) =>
    playAndCall(sonnerToast.message, ...args),
  promise: sonnerToast.promise,
  custom: (...args: Parameters<typeof sonnerToast.custom>) =>
    playAndCall(sonnerToast.custom, ...args),
  dismiss: sonnerToast.dismiss,
  loading: (...args: Parameters<typeof sonnerToast.loading>) =>
    playAndCall(sonnerToast.loading, ...args),
})
