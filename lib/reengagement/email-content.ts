import type { ReengagementPersonalization, ReengagementTier } from "@/lib/reengagement/types"

/** Subject lines pushed to MailerLite custom field `reeng_subject`. */
export function buildReengagementSubject(
  tier: ReengagementTier,
  data: Pick<
    ReengagementPersonalization,
    "first_name" | "last_work_label" | "progress_percent" | "materie" | "current_streak" | "days_inactive"
  >
): string {
  switch (tier) {
    case 1:
      return data.last_work_label
        ? `Poți continua de la ${data.last_work_label}`
        : "Poți continua de unde ai rămas"
    case 2:
      return data.progress_percent > 0
        ? `Ai avansat ${data.progress_percent}% — streak-ul s-a oprit la ${data.current_streak} zile`
        : `Streak-ul tău de ${data.current_streak} zile s-a întrerupt`
    case 3:
      return data.progress_percent > 0
        ? `Mai ai ${100 - data.progress_percent}% din ${data.materie} — e momentul să revii`
        : `Conținut nou te așteaptă la ${data.materie}`
    case 4:
      return `Mai vrei să continui pregătirea la ${data.materie}?`
    default:
      return "Continuă pregătirea pe Planck"
  }
}

/** Reference copy for MailerLite template authors (not sent as HTML from code). */
export function getReengagementBodyReference(tier: ReengagementTier): string {
  switch (tier) {
    case 1:
      return [
        "Salut {$reeng_first_name},",
        "",
        "Acum {$reeng_days_inactive} zile ai lucrat la {$reeng_last_work}.",
        "Poți relua exact de acolo:",
        "{$reeng_cta_url}",
      ].join("\n")
    case 2:
      return [
        "Salut {$reeng_first_name},",
        "",
        "Ai parcurs {$reeng_progress_pct}% din {$reeng_materie}.",
        "Streak-ul tău s-a oprit la {$reeng_streak} zile.",
        "Continuă de unde ai rămas:",
        "{$reeng_cta_url}",
      ].join("\n")
    case 3:
      return [
        "Salut {$reeng_first_name},",
        "",
        "Au trecut {$reeng_days_inactive} zile de la ultima ta sesiune.",
        "Pe Planck avem conținut nou la {$reeng_materie} — {$reeng_progress_pct}% din capitolul tău e deja acoperit.",
        "Revino acum:",
        "{$reeng_cta_url}",
      ].join("\n")
    case 4:
      return [
        "Salut {$reeng_first_name},",
        "",
        "Te mai interesează să continui pregătirea la {$reeng_materie}?",
        "",
        "Da, vreau să continui: {$reeng_cta_url}",
        "",
        "Dacă nu mai vrei emailuri de la noi: {$unsubscribe}",
      ].join("\n")
    default:
      return ""
  }
}

/** MailerLite custom field keys (must match dashboard setup). */
export const MAILERLITE_REENGAGEMENT_FIELDS = {
  first_name: "reeng_first_name",
  days_inactive: "reeng_days_inactive",
  last_work: "reeng_last_work",
  progress_pct: "reeng_progress_pct",
  materie: "reeng_materie",
  streak: "reeng_streak",
  cta_url: "reeng_cta_url",
  tier: "reeng_tier",
  send_id: "reeng_send_id",
  subject: "reeng_subject",
} as const

export function personalizationToMailerLiteFields(
  data: ReengagementPersonalization
): Record<string, string> {
  return {
    [MAILERLITE_REENGAGEMENT_FIELDS.first_name]: data.first_name,
    [MAILERLITE_REENGAGEMENT_FIELDS.days_inactive]: String(data.days_inactive),
    [MAILERLITE_REENGAGEMENT_FIELDS.last_work]: data.last_work_label,
    [MAILERLITE_REENGAGEMENT_FIELDS.progress_pct]: String(data.progress_percent),
    [MAILERLITE_REENGAGEMENT_FIELDS.materie]: data.materie,
    [MAILERLITE_REENGAGEMENT_FIELDS.streak]: String(data.current_streak),
    [MAILERLITE_REENGAGEMENT_FIELDS.cta_url]: data.cta_url,
    [MAILERLITE_REENGAGEMENT_FIELDS.tier]: String(data.reeng_tier),
    [MAILERLITE_REENGAGEMENT_FIELDS.send_id]: data.reeng_send_id,
    [MAILERLITE_REENGAGEMENT_FIELDS.subject]: data.subject,
  }
}
