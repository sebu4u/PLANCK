# Re-engagement emails (MailerLite + Vercel Cron)

Job zilnic care identifică useri inactivi și declanșează emailuri personalizate via MailerLite automations.

## Arhitectură

1. **Vercel Cron** apelează `GET /api/cron/reengagement` zilnic la 06:00 UTC (~08:00 RO iarnă).
2. **Cod** calculează tier-ul, verifică istoricul în `user_reengagement_email_sends`, construiește personalizarea.
3. **MailerLite API** upsert subscriber + custom fields → automation trimite emailul.

## Variabile de mediu

| Variabilă | Obligatoriu | Descriere |
|-----------|-------------|-----------|
| `CRON_SECRET` | Da (prod) | Bearer token pentru cron |
| `MAILERLITE_API_KEY` | Da | API key MailerLite |
| `MAILERLITE_REENGAGEMENT_GROUP_ID` | Recomandat | Grup pentru subscriberi re-engagement |
| `MAILERLITE_WEBHOOK_SECRET` | Recomandat | Semnătură webhook unsubscribe |
| `SUPABASE_SERVICE_ROLE_KEY` | Da | Query useri + send log |
| `ADMIN_EMAILS` | Opțional | Exclude admini din job |

## Praguri tier

| Tier | Zile inactive | Frecvență |
|------|---------------|-----------|
| 1 | ≥ 4 | o dată |
| 2 | ≥ 9 | o dată |
| 3 | ≥ 18 | o dată |
| 4 | ≥ 30 | la 14 zile, indefinit |

## Setup MailerLite (one-time)

### 1. Custom fields

Creează în MailerLite → Subscribers → Fields:

| Field key | Tip | Exemplu |
|-----------|-----|---------|
| `reeng_first_name` | Text | Maria |
| `reeng_days_inactive` | Text | 12 |
| `reeng_last_work` | Text | Legea a II-a — Lecția 3 |
| `reeng_progress_pct` | Text | 45 |
| `reeng_materie` | Text | Fizică |
| `reeng_streak` | Text | 5 |
| `reeng_cta_url` | Text | https://www.planck.academy/invata/... |
| `reeng_tier` | Text | 2 |
| `reeng_send_id` | Text | uuid unic per trimitere |
| `reeng_subject` | Text | subiect dinamic |

### 2. Grup re-engagement

- Creează grup `Planck Re-engagement`
- Copiază ID-ul în `MAILERLITE_REENGAGEMENT_GROUP_ID`

### 3. Automations (4 bucăți)

Pentru fiecare tier N (1–4):

- **Trigger:** Custom field updated → `reeng_send_id`
- **Condition:** `reeng_tier` equals `N`
- **Action:** Send email (template mai jos)
- **Action (opțional):** Remove from group după trimitere

### 4. Template-uri email (RO, fără emoji)

Folosește merge tags MailerLite: `{$reeng_first_name}`, `{$reeng_cta_url}`, `{$unsubscribe}`.

**Tier 1 — ton neutru**

```
Subject: {$reeng_subject}

Salut {$reeng_first_name},

Acum {$reeng_days_inactive} zile ai lucrat la {$reeng_last_work}.

Poți relua exact de acolo:
{$reeng_cta_url}
```

**Tier 2 — progres pierdut**

```
Subject: {$reeng_subject}

Salut {$reeng_first_name},

Ai parcurs {$reeng_progress_pct}% din {$reeng_materie}.
Streak-ul tău s-a oprit la {$reeng_streak} zile.

Continuă de unde ai rămas:
{$reeng_cta_url}
```

**Tier 3 — urgență**

```
Subject: {$reeng_subject}

Salut {$reeng_first_name},

Au trecut {$reeng_days_inactive} zile de la ultima ta sesiune.
Pe Planck avem conținut nou la {$reeng_materie}.

Revino acum:
{$reeng_cta_url}
```

**Tier 4 — scurt, cu unsubscribe vizibil**

```
Subject: {$reeng_subject}

Salut {$reeng_first_name},

Te mai interesează să continui pregătirea la {$reeng_materie}?

{$reeng_cta_url}

---
Nu mai vreau emailuri: {$unsubscribe}
```

Stil vizual: dark background, accente violet/holografic — aliniat cu identitatea Planck.

### 5. Webhook unsubscribe

- MailerLite → Integrations → Webhooks
- URL: `https://www.planck.academy/api/mailerlite/webhook`
- Events: `subscriber.unsubscribed`
- Secret → `MAILERLITE_WEBHOOK_SECRET`

## Testare locală

```bash
# Logică eligibility
npx tsx scripts/test-reengagement-eligibility.ts

# Cron manual (cu server pornit)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reengagement
```

## Fișiere relevante

- `lib/reengagement/` — eligibility, personalizare, job runner
- `lib/mailerlite/client.ts` — client API
- `app/api/cron/reengagement/route.ts` — endpoint cron
- `app/api/mailerlite/webhook/route.ts` — sync unsubscribe
- `app/api/user/marketing-emails/route.ts` — opt-out user
- `supabase/migrations/20260622_reengagement_emails.sql` — schema
