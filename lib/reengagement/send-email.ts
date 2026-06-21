import "server-only"

import {
  getSubscriberByEmail,
  isSubscriberSendable,
  MAILERLITE_SEND_DELAY_MS,
  mailerLiteDelay,
  upsertSubscriber,
} from "@/lib/mailerlite/client"
import { personalizationToMailerLiteFields } from "@/lib/reengagement/email-content"
import type { ReengagementPersonalization, ReengagementTier } from "@/lib/reengagement/types"

export interface SendReengagementEmailInput {
  email: string
  tier: ReengagementTier
  personalization: ReengagementPersonalization
}

export type SendReengagementEmailResult =
  | { ok: true; subscriberId: string; sendId: string }
  | { ok: false; reason: "not_sendable" | "api_error"; message: string }

/**
 * Triggers a MailerLite automation by upserting subscriber custom fields.
 * Templates/automations must be configured in the MailerLite dashboard.
 */
export async function sendReengagementEmail(
  input: SendReengagementEmailInput
): Promise<SendReengagementEmailResult> {
  const { email, personalization } = input
  const groupId = process.env.MAILERLITE_REENGAGEMENT_GROUP_ID

  try {
    const existing = await getSubscriberByEmail(email)
    if (existing && !isSubscriberSendable(existing.status)) {
      return {
        ok: false,
        reason: "not_sendable",
        message: `Subscriber status: ${existing.status}`,
      }
    }

    await mailerLiteDelay(MAILERLITE_SEND_DELAY_MS)

    const fields = personalizationToMailerLiteFields(personalization)
    const subscriber = await upsertSubscriber(email, {
      fields,
      groups: groupId ? [groupId] : undefined,
      status: "active",
    })

    return {
      ok: true,
      subscriberId: subscriber.id,
      sendId: personalization.reeng_send_id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, reason: "api_error", message }
  }
}
