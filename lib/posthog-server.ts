import { PostHog } from "posthog-node"

import { logger } from "@/lib/logger"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com"

export async function capturePosthogServerEvent(input: {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}): Promise<void> {
  if (process.env.NODE_ENV === "development" || !POSTHOG_KEY) return

  const client = new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })

  try {
    client.capture({
      distinctId: input.distinctId,
      event: input.event,
      properties: input.properties,
    })
    await client.flush()
  } catch (error) {
    logger.warn("[posthog] Failed to capture server event", error)
  } finally {
    await client.shutdown().catch(() => undefined)
  }
}
