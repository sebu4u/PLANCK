import "server-only"

import {
  getSubscriberByEmail,
  upsertSubscriber,
  isSubscriberSendable,
  MailerLiteApiError,
  MAILERLITE_SEND_DELAY_MS,
  mailerLiteDelay,
} from "@/lib/mailerlite/client"

const MAILERLITE_API_URL = "https://connect.mailerlite.com/api"

function getApiKey(): string {
  const key = process.env.MAILERLITE_API_KEY
  if (!key) throw new Error("MAILERLITE_API_KEY is not configured")
  return key
}

async function mailerLiteFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${MAILERLITE_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${getApiKey()}`,
      ...(options.headers ?? {}),
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = { message: response.statusText }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : response.statusText
    throw new MailerLiteApiError(message, response.status, body)
  }

  return body as T
}

async function removeSubscriberFromGroup(
  subscriberId: string,
  groupId: string
): Promise<void> {
  try {
    await mailerLiteFetch<void>(
      `/subscribers/${subscriberId}/groups/${groupId}`,
      { method: "DELETE" }
    )
  } catch (error) {
    if (error instanceof MailerLiteApiError && error.status === 404) {
      return
    }
    throw error
  }
}

async function addSubscriberToGroup(
  subscriberId: string,
  groupId: string
): Promise<void> {
  await mailerLiteFetch<void>(`/subscribers/${subscriberId}/groups/${groupId}`, {
    method: "POST",
  })
}

type WorkshopReminderKind = "confirm" | "24h" | "30m" | "10m"

interface WorkshopEmailFields {
  ws_title: string
  ws_when: string
  ws_url: string
  ws_meet_url?: string
  ws_teacher: string
  ws_subject: string
  ws_confirm_url?: string
}

const GROUP_ID_ENV_MAP: Record<WorkshopReminderKind, string> = {
  confirm: "MAILERLITE_WS_GROUP_CONFIRM",
  "24h": "MAILERLITE_WS_GROUP_24H",
  "30m": "MAILERLITE_WS_GROUP_30M",
  "10m": "MAILERLITE_WS_GROUP_MEET_10M",
}

const GROUP_ID_DEFAULTS: Record<WorkshopReminderKind, string> = {
  confirm: "197667016412235619",
  "24h": "197667016293745753",
  "30m": "197667017537357019",
  "10m": "197667017605514371",
}

function getGroupIdForKind(kind: WorkshopReminderKind): string {
  const envVar = GROUP_ID_ENV_MAP[kind]
  return process.env[envVar] || GROUP_ID_DEFAULTS[kind]
}

export interface TriggerWorkshopEmailInput {
  email: string
  kind: WorkshopReminderKind
  fields: WorkshopEmailFields
}

export interface TriggerWorkshopEmailResult {
  ok: true
  subscriberId?: string
}

export interface TriggerWorkshopEmailError {
  ok: false
  message: string
}

/**
 * Trigger a workshop email automation via MailerLite.
 * 
 * 1. Upserts subscriber with workshop fields (ws_title, ws_when, ws_url, ws_meet_url, ws_teacher, ws_subject)
 * 2. Removes subscriber from trigger group if already present (so re-join fires automation)
 * 3. Adds subscriber to trigger group
 * 
 * Does NOT resubscribe unsubscribed users — respects their status.
 */
export async function triggerWorkshopEmail(
  input: TriggerWorkshopEmailInput
): Promise<TriggerWorkshopEmailResult | TriggerWorkshopEmailError> {
  try {
    const normalized = input.email.trim().toLowerCase()
    
    // Check existing subscriber status
    const existing = await getSubscriberByEmail(normalized)
    if (existing && !isSubscriberSendable(existing.status)) {
      return {
        ok: false,
        message: `subscriber_${existing.status}`,
      }
    }

    // Upsert subscriber with fields
    const subscriber = await upsertSubscriber(normalized, {
      fields: {
        ws_title: input.fields.ws_title,
        ws_when: input.fields.ws_when,
        ws_url: input.fields.ws_url,
        ws_meet_url: input.fields.ws_meet_url || "",
        ws_teacher: input.fields.ws_teacher,
        ws_subject: input.fields.ws_subject,
        ws_confirm_url: input.fields.ws_confirm_url || "",
      },
    })

    const groupId = getGroupIdForKind(input.kind)

    // Remove from group first (so re-add triggers automation)
    await removeSubscriberFromGroup(subscriber.id, groupId)
    await mailerLiteDelay(MAILERLITE_SEND_DELAY_MS)

    // Add to trigger group
    await addSubscriberToGroup(subscriber.id, groupId)

    return {
      ok: true,
      subscriberId: subscriber.id,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
