import "server-only"

const MAILERLITE_API_URL = "https://connect.mailerlite.com/api"

export type MailerLiteSubscriberStatus =
  | "active"
  | "unsubscribed"
  | "unconfirmed"
  | "bounced"
  | "junk"

export interface MailerLiteSubscriber {
  id: string
  email: string
  status: MailerLiteSubscriberStatus
  fields?: Record<string, string | null>
}

export class MailerLiteApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = "MailerLiteApiError"
  }
}

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

function unwrapSubscriber(data: unknown): MailerLiteSubscriber | null {
  if (!data || typeof data !== "object") return null
  const wrapped = data as { data?: MailerLiteSubscriber }
  if (wrapped.data?.email) return wrapped.data
  const direct = data as MailerLiteSubscriber
  if (direct.email) return direct
  return null
}

export function isSubscriberSendable(status: MailerLiteSubscriberStatus): boolean {
  return status === "active"
}

export async function getSubscriberByEmail(
  email: string
): Promise<MailerLiteSubscriber | null> {
  const normalized = email.trim().toLowerCase()
  try {
    const result = await mailerLiteFetch<unknown>(
      `/subscribers/${encodeURIComponent(normalized)}`
    )
    return unwrapSubscriber(result)
  } catch (error) {
    if (error instanceof MailerLiteApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function upsertSubscriber(
  email: string,
  options: {
    fields?: Record<string, string>
    groups?: string[]
    status?: MailerLiteSubscriberStatus
  } = {}
): Promise<MailerLiteSubscriber> {
  const normalized = email.trim().toLowerCase()
  const body: Record<string, unknown> = {
    email: normalized,
    status: options.status ?? "active",
  }
  if (options.fields && Object.keys(options.fields).length > 0) {
    body.fields = options.fields
  }
  if (options.groups?.length) {
    body.groups = options.groups
  }

  const result = await mailerLiteFetch<unknown>("/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  })

  const subscriber = unwrapSubscriber(result)
  if (!subscriber) {
    throw new MailerLiteApiError("Unexpected MailerLite response shape", 500, result)
  }
  return subscriber
}

export async function unsubscribeSubscriber(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  await mailerLiteFetch<unknown>(`/subscribers/${encodeURIComponent(normalized)}`, {
    method: "PUT",
    body: JSON.stringify({ status: "unsubscribed" }),
  })
}

/** Delay helper for rate limiting between API calls. */
export function mailerLiteDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const MAILERLITE_SEND_DELAY_MS = 500

export async function addSubscriberToMailerLiteGroup(email: string, groupId: string) {
  return upsertSubscriber(email, { groups: [groupId] })
}
