"use client"

import type { EngagementNotification, EngagementType } from "@/lib/engagement/types"
import { ENGAGEMENT_COOLDOWNS_MS, GLOBAL_THROTTLE_MS, HIGH_PRIORITY_BYPASS } from "@/lib/engagement/cooldowns"
import { supabase } from "@/lib/supabaseClient"

const PREFIX = "planck_engagement"

function canUseStorage() {
  return typeof window !== "undefined"
}

function getNumber(key: string): number {
  if (!canUseStorage()) return 0
  const value = window.localStorage.getItem(key)
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function setNumber(key: string, value: number) {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // Storage can be unavailable in private contexts.
  }
}

function storageScope(userId?: string | null) {
  return userId || "anonymous"
}

function globalKey(userId?: string | null) {
  return `${PREFIX}:${storageScope(userId)}:last_global`
}

function typeKey(userId: string | null | undefined, type: EngagementType) {
  return `${PREFIX}:${storageScope(userId)}:type:${type}`
}

function dedupeStorageKey(userId: string | null | undefined, key: string) {
  return `${PREFIX}:${storageScope(userId)}:dedupe:${key}`
}

export function getMsUntilGlobalAvailable(userId?: string | null) {
  const elapsed = Date.now() - getNumber(globalKey(userId))
  return Math.max(0, GLOBAL_THROTTLE_MS - elapsed)
}

export function shouldSkipEngagementNotification(
  notification: EngagementNotification,
  userId?: string | null
) {
  const now = Date.now()
  const typeCooldown = notification.cooldownMs ?? ENGAGEMENT_COOLDOWNS_MS[notification.type]
  const lastTypeShownAt = getNumber(typeKey(userId, notification.type))

  if (lastTypeShownAt && now - lastTypeShownAt < typeCooldown) {
    return true
  }

  if (notification.dedupeKey) {
    const dedupeShownAt = getNumber(dedupeStorageKey(userId, notification.dedupeKey))
    if (dedupeShownAt) return true
  }

  const lastGlobalShownAt = getNumber(globalKey(userId))
  const bypassesGlobalThrottle = notification.priority >= HIGH_PRIORITY_BYPASS
  return !bypassesGlobalThrottle && lastGlobalShownAt > 0 && now - lastGlobalShownAt < GLOBAL_THROTTLE_MS
}

export function markEngagementNotificationShown(
  notification: EngagementNotification,
  userId?: string | null
) {
  const now = Date.now()
  setNumber(globalKey(userId), now)
  setNumber(typeKey(userId, notification.type), now)
  if (notification.dedupeKey) {
    setNumber(dedupeStorageKey(userId, notification.dedupeKey), now)
  }
}

export function isEngagementCardDismissed(notification: EngagementNotification, userId?: string | null) {
  if (!canUseStorage() || !notification.dedupeKey) return false
  return window.sessionStorage.getItem(`${PREFIX}:${storageScope(userId)}:dismissed:${notification.dedupeKey}`) === "true"
}

export function markEngagementCardDismissed(notification: EngagementNotification, userId?: string | null) {
  if (!canUseStorage() || !notification.dedupeKey) return
  try {
    window.sessionStorage.setItem(`${PREFIX}:${storageScope(userId)}:dismissed:${notification.dedupeKey}`, "true")
  } catch {
    // Ignore storage errors.
  }
}

export function logEngagementNotificationShown(
  notification: EngagementNotification,
  userId?: string | null
) {
  if (!userId) return

  void supabase
    .from("user_engagement_notifications")
    .insert({
      user_id: userId,
      type: notification.type,
      dedupe_key: notification.dedupeKey ?? null,
    })
    .then(({ error }) => {
      if (error && process.env.NODE_ENV === "development") {
        console.warn("engagement notification log failed:", error.message)
      }
    })
}

